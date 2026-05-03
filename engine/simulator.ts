/**
 * Simulateur macroéconomique — boucle step().
 *
 * Séquence d'appel à chaque trimestre :
 *  1. Appliquer la décision politique (taux directeur, RO)
 *  2. Marché monétaire → TMP
 *  3. Canal du crédit → taux débiteur, croissance crédit
 *  4. Courbe IS → output gap (avec chocs de demande)
 *  5. Courbe de Phillips → inflation (avec chocs d'offre)
 *  6. Mise à jour : anticipations, chômage (Okun), croissance PIB
 *  7. Décrémenter les chocs actifs
 *  8. Tirer de nouveaux chocs aléatoires (~15 %/trimestre)
 *  9. Construire le trace pédagogique
 */

import type { EconomicState, PolicyAction, Shock, SimulationResult } from './state'
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

const ALL_SHOCK_DEFS = [OIL_SHOCK, AGRICULTURAL_SHOCK, EXTERNAL_DEMAND_SHOCK, RISK_PREMIUM_SHOCK]

// Encours dépôts approximatif du système bancaire marocain (mds MAD)
const TOTAL_DEPOSITS_APPROX = 1_500

/** Avance la simulation d'un trimestre */
export function step(
  current: EconomicState,
  action: PolicyAction,
  activeShocks: Shock[],
  seed: number,
): SimulationResult {
  const rand = seededRandom(seed + current.quarter * 7919)

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
  const { interbankRate, liquidityNeed } = computeMonetaryMarket({
    policyRate: newPolicyRate,
    liquidityNeedPrev: current.liquidityNeed,
    reserveRequirementChange: action.reserveRequirementChangeBp / 100,
    marketOperations: action.marketOperationsBnMad,
    totalDeposits: TOTAL_DEPOSITS_APPROX,
  })

  // ── 3. Canal du crédit ───────────────────────────────────────────
  const riskPremiumShock = activeShocks
    .filter(s => s.type === 'financial')
    .reduce((acc, s) => acc + s.lendingRateImpact, 0)

  const { lendingRate, creditGrowth } = computeCreditChannel({
    lendingRatePrev: current.lendingRate,
    interbankRate,
    outputGap: current.outputGap,
    inflationExpected: current.inflationExpected,
    riskPremiumShock,
  })

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
  })

  // ── 5. Courbe de Phillips ────────────────────────────────────────
  const agriculturalShock = activeShocks
    .filter(s => s.type === 'supply' && s.id.startsWith('agricultural'))
    .reduce((acc, s) => acc + s.inflationImpact, 0)

  const supplyShock = activeShocks
    .filter(s => s.type === 'supply' && !s.id.startsWith('agricultural'))
    .reduce((acc, s) => acc + s.inflationImpact, 0)

  const { inflation, trace: phillipsTrace } = computePhillips({
    inflationExpected: current.inflationExpected,
    outputGap,
    exchangeRate: current.exchangeRate,
    exchangeRatePrev: current.exchangeRate, // régime de change quasi-fixe
    agriculturalShock,
    supplyShock,
  })

  // ── 6. Indicateurs dérivés ───────────────────────────────────────
  const inflationExpected =
    0.5 * current.inflationExpected + 0.5 * inflation

  const unemployment =
    PARAMS.unemploymentNatural - PARAMS.okunCoef * outputGap

  const POTENTIAL_GROWTH = 3.0
  const gdpGrowth = POTENTIAL_GROWTH + (outputGap - current.outputGap)

  // Inflation core : suit l'inflation totale avec inertie
  const inflationCore =
    PARAMS.infCoreSmoothing * current.inflationCore +
    (1 - PARAMS.infCoreSmoothing) * inflation

  // ── 7. Décrémenter les chocs ─────────────────────────────────────
  const updatedShocks = activeShocks
    .map(s => ({ ...s, remainingQuarters: s.remainingQuarters - 1 }))
    .filter(s => s.remainingQuarters > 0)

  // ── 8. Nouveaux chocs aléatoires ─────────────────────────────────
  const triggeredShocks: Shock[] = []
  const hasActiveShock = updatedShocks.length > 0
  const isFirstQuarter = current.quarter === 0

  if (!isFirstQuarter) {
    for (const def of ALL_SHOCK_DEFS) {
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

  // ── 9. Nouvel état ───────────────────────────────────────────────
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
    exchangeRate: current.exchangeRate,
    externalDemand: clamp(newExternalDemand, -5, 5),
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
      value: -(PARAMS.sigma * (current.lendingRate - current.inflationExpected)),
      explanation: `Effet taux réel : −σ·(i^D − π^e) = −${PARAMS.sigma}×${(current.lendingRate - current.inflationExpected).toFixed(2)}`,
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
): EconomicState {
  let state = start
  let activeShocks = [...shocks]
  for (let i = 0; i < n; i++) {
    const result = step(state, action, activeShocks, seed + i * 100)
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
