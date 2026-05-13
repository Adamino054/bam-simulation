/**
 * Simulateur macroéconomique — boucle step().
 *
 * Séquence d'appel à chaque trimestre :
 *  1. Appliquer la décision politique (taux directeur, RO)
 *  2. Marché monétaire → TMP (with FX intervention + emergency lending)
 *  3. Canal du crédit → taux débiteur, croissance crédit
 *  4. Courbe IS → output gap (avec chocs de demande, guidance, fiscal)
 *  5. Courbe de Phillips → inflation (avec chocs d'offre, guidance, credibility)
 *  6. Mise à jour : anticipations (expectations channel), chômage (Okun), croissance PIB
 *  7. Update credibility, current account balance, fiscal stance
 *  8. Décrémenter les chocs actifs
 *  9. Tirer de nouveaux chocs aléatoires
 * 10. Construire le trace pédagogique
 */

import type { EconomicState, PolicyAction, Shock, SimulationResult, FiscalStance, ScenarioId } from './state'
import { PARAMS, INITIAL_STATE } from './parameters'
import { computePhillips } from './models/phillips'
import { computeISCurve } from './models/isCurve'
import { computeMonetaryMarket } from './models/monetaryMarket'
import { computeCreditChannel } from './models/creditChannel'
import { seededRandom, instantiateShock } from './shocks/base'
import { OIL_SHOCK } from './shocks/oil'
import { AGRICULTURAL_SHOCK } from './shocks/agricultural'
import { EXTERNAL_DEMAND_SHOCK } from './shocks/externalDemand'
import { RISK_PREMIUM_SHOCK } from './shocks/riskPremium'
import { DROUGHT_SHOCK } from './shocks/drought'
import { CAPITAL_FLIGHT_SHOCK } from './shocks/capitalFlight'

const ALL_SHOCK_DEFS = [OIL_SHOCK, AGRICULTURAL_SHOCK, EXTERNAL_DEMAND_SHOCK, RISK_PREMIUM_SHOCK, DROUGHT_SHOCK, CAPITAL_FLIGHT_SHOCK]

// Encours dépôts approximatif du système bancaire marocain (mds MAD)
const TOTAL_DEPOSITS_APPROX = 1_500

/** Avance la simulation d'un trimestre */
export function step(
  current: EconomicState,
  action: PolicyAction,
  activeShocks: Shock[],
  seed: number,
  options?: {
    scenarioId?: ScenarioId
    previousPolicyRateChangeBp?: number
    fxInterventionHistory?: number[]
  },
): SimulationResult {
  const rand = seededRandom(seed + current.quarter * 7919)
  const scenarioId = options?.scenarioId
  const previousPolicyRateChangeBp = options?.previousPolicyRateChangeBp ?? 0

  // ── 1. Nouveau taux directeur et RO ─────────────────────────────
  const newPolicyRate = Math.max(
    PARAMS.effectiveLowerBound,
    current.policyRate + action.policyRateChangeBp / 100,
  )
  const newReserveRequirement = Math.max(
    0,
    current.reserveRequirement + action.reserveRequirementChangeBp / 100,
  )

  // ── 2. Marché monétaire ──────────────────────────────────────────
  const { interbankRate, liquidityNeed: rawLiquidityNeed } = computeMonetaryMarket({
    policyRate: newPolicyRate,
    liquidityNeedPrev: current.liquidityNeed,
    reserveRequirementChange: action.reserveRequirementChangeBp / 100,
    marketOperations: action.marketOperationsBnMad,
    totalDeposits: TOTAL_DEPOSITS_APPROX,
  })

  // Task 1: FX intervention adds to liquidity need (positive = tightens)
  let liquidityNeed = rawLiquidityNeed + action.fxInterventionBnMad

  // Task 1: Emergency lending reduces liquidity need
  liquidityNeed = liquidityNeed - action.emergencyLendingBnMad

  // ── 3. Canal du crédit ───────────────────────────────────────────
  const riskPremiumShock = activeShocks
    .filter(s => s.type === 'financial')
    .reduce((acc, s) => acc + s.lendingRateImpact, 0)

  // Task 2a: Low credibility increases lending rate spread
  const credibilitySpread = current.centralBankCredibility < 40 ? 0.3 : 0

  // Task 1: Emergency lending reduces lending rate
  const emergencyLendingEffect = -(action.emergencyLendingBnMad * 0.003)

  const { lendingRate: baseLendingRate, creditGrowth } = computeCreditChannel({
    lendingRatePrev: current.lendingRate,
    interbankRate,
    outputGap: current.outputGap,
    inflationExpected: current.inflationExpected,
    riskPremiumShock: riskPremiumShock + credibilitySpread + emergencyLendingEffect,
    ccybRate: action.ccybRate ?? 0,
    nplRatio: current.nplRatio ?? PARAMS.nplBase,
  })

  const lendingRate = baseLendingRate

  // ── Innovation Financière (Kuttner & Mosser) ─────────────────────
  // La titrisation fragmente le bilan bancaire et affaiblit la transmission
  // des taux directeurs vers l'économie réelle. Se déclenche après le 8e
  // trimestre avec 15 % de probabilité par trimestre.
  const currentFinancialInnovation = current.financialInnovationActive ?? false
  let newFinancialInnovationActive = currentFinancialInnovation
  if (!currentFinancialInnovation && current.quarter >= 8 && rand() < 0.15) {
    newFinancialInnovationActive = true
  }
  // Si actif, σ est divisé par 2 : les hausses de taux mordent moins sur l'investissement
  const effectiveSigma = newFinancialInnovationActive ? PARAMS.sigma / 2 : undefined

  // ── 4. Courbe IS ─────────────────────────────────────────────────
  const demandShockTotal = activeShocks
    .filter(s => s.type === 'demand' || s.type === 'external')
    .reduce((acc, s) => acc + s.outputGapImpact + s.externalDemandImpact * PARAMS.delta, 0)

  const externalDemandFromShocks = activeShocks
    .filter(s => s.type === 'external')
    .reduce((acc, s) => acc + s.externalDemandImpact, 0)
  const newExternalDemand = current.externalDemand + externalDemandFromShocks

  const { outputGap } = computeISCurve({
    outputGapPrev: current.outputGap,
    lendingRatePrev: current.lendingRate,
    inflationExpectedPrev: current.inflationExpected,
    externalDemand: newExternalDemand,
    demandShock: demandShockTotal,
    communicationStance: action.communicationStance,
    fiscalStance: current.fiscalStance,
    sigmaOverride: effectiveSigma,
  })

  // ── 5. Courbe de Phillips ────────────────────────────────────────
  const agriculturalShock = activeShocks
    .filter(s => s.type === 'supply' && (s.id.startsWith('agricultural') || s.id.startsWith('drought')))
    .reduce((acc, s) => acc + s.inflationImpact, 0)

  const supplyShock = activeShocks
    .filter(s => s.type === 'supply' && !s.id.startsWith('agricultural') && !s.id.startsWith('drought'))
    .reduce((acc, s) => acc + s.inflationImpact, 0)

  // Task 1: Emergency lending inflation risk
  const emergencyInflationRisk = action.emergencyLendingBnMad * 0.005

  // Handle exchange rate for flexibilite scenario
  let newExchangeRate = current.exchangeRate
  if (scenarioId === 'flexibilite') {
    // Random ±1.5% per quarter
    const exchangeShock = (rand() - 0.5) * 3.0
    newExchangeRate = current.exchangeRate * (1 + exchangeShock / 100)
  }

  const alphaOverride = scenarioId === 'flexibilite' ? PARAMS.alpha * 2 : undefined

  const { inflation, trace: phillipsTrace } = computePhillips({
    inflationExpected: current.inflationExpected,
    outputGap,
    exchangeRate: newExchangeRate,
    exchangeRatePrev: current.exchangeRate,
    agriculturalShock,
    supplyShock: supplyShock + emergencyInflationRisk,
    communicationStance: action.communicationStance,
    credibility: current.centralBankCredibility,
    alphaOverride,
  })

  // ── 6. Indicateurs dérivés ───────────────────────────────────────
  // Task 2d: Expectations channel with credibility anchoring
  const lambda_cred = (current.centralBankCredibility / 100) * 0.4
  const phi = 0.6
  const adaptiveExpectation = phi * current.inflationExpected + (1 - phi) * inflation
  const inflationExpected =
    lambda_cred * PARAMS.piTarget + (1 - lambda_cred) * adaptiveExpectation

  const unemployment =
    PARAMS.unemploymentNatural - PARAMS.okunCoef * outputGap

  const POTENTIAL_GROWTH = 3.0
  const gdpGrowth = POTENTIAL_GROWTH + (outputGap - current.outputGap)

  // Inflation core : suit l'inflation totale avec inertie
  const inflationCore =
    PARAMS.infCoreSmoothing * current.inflationCore +
    (1 - PARAMS.infCoreSmoothing) * inflation

  // ── 7. Update credibility, current account, fiscal stance ────────

  // Task 2a: Credibility update
  let newCredibility = current.centralBankCredibility
  const inflationDeviation = Math.abs(inflation - PARAMS.piTarget)
  if (inflationDeviation <= 0.5) {
    newCredibility += 2
  }
  if (inflationDeviation > 2) {
    newCredibility -= 3
  }
  // Policy rate reversal penalty
  const isReversal = (previousPolicyRateChangeBp > 0 && action.policyRateChangeBp < 0) ||
                     (previousPolicyRateChangeBp < 0 && action.policyRateChangeBp > 0)
  if (isReversal) {
    newCredibility -= 1
  }
  // FX intervention credibility boost (sustained over 2+ quarters)
  const fxHistory = options?.fxInterventionHistory ?? []
  if (fxHistory.length >= 2 && fxHistory.every(v => v > 0) && action.fxInterventionBnMad > 0) {
    newCredibility = Math.min(100, newCredibility + 0.1)
  }
  newCredibility = clamp(newCredibility, 20, 100)

  // Task 2b: Current account balance
  const currentAccountShock = activeShocks
    .reduce((acc, s) => acc + (s.currentAccountImpact ?? 0), 0)
  const deltaCurrentAccount =
    0.4 * newExternalDemand - 0.15 * inflation + 0.10 * outputGap + currentAccountShock
  const newCurrentAccountBalance = current.currentAccountBalance + deltaCurrentAccount * 0.25 // quarterly adjustment

  // Task 2c: Fiscal stance (changes every 4 quarters)
  let newFiscalStance: FiscalStance = current.fiscalStance
  if ((current.quarter + 1) % 4 === 0) {
    if (outputGap > 1) newFiscalStance = 'contractionary'
    else if (outputGap < -1) newFiscalStance = 'expansionary'
    else newFiscalStance = 'neutral'
  }

  // Task 4: NPL dynamics (Stabilité Financière)
  // Les NPL montent quand les taux débiteurs sont élevés ou en récession (outputGap négatif).
  const deltaNpl =
    PARAMS.nplSensRate * Math.max(0, lendingRate - PARAMS.rStar - PARAMS.piTarget - PARAMS.bankMargin) -
    PARAMS.nplSensGrowth * outputGap
  const currentNpl = current.nplRatio ?? PARAMS.nplBase
  const newNplRatio = clamp(currentNpl + deltaNpl * 0.25, 2.0, 25.0) // Lissage trimestriel

  // ── Bulle Spéculative (BCE Risk-taking / Tobin's q) ─────────────
  // Des taux bas prolongés stimulent la prise de risque excessive et gonflent
  // le prix des actifs (canal de la prise de risque, Borio & Zhu 2012).
  // Taux neutre théorique (règle de Taylor): r* + π^e
  const neutralRate = PARAMS.rStar + current.inflationExpected
  const rateGap = neutralRate - newPolicyRate // positif = taux directeur trop bas vs neutre

  const currentBubble = current.assetBubbleIndex ?? 0
  let newAssetBubbleIndex: number
  if (rateGap > 0.5) {
    // Chaque pp d'écart au taux neutre gonfle la bulle de ~3,5 pts/trimestre (max 8)
    newAssetBubbleIndex = currentBubble + clamp(rateGap * 3.5, 1, 8)
  } else if (rateGap < -0.5) {
    // Resserrement actif : dégonflement accéléré
    newAssetBubbleIndex = currentBubble - clamp(-rateGap * 3.0, 1, 6)
  } else {
    // Zone neutre : légère déflation naturelle
    newAssetBubbleIndex = currentBubble - 0.5
  }
  newAssetBubbleIndex = clamp(newAssetBubbleIndex, 0, 100)

  // ── 8. Décrémenter les chocs ─────────────────────────────────────
  const updatedShocks = activeShocks
    .map(s => ({ ...s, remainingQuarters: s.remainingQuarters - 1 }))
    .filter(s => s.remainingQuarters > 0)

  // ── 9. Nouveaux chocs aléatoires ─────────────────────────────────
  const triggeredShocks: Shock[] = []
  const hasActiveShock = updatedShocks.length > 0
  const isFirstQuarter = current.quarter === 0

  if (!isFirstQuarter) {
    for (const def of ALL_SHOCK_DEFS) {
      // Capital flight: conditional trigger
      if (def.id === 'capital_flight') {
        if (current.centralBankCredibility >= 50 && current.currentAccountBalance >= -5) {
          continue // Skip if conditions aren't met
        }
      }

      const alreadyActive = updatedShocks.some(s => s.id.startsWith(def.id))
      if (!alreadyActive && rand() < def.probability && !hasActiveShock) {
        const shock = instantiateShock(def, rand, current.quarter)
        triggeredShocks.push(shock)
        break // un seul nouveau choc par trimestre
      } else if (!alreadyActive && rand() < def.probability) {
        const shock = instantiateShock(def, rand, current.quarter)
        triggeredShocks.push(shock)
        break
      }
    }
  }

  // Éclatement de la bulle spéculative si l'indice atteint 100
  // → destruction de richesse, credit crunch, récession (Minsky moment)
  if (newAssetBubbleIndex >= 100 && currentBubble < 100) {
    const alreadyBurst = updatedShocks.some(s => s.id.startsWith('bubble_burst'))
    if (!alreadyBurst) {
      triggeredShocks.push({
        id: `bubble_burst_q${current.quarter}`,
        label: 'Éclatement de la bulle spéculative',
        type: 'financial',
        magnitude: 1.0,
        remainingQuarters: 4,
        description: "L'accumulation excessive de risque sur les marchés a provoqué l'effondrement des prix d'actifs. Destruction de richesse, credit crunch et récession sévère.",
        inflationImpact: -1.5,
        outputGapImpact: -2.5,
        lendingRateImpact: 2.0,
        externalDemandImpact: -0.5,
      })
      newAssetBubbleIndex = 15 // Réinitialisation avec cicatrice post-crise
    }
  }

  // Task 2b: Auto-trigger risk premium if current account < -6%
  if (newCurrentAccountBalance < -6) {
    const hasRiskShock = [...updatedShocks, ...triggeredShocks].some(s => s.id.startsWith('risk_premium'))
    if (!hasRiskShock) {
      triggeredShocks.push({
        id: `risk_premium_ca_q${current.quarter}`,
        label: 'Pression sur le solde courant',
        type: 'financial',
        magnitude: 0.6,
        remainingQuarters: 2,
        description: 'Le déficit courant dépasse −6 % du PIB, déclenchant une hausse de la prime de risque.',
        inflationImpact: 0,
        outputGapImpact: -0.3,
        lendingRateImpact: 0.6,
        externalDemandImpact: 0,
      })
    }
  }

  // ── 10. Nouvel état ──────────────────────────────────────────────
  const nextQ = (((current.date.q) % 4) + 1) as 1 | 2 | 3 | 4
  const nextYear = nextQ === 1 ? current.date.year + 1 : current.date.year

  const newState: EconomicState = {
    quarter: current.quarter + 1,
    date: { year: nextYear, q: nextQ },
    inflation: clamp(inflation, -5, 30),
    inflationCore: clamp(inflationCore, -3, 25),
    inflationExpected: clamp(inflationExpected, -3, 20),
    gdpGrowth: clamp(gdpGrowth, -15, 15),
    outputGap: clamp(outputGap, -10, 10),
    unemployment: clamp(unemployment, 1, 30),
    policyRate: newPolicyRate,
    interbankRate: clamp(interbankRate, 0, 15),
    lendingRate: clamp(lendingRate, 1, 20),
    reserveRequirement: newReserveRequirement,
    creditGrowth: clamp(creditGrowth, -10, 30),
    liquidityNeed: clamp(liquidityNeed, 0, 300),
    nplRatio: newNplRatio,
    exchangeRate: newExchangeRate,
    externalDemand: clamp(newExternalDemand, -5, 5),
    centralBankCredibility: newCredibility,
    currentAccountBalance: clamp(newCurrentAccountBalance, -15, 10),
    fiscalStance: newFiscalStance,
    financialInnovationActive: newFinancialInnovationActive,
    assetBubbleIndex: clamp(newAssetBubbleIndex, 0, 100),
  }

  const trace: SimulationResult['trace'] = {
    inflation_expectations: {
      value: phillipsTrace.expectationsComponent,
      explanation: `Composante anticipations : β·π^e = ${PARAMS.beta}×${current.inflationExpected.toFixed(2)} = ${phillipsTrace.expectationsComponent.toFixed(2)} %`,
    },
    inflation_demand: {
      value: phillipsTrace.demandComponent,
      explanation: `Pression de demande : κ·ỹ = ${PARAMS.kappa}×${outputGap.toFixed(2)} = ${phillipsTrace.demandComponent.toFixed(2)} %`,
    },
    inflation_supply: {
      value: phillipsTrace.shockComponent,
      explanation: `Chocs d'offre actifs : ${phillipsTrace.shockComponent.toFixed(2)} %`,
    },
    output_gap_real_rate: {
      value: -((effectiveSigma ?? PARAMS.sigma) * (current.lendingRate - current.inflationExpected)),
      explanation: `Effet taux réel : −σ·(i^D − π^e) = −${(effectiveSigma ?? PARAMS.sigma).toFixed(2)}×${(current.lendingRate - current.inflationExpected).toFixed(2)}${newFinancialInnovationActive ? ' [σ÷2 : canal affaibli par innovation financière]' : ''}`,
    },
  }

  return {
    newState,
    triggeredShocks,
    trace,
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

/** Simule N trimestres en silence (pour la preview et les tests) */
export function simulateN(
  start: EconomicState,
  action: PolicyAction,
  shocks: Shock[],
  n: number,
  seed: number,
  scenarioId?: ScenarioId,
): EconomicState {
  let state = start
  let activeShocks = [...shocks]
  for (let i = 0; i < n; i++) {
    const result = step(state, action, activeShocks, seed + i * 100, { scenarioId })
    state = result.newState
    activeShocks = [
      ...activeShocks
        .map(s => ({ ...s, remainingQuarters: s.remainingQuarters - 1 }))
        .filter(s => s.remainingQuarters > 0),
      ...result.triggeredShocks,
    ]
  }
  return state
}

export { INITIAL_STATE }
