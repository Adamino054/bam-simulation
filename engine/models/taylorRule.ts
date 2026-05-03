/**
 * Règle de Taylor — benchmark affiché au joueur.
 *
 * i^bench_t = r* + π* + φ_π·(π_t − π*) + φ_y·ỹ_t
 *
 * NON appliquée automatiquement. Sert uniquement à afficher
 * au joueur la recommandation d'une banque centrale modélisée.
 */

import { PARAMS } from '../parameters'

export function computeTaylorRate(inflation: number, outputGap: number): number {
  const { rStar, piTarget, phiPi, phiY } = PARAMS
  const rate = rStar + piTarget + phiPi * (inflation - piTarget) + phiY * outputGap
  // Borne basse
  return Math.max(rate, PARAMS.effectiveLowerBound)
}
