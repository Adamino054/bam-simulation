/**
 * Choc agricole (sécheresse) — choc d'offre spécifique au Maroc.
 * L'agriculture représente ~11 % du PIB et ~40 % de l'emploi rural.
 * Une mauvaise campagne céréalière pèse simultanément sur l'inflation
 * alimentaire et sur l'activité économique.
 */

import type { ShockDefinition } from './base'

export const AGRICULTURAL_SHOCK: ShockDefinition = {
  id: 'agricultural',
  label: 'Sécheresse agricole',
  type: 'supply',
  description:
    'Campagne céréalière déficitaire due à un déficit pluviométrique. L\'inflation alimentaire augmente et l\'activité économique ralentit dans les zones rurales.',
  probability: 0.08,
  durationRange: [2, 3],
  magnitudeRange: [0.3, 1.0],
  computeEffects(magnitude) {
    return {
      inflationImpact:      lerp(0.5, 2.0, magnitude),
      outputGapImpact:      lerp(-0.3, -0.8, magnitude),
      lendingRateImpact:    0,
      externalDemandImpact: 0,
    }
  },
}

function lerp(min: number, max: number, t: number): number {
  return min + (max - min) * t
}
