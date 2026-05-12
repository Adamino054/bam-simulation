/**
 * Choc de sécheresse prolongée — choc d'offre spécifique au Maroc.
 * L'agriculture représente ~11 % du PIB et ~40 % de l'emploi rural.
 * Une sécheresse prolongée affecte à la fois l'inflation alimentaire
 * et l'activité économique sur une durée plus longue qu'un simple
 * déficit pluviométrique saisonnier.
 */

import type { ShockDefinition } from './base'

export const DROUGHT_SHOCK: ShockDefinition = {
  id: 'drought',
  label: 'Sécheresse prolongée',
  type: 'supply',
  description:
    'Sécheresse sévère et prolongée affectant la production agricole. L\'inflation alimentaire augmente fortement et l\'activité économique ralentit dans les zones rurales, avec un impact sur plus de 20 % de l\'emploi rural.',
  probability: 0.08,
  durationRange: [3, 5],
  magnitudeRange: [0.3, 1.0],
  computeEffects(magnitude) {
    return {
      inflationImpact:      lerp(1.5, 3.0, magnitude),
      outputGapImpact:      lerp(-0.5, -1.2, magnitude),
      lendingRateImpact:    0,
      externalDemandImpact: 0,
    }
  },
}

function lerp(min: number, max: number, t: number): number {
  return min + (max - min) * t
}
