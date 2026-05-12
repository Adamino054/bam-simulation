/**
 * Courbe IS dynamique — demande agrégée marocaine.
 *
 * ỹ_t = ρ·ỹ_{t-1} − σ·(i^D_{t-1} − π^e_{t-1}) + δ·ỹ*_t + u^y_t + fiscal + guidance
 *
 * Où :
 *   ρ  = persistance de l'output gap (inertie cyclique)
 *   σ  = sensibilité au taux d'intérêt réel (coût du capital)
 *   δ  = degré d'ouverture (demande extérieure)
 *   u^y = somme des chocs de demande actifs
 *
 * Ajouts Task 1 : forward guidance confidence channel
 * Ajouts Task 2c : fiscal stance multiplier
 */

import { PARAMS } from '../parameters'
import type { CommunicationStance, FiscalStance } from '../state'

export interface ISCurveInputs {
  outputGapPrev: number        // ỹ_{t-1}
  lendingRatePrev: number      // i^D_{t-1}
  inflationExpectedPrev: number // π^e_{t-1}
  externalDemand: number       // ỹ*_t, output gap zone euro
  demandShock: number          // u^y_t, somme des chocs de demande
  // Task 1: forward guidance
  communicationStance?: CommunicationStance
  // Task 2c: fiscal stance
  fiscalStance?: FiscalStance
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
          externalDemand, demandShock,
          communicationStance = 'neutral',
          fiscalStance = 'neutral' } = inputs
  const { rho, sigma, delta } = PARAMS

  const realRate = lendingRatePrev - inflationExpectedPrev

  const persistenceComponent = rho * outputGapPrev
  const realRateComponent    = -sigma * realRate
  const externalComponent    = delta * externalDemand
  const shockComponent       = demandShock

  // Task 1: Forward guidance confidence channel
  let guidanceEffect = 0
  if (communicationStance === 'dovish') guidanceEffect = 0.08
  else if (communicationStance === 'hawkish') guidanceEffect = -0.06

  // Task 2c: Fiscal stance multiplier
  let fiscalEffect = 0
  if (fiscalStance === 'expansionary') fiscalEffect = 0.15
  else if (fiscalStance === 'contractionary') fiscalEffect = -0.10

  const outputGap =
    persistenceComponent +
    realRateComponent +
    externalComponent +
    shockComponent +
    guidanceEffect +
    fiscalEffect

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
