/**
 * Pas de simulation du MOTEUR v5 — équations estimées sur données réelles.
 *
 * Même signature que le step() du v1 (interface EconomicState inchangée), mais le
 * cœur macro (activité, prix, chômage, croissance) passe par les équations OLS
 * estimées pré-COVID (voir engine/v5/modelsV5.ts). Le bloc bancaire (TMP, taux
 * débiteur, NPL, crédit) est conservé du v1 : le v5 ne le ré-estime pas.
 *
 * Deux modes :
 *  - mode 'jeu' (défaut) : le joueur fixe le taux directeur ; les chocs u^π/u^y
 *    viennent des chocs actifs du scénario, exactement comme dans le v1.
 *  - mode 'rejeu réel' : on injecte trimestre par trimestre les chocs identifiés
 *    (upi/uy des fichiers JSON) pour reproduire l'histoire observée.
 */

import type { EconomicState, PolicyAction, Shock, SimulationResult, ScenarioId } from '../state'
import { PARAMS } from '../parameters'
import { PARAMS_V5 } from './paramsV5'
import { phillipsV5, isCurveV5, okunV5, growthV5 } from './modelsV5'
import { computeMonetaryMarket } from '../models/monetaryMarket'
import { computeCreditChannel } from '../models/creditChannel'
import { seededRandom, instantiateShock } from '../shocks/base'
import { OIL_SHOCK } from '../shocks/oil'
import { AGRICULTURAL_SHOCK } from '../shocks/agricultural'
import { EXTERNAL_DEMAND_SHOCK } from '../shocks/externalDemand'
import { RISK_PREMIUM_SHOCK } from '../shocks/riskPremium'
import { DROUGHT_SHOCK } from '../shocks/drought'
import { CAPITAL_FLIGHT_SHOCK } from '../shocks/capitalFlight'

const ALL_SHOCK_DEFS = [OIL_SHOCK, AGRICULTURAL_SHOCK, EXTERNAL_DEMAND_SHOCK, RISK_PREMIUM_SHOCK, DROUGHT_SHOCK, CAPITAL_FLIGHT_SHOCK]
const TOTAL_DEPOSITS_APPROX = 1_500

function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x))
}

export interface StepV5Options {
  scenarioId?: ScenarioId
  previousPolicyRateChangeBp?: number
  fxInterventionHistory?: number[]
  /** Rejeu réel : chocs identifiés à injecter ce trimestre (résidus des équations) */
  realShocks?: { upi: number; uy: number; uu?: number }
  /** Historique de l'output gap pour Δ4 (croissance en variation annuelle) */
  outputGapLag4?: number
  /** Potentiel de croissance implicite pour ce trimestre (rejeu) */
  potentialGrowth?: number
  /**
   * false → utilise les coefficients ESTIMÉS (κ=0, σ=0,071) : les décisions du joueur
   * n'ont alors quasiment aucun effet, ce qui est le résultat économétrique brut.
   * Défaut → sensibilités de jeu (κ=0,15, σ=0,24), qui rendent les décisions visibles
   * sans altérer la fidélité au HCP (les constantes sont extraites avec ces valeurs).
   */
  useGameSensitivity?: boolean
}

/** Avance la simulation d'un trimestre — moteur v5 */
export function stepV5(
  current: EconomicState,
  action: PolicyAction,
  activeShocks: Shock[],
  seed: number,
  options?: StepV5Options,
): SimulationResult {
  const rand = seededRandom(seed + current.quarter * 7919)
  const scenarioId = options?.scenarioId

  // ── 1. Nouveau taux directeur et RO (identique v1) ──
  const newPolicyRate = Math.max(
    PARAMS.effectiveLowerBound,
    current.policyRate + action.policyRateChangeBp / 100,
  )
  const newReserveRequirement = Math.max(
    0,
    current.reserveRequirement + action.reserveRequirementChangeBp / 100,
  )

  // ── 2. Marché monétaire (bloc v1 conservé) ──
  const { interbankRate, liquidityNeed: rawLiquidityNeed } = computeMonetaryMarket({
    policyRate: newPolicyRate,
    liquidityNeedPrev: current.liquidityNeed,
    reserveRequirementChange: action.reserveRequirementChangeBp / 100,
    marketOperations: action.marketOperationsBnMad,
    totalDeposits: TOTAL_DEPOSITS_APPROX,
    nplRatio: current.nplRatio ?? PARAMS.nplBase,
    scenarioId,
  })
  const liquidityNeed = rawLiquidityNeed + action.fxInterventionBnMad - action.emergencyLendingBnMad

  // ── 3. Canal du crédit → taux débiteur (bloc v1 conservé) ──
  const riskPremiumShock = activeShocks
    .filter(s => s.type === 'financial')
    .reduce((acc, s) => acc + s.lendingRateImpact, 0)
  const credibilitySpread = current.centralBankCredibility < 40 ? 0.3 : 0
  const emergencyLendingEffect = -(action.emergencyLendingBnMad * 0.003)
  const { lendingRate } = computeCreditChannel({
    lendingRatePrev: current.lendingRate,
    interbankRate,
    riskPremiumShock: riskPremiumShock + credibilitySpread + emergencyLendingEffect,
    ccybRate: action.ccybRate ?? 0,
    nplRatio: current.nplRatio ?? PARAMS.nplBase,
  })

  // ── 3bis. Taux de change (flottement encadré du dirham) ──
  // Le dirham se déprécie quand le taux est bas, la crédibilité faible ou le déficit
  // courant creusé ; il se raffermit quand la banque intervient sur le marché des changes.
  const fx = PARAMS_V5.fx
  // Rappel vers le cours central (la banque défend une parité de référence) + pressions.
  const fxPressure =
    fx.meanReversion * (100 - current.exchangeRate)
    - fx.rateSensitivity * (newPolicyRate - current.policyRate)
    - fx.credibilitySensitivity * (current.centralBankCredibility - 70)
    + fx.currentAccountSensitivity * Math.max(0, -current.currentAccountBalance - 3)
    - fx.interventionSensitivity * action.fxInterventionBnMad
  const exchangeRate = clamp(current.exchangeRate + fxPressure, fx.bandLow, fx.bandHigh)
  const depreciationPct = (exchangeRate / current.exchangeRate - 1) * 100

  // ── 4. Chocs exogènes : soit rejeu réel, soit chocs du scénario ──
  const real = options?.realShocks
  const demandShock = real
    ? real.uy
    : activeShocks
        .filter(s => s.type === 'demand' || s.type === 'external')
        .reduce((acc, s) => acc + s.outputGapImpact + s.externalDemandImpact * PARAMS.delta, 0)
  const supplyShock = real
    ? real.upi
    : activeShocks
        .filter(s => s.type === 'supply')
        .reduce((acc, s) => acc + s.inflationImpact, 0)

  // ── 5. Courbe IS estimée → output gap ──
  const gameSens = options?.useGameSensitivity !== false
  const outputGap = isCurveV5({
    outputGapPrev: current.outputGap,
    policyRatePrev: current.policyRate,   // le taux directeur pilote le taux réel (v5 : σ sur i*)
    inflationPrev: current.inflation,
    demandShock,
    // Canal du crédit : le spread bancaire transmet à l'activité l'effet du CCyB,
    // de la réserve obligatoire, des opérations de marché et des prêts d'urgence.
    creditSpreadPrev: current.lendingRate - current.policyRate,
    // Forward guidance : une communication accommodante abaisse le taux perçu par les
    // agents, une communication restrictive le relève — sans toucher au taux directeur.
    guidanceShift: action.communicationStance === 'dovish' ? -PARAMS_V5.is.guidanceShift
      : action.communicationStance === 'hawkish' ? PARAMS_V5.is.guidanceShift : 0,
    // Impulsion budgétaire du scénario (relance ou consolidation).
    fiscalImpulse: current.fiscalStance === 'expansionary' ? 1
      : current.fiscalStance === 'contractionary' ? -1 : 0,
    useGameSigma: gameSens,
  })

  // ── 6. Courbe de Phillips estimée → inflation ──
  const inflation = phillipsV5({
    inflationPrev: current.inflation,
    outputGapPrev: current.outputGap,
    supplyShock,
    // Canal des anticipations : la crédibilité de la banque agit sur les prix.
    inflationExpectedPrev: current.inflationExpected,
    // Canal du change : la dépréciation du dirham renchérit les importations.
    depreciationPct,
    useGameKappa: gameSens,
  })

  // ── 7. Chômage : Okun estimé en différences (hystérèse + saison + sécheresse) ──
  // CORRECTION : en mode jeu, le choc sécheresse ne s'applique QUE si un choc
  // agricole/sécheresse est réellement actif ce trimestre, et son intensité vient
  // de la magnitude du choc — PAS du choc annuel entier réappliqué chaque trimestre
  // (bug qui faisait dériver le chômage à 16 %). En rejeu réel, on prend le choc
  // annuel HCP réparti sur l'année (agriShockAnnual/4 dans okunV5).
  const droughtActive = activeShocks.some(
    s => s.type === 'supply' && (s.id.startsWith('agricultural') || s.id.startsWith('drought')),
  )
  const droughtMagnitude = activeShocks
    .filter(s => s.type === 'supply' && (s.id.startsWith('agricultural') || s.id.startsWith('drought')))
    .reduce((acc, s) => acc + s.magnitude, 0)
  const agriShockAnnual = real
    ? (PARAMS_V5.agriShockByYear[current.date.year] ?? 0)
    : droughtActive
      ? -1.5 * Math.min(1, droughtMagnitude) // choc borné : une sécheresse ≈ -1.5 pp d'emploi agri/an
      : 0
  const unemployment = okunV5({
    unemploymentPrev: current.unemployment,
    outputGap,
    outputGapPrev: current.outputGap,
    quarter: current.date.q,
    agriShockAnnual,
    // Choc historique du marché du travail : ancre le chômage sur l'observé en rejeu.
    laborShock: real?.uu ?? 0,
    useGameC: gameSens,
  })

  // ── 8. Croissance : g = g^pot + (ỹ_t − ỹ_{t−4}) ──
  const gdpGrowth = growthV5({
    outputGap,
    outputGapLag4: options?.outputGapLag4 ?? current.outputGap,
    potentialGrowth: options?.potentialGrowth,
  })

  // ── 9. Anticipations, inflation core (conservés, simplifiés) ──
  const phi = 0.6
  const lambda_cred = (current.centralBankCredibility / 100) * 0.4
  const adaptiveExpectation = phi * current.inflationExpected + (1 - phi) * inflation
  const inflationExpected = lambda_cred * PARAMS.piTarget + (1 - lambda_cred) * adaptiveExpectation
  const inflationCore =
    PARAMS.infCoreSmoothing * current.inflationCore + (1 - PARAMS.infCoreSmoothing) * inflation

  // ── 10. Bloc bancaire NPL + crédit (v1 conservé) ──
  const bubblePrev = current.assetBubbleIndex ?? 0
  const deltaNpl =
    PARAMS.nplSensRate * Math.max(0, lendingRate - PARAMS.rStar - PARAMS.piTarget - PARAMS.bankMargin) -
    PARAMS.nplSensGrowth * outputGap +
    // Une bulle d'actifs très gonflée fragilise les bilans bancaires.
    PARAMS_V5.bubble.nplImpact * Math.max(0, bubblePrev - 60)
  const currentNpl = current.nplRatio ?? PARAMS.nplBase
  const newNplRatio = clamp(currentNpl + deltaNpl * 0.25, 2.0, 25.0)

  const delta_i = interbankRate - current.interbankRate
  const delta_npl_val = newNplRatio - currentNpl
  const delta_y = outputGap - current.outputGap
  let deltaCredit = -1.5 * delta_i - 0.8 * delta_npl_val + 0.6 * delta_y
  const isCreditCrisis = scenarioId === 'crisis2008' || delta_npl_val > 4
  deltaCredit = clamp(deltaCredit, isCreditCrisis ? -8 : -3, isCreditCrisis ? 8 : 3)
  const creditGrowth = clamp((current.creditGrowth ?? 5.0) + deltaCredit, -10, 30)

  // ── 10bis. Bulle d'actifs : crédit abondant et taux réel bas la gonflent ──
  const bub = PARAMS_V5.bubble
  const realRateNow = newPolicyRate - inflation
  const assetBubbleIndex = clamp(
    bubblePrev + bub.creditSensitivity * (creditGrowth - 8) / 4
      - bub.rateSensitivity * realRateNow / 4, 0, 100)

  // ── 11. Crédibilité, solde courant (v1 conservé, simplifié) ──
  let newCredibility = current.centralBankCredibility
  const inflationDeviation = Math.abs(inflation - PARAMS.piTarget)
  if (inflationDeviation <= 0.5) newCredibility += 2
  if (inflationDeviation > 2) newCredibility -= 3
  newCredibility = clamp(newCredibility, 20, 100)
  const deltaCurrentAccount = 0.4 * current.externalDemand - 0.15 * inflation + 0.10 * outputGap
  const newCurrentAccountBalance = clamp(current.currentAccountBalance + deltaCurrentAccount * 0.25, -15, 10)

  // ── 12. Chocs : décrément + tirage (identique v1, désactivé en rejeu réel) ──
  const updatedShocks = activeShocks
    .map(s => ({ ...s, remainingQuarters: s.remainingQuarters - 1 }))
    .filter(s => s.remainingQuarters > 0)
  const triggeredShocks: Shock[] = []
  if (!real && current.quarter !== 0) {
    const hasActiveShock = updatedShocks.length > 0
    for (const def of ALL_SHOCK_DEFS) {
      if (def.id === 'capital_flight' &&
          current.centralBankCredibility >= 50 && current.currentAccountBalance >= -5) continue
      const alreadyActive = updatedShocks.some(s => s.id.startsWith(def.id))
      if (!alreadyActive && rand() < def.probability && !hasActiveShock) {
        triggeredShocks.push(instantiateShock(def, rand, current.quarter)); break
      }
    }
  }

  // ── 13. Nouvel état ──
  const nextQ = (((current.date.q) % 4) + 1) as 1 | 2 | 3 | 4
  const nextYear = nextQ === 1 ? current.date.year + 1 : current.date.year
  const newState: EconomicState = {
    quarter: current.quarter + 1,
    date: { year: nextYear, q: nextQ },
    inflation: clamp(inflation, -5, 30),
    inflationCore: clamp(inflationCore, -3, 25),
    inflationExpected: clamp(inflationExpected, -3, 20),
    gdpGrowth: clamp(gdpGrowth, -15, 15),
    outputGap: clamp(outputGap, -14, 10),
    unemployment: clamp(unemployment, 1, 30),
    policyRate: newPolicyRate,
    interbankRate: clamp(interbankRate, 0, 15),
    lendingRate: clamp(lendingRate, 1, 20),
    reserveRequirement: newReserveRequirement,
    creditGrowth: clamp(creditGrowth, -10, 30),
    liquidityNeed: clamp(liquidityNeed, 0, 300),
    nplRatio: newNplRatio,
    exchangeRate,
    externalDemand: current.externalDemand,
    centralBankCredibility: newCredibility,
    currentAccountBalance: newCurrentAccountBalance,
    fiscalStance: current.fiscalStance,
    financialInnovationActive: current.financialInnovationActive ?? false,
    assetBubbleIndex,
  }

  const trace: SimulationResult['trace'] = {
    inflation_expectations: {
      value: PARAMS_V5.phillips.a * current.inflation,
      explanation: `v5 — inertie estimée : a·π_{t-1} = ${PARAMS_V5.phillips.a}×${current.inflation.toFixed(2)} = ${(PARAMS_V5.phillips.a * current.inflation).toFixed(2)} %`,
    },
    inflation_supply: {
      value: supplyShock,
      explanation: `Choc d'offre u^π (importé : blé, énergie) = ${supplyShock.toFixed(2)} %. Sans lui, la Phillips estimée ne génère pas 2022 (κ≈0).`,
    },
    output_gap_real_rate: {
      value: -PARAMS_V5.is.sigma * (current.policyRate - current.inflation),
      explanation: `v5 — effet taux réel estimé : −σ·(i*−π) = −${PARAMS_V5.is.sigma}×${(current.policyRate - current.inflation).toFixed(2)} (σ non significatif : effet faible)`,
    },
    unemployment_okun: {
      value: unemployment - current.unemployment,
      explanation: `v5 — Δu = saison(T${current.date.q}) + c·Δgap − ψ·agri. Hystérèse : pas de retour vers un NAIRU.`,
    },
  }

  return { newState, triggeredShocks, trace }
}
