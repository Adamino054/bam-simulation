/**
 * Courbe de Phillips augmentée des anticipations — version marocaine.
 *
 * π_t = β·π^e_t + κ·ỹ_t + α·Δp^imp_t + γ·s^agri_t + u^π_t
 *
 * Où :
 *   β  = poids des anticipations (forward-looking dominant)
 *   κ  = sensibilité à l'output gap (coût marginal réel)
 *   α  = pass-through du taux de change effectif
 *   γ  = sensibilité aux chocs agricoles (spécifique Maroc)
 *   u^π = somme des chocs d'offre actifs
 */

import { PARAMS } from '../parameters'

export interface PhillipsInputs {
  inflationExpected: number    // π^e_t, anticipations
  outputGap: number            // ỹ_t
  exchangeRate: number         // e_t, taux de change courant
  exchangeRatePrev: number     // e_{t-1}, trimestre précédent
  agriculturalShock: number    // s^agri_t, somme des chocs agricoles actifs
  supplyShock: number          // u^π_t, somme des chocs d'offre actifs
}

export interface PhillipsResult {
  inflation: number
  trace: {
    expectationsComponent: number
    demandComponent: number
    exchangeRateComponent: number
    agriculturalComponent: number
    shockComponent: number
  }
}

export function computePhillips(inputs: PhillipsInputs): PhillipsResult {
  const { inflationExpected, outputGap, exchangeRate, exchangeRatePrev,
          agriculturalShock, supplyShock } = inputs
  const { beta, kappa, alpha, gamma } = PARAMS

  // Variation du taux de change effectif (dépréciation → importations plus chères)
  const importPriceChange =
    exchangeRatePrev !== 0
      ? ((exchangeRate - exchangeRatePrev) / exchangeRatePrev) * 100
      : 0

  const expectationsComponent  = beta * inflationExpected
  const demandComponent         = kappa * outputGap
  const exchangeRateComponent   = alpha * importPriceChange
  const agriculturalComponent   = gamma * agriculturalShock
  const shockComponent          = supplyShock

  const inflation =
    expectationsComponent +
    demandComponent +
    exchangeRateComponent +
    agriculturalComponent +
    shockComponent

  return {
    inflation,
    trace: {
      expectationsComponent,
      demandComponent,
      exchangeRateComponent,
      agriculturalComponent,
      shockComponent,
    },
  }
}
