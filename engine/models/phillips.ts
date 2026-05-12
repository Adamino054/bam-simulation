/**
 * Courbe de Phillips augmentée des anticipations — version marocaine.
 *
 * π_t = β_eff·π^e_t + κ·ỹ_t + α·Δp^imp_t + γ·s^agri_t + u^π_t
 *
 * Où :
 *   β_eff = β ajusté par la crédibilité (Task 2a)
 *   κ  = sensibilité à l'output gap (coût marginal réel)
 *   α  = pass-through du taux de change effectif
 *   γ  = sensibilité aux chocs agricoles (spécifique Maroc)
 *   u^π = somme des chocs d'offre actifs
 *
 * Ajouts Task 1 : forward guidance affecte inflationExpected
 * Ajouts Task 2a : crédibilité réduit β effectif
 */

import { PARAMS } from '../parameters'
import type { CommunicationStance } from '../state'

export interface PhillipsInputs {
  inflationExpected: number    // π^e_t, anticipations
  outputGap: number            // ỹ_t
  exchangeRate: number         // e_t, taux de change courant
  exchangeRatePrev: number     // e_{t-1}, trimestre précédent
  agriculturalShock: number    // s^agri_t, somme des chocs agricoles actifs
  supplyShock: number          // u^π_t, somme des chocs d'offre actifs
  // Task 1: forward guidance
  communicationStance?: CommunicationStance
  // Task 2a: credibility
  credibility?: number
  // Scenario override for alpha
  alphaOverride?: number
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
          agriculturalShock, supplyShock,
          communicationStance = 'neutral',
          credibility = 70,
          alphaOverride } = inputs
  const { beta, kappa, gamma } = PARAMS
  const alpha = alphaOverride ?? PARAMS.alpha

  // Task 1: Forward guidance effect on expectations
  let guidanceEffect = 0
  if (communicationStance === 'hawkish') guidanceEffect = -0.15
  else if (communicationStance === 'dovish') guidanceEffect = 0.10

  const adjustedExpectations = inflationExpected + guidanceEffect

  // Task 2a: Credibility reduces beta (better anchored expectations)
  const effectiveBeta = beta - 0.05 * Math.max(0, (credibility - 75) / 25)

  // Variation du taux de change effectif (dépréciation → importations plus chères)
  const importPriceChange =
    exchangeRatePrev !== 0
      ? ((exchangeRate - exchangeRatePrev) / exchangeRatePrev) * 100
      : 0

  const expectationsComponent  = effectiveBeta * adjustedExpectations
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
