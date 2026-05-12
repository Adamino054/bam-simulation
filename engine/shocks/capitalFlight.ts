/**
 * Choc de fuite de capitaux — choc financier.
 * Se déclenche uniquement si la crédibilité de BAM est basse (<50)
 * ou si le solde courant est très déficitaire (<-5%).
 * Provoque une hausse du coût du crédit et une détérioration
 * du solde courant.
 */

import type { ShockDefinition } from './base'

export const CAPITAL_FLIGHT_SHOCK: ShockDefinition = {
  id: 'capital_flight',
  label: 'Fuite de capitaux',
  type: 'financial',
  description:
    'Sortie massive de capitaux provoquée par une perte de confiance des investisseurs. Le coût de financement augmente et le solde courant se dégrade.',
  probability: 0.06,
  durationRange: [2, 3],
  magnitudeRange: [0.3, 1.0],
  computeEffects(magnitude) {
    return {
      inflationImpact:        0,
      outputGapImpact:        lerp(-0.3, -0.6, magnitude),
      lendingRateImpact:      lerp(1.0, 2.5, magnitude),
      externalDemandImpact:   0,
      currentAccountImpact:   lerp(-1.0, -2.0, magnitude),
    }
  },
}

function lerp(min: number, max: number, t: number): number {
  return min + (max - min) * t
}
