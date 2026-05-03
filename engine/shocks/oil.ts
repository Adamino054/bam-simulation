/**
 * Choc pétrolier — choc d'offre.
 * Le Maroc est importateur net de pétrole : un choc haussier
 * sur les prix mondiaux se transmet directement à l'inflation.
 */

import type { ShockDefinition } from './base'

export const OIL_SHOCK: ShockDefinition = {
  id: 'oil',
  label: 'Choc pétrolier',
  type: 'supply',
  description:
    'Hausse des prix mondiaux du pétrole brut. Le Maroc, importateur net d\'énergie, subit une pression inflationniste directe via le carburant et l\'énergie.',
  probability: 0.05,
  durationRange: [2, 4],
  magnitudeRange: [0.3, 1.0],
  computeEffects(magnitude) {
    return {
      inflationImpact:      lerp(1.0, 3.0, magnitude),
      outputGapImpact:      lerp(-0.3, -0.8, magnitude),
      lendingRateImpact:    0,
      externalDemandImpact: 0,
    }
  },
}

function lerp(min: number, max: number, t: number): number {
  return min + (max - min) * t
}
