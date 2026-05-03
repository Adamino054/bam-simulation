/**
 * Choc de demande externe — récession zone euro.
 * L'UE représente ~65 % des exportations marocaines et des recettes touristiques.
 * Un ralentissement européen comprime l'output gap via le canal extérieur.
 */

import type { ShockDefinition } from './base'

export const EXTERNAL_DEMAND_SHOCK: ShockDefinition = {
  id: 'external_demand',
  label: 'Récession zone euro',
  type: 'external',
  description:
    'Ralentissement marqué de la croissance en zone euro. Les exportations marocaines, le tourisme et les transferts des MRE sont pénalisés.',
  probability: 0.04,
  durationRange: [4, 6],
  magnitudeRange: [0.3, 1.0],
  computeEffects(magnitude) {
    return {
      inflationImpact:      lerp(-0.3, -0.8, magnitude),
      outputGapImpact:      0,
      lendingRateImpact:    0,
      externalDemandImpact: lerp(-1.0, -2.0, magnitude),
    }
  },
}

function lerp(min: number, max: number, t: number): number {
  return min + (max - min) * t
}
