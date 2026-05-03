/**
 * Courbe IS dynamique — demande agrégée marocaine.
 *
 * ỹ_t = ρ·ỹ_{t-1} − σ·(i^D_{t-1} − π^e_{t-1}) + δ·ỹ*_t + u^y_t
 *
 * Où :
 *   ρ  = persistance de l'output gap (inertie cyclique)
 *   σ  = sensibilité au taux d'intérêt réel (coût du capital)
 *   δ  = degré d'ouverture (demande extérieure)
 *   u^y = somme des chocs de demande actifs
 */

import { PARAMS } from '../parameters'

export interface ISCurveInputs {
  outputGapPrev: number        // ỹ_{t-1}
  lendingRatePrev: number      // i^D_{t-1}
  inflationExpectedPrev: number // π^e_{t-1}
  externalDemand: number       // ỹ*_t, output gap zone euro
  demandShock: number          // u^y_t, somme des chocs de demande
}

export interface ISCurveResult {
  outputGap: number
  realRate: number
  trace: {
    persistenceComponent: number
    realRateComponent: number
    externalComponent: number
    shockComponent: number
  }
}

export function computeISCurve(inputs: ISCurveInputs): ISCurveResult {
  const { outputGapPrev, lendingRatePrev, inflationExpectedPrev,
          externalDemand, demandShock } = inputs
  const { rho, sigma, delta } = PARAMS

  const realRate = lendingRatePrev - inflationExpectedPrev

  const persistenceComponent = rho * outputGapPrev
  const realRateComponent    = -sigma * realRate
  const externalComponent    = delta * externalDemand
  const shockComponent       = demandShock

  const outputGap =
    persistenceComponent +
    realRateComponent +
    externalComponent +
    shockComponent

  return {
    outputGap,
    realRate,
    trace: {
      persistenceComponent,
      realRateComponent,
      externalComponent,
      shockComponent,
    },
  }
}
