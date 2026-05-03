/**
 * Choc de prime de risque — choc financier.
 * Un renchérissement soudain du risque pays ou un stress sur les marchés
 * obligataires se traduit par une hausse du spread et du coût du crédit.
 */

import type { ShockDefinition } from './base'

export const RISK_PREMIUM_SHOCK: ShockDefinition = {
  id: 'risk_premium',
  label: 'Choc de prime de risque',
  type: 'financial',
  description:
    'Montée des spreads souverains et tension sur les marchés de capitaux. Le coût de financement des entreprises et des ménages augmente au-delà de ce que justifie la politique monétaire.',
  probability: 0.03,
  durationRange: [2, 3],
  magnitudeRange: [0.3, 1.0],
  computeEffects(magnitude) {
    return {
      inflationImpact:      0,
      outputGapImpact:      lerp(-0.2, -0.5, magnitude),
      lendingRateImpact:    lerp(0.5, 1.5, magnitude),
      externalDemandImpact: 0,
    }
  },
}

function lerp(min: number, max: number, t: number): number {
  return min + (max - min) * t
}
