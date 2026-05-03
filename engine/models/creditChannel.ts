/**
 * Canal du crédit — transmission monétaire vers l'économie réelle.
 *
 * Taux débiteur (ajustement partiel, ~3 trimestres de délai) :
 *   i^D_t = (1 − λ)·i^D_{t-1} + λ·(i^TMP_t + marge bancaire)
 *
 * Croissance du crédit :
 *   ΔL_t = θ0 + θ1·ỹ_t − θ2·i^D_t + θ3·π^e_t
 *
 * Plus un choc de prime de risque peut s'ajouter au taux débiteur.
 */

import { PARAMS } from '../parameters'

export interface CreditChannelInputs {
  lendingRatePrev: number       // i^D_{t-1}
  interbankRate: number         // i^TMP_t
  outputGap: number             // ỹ_t
  inflationExpected: number     // π^e_t
  riskPremiumShock: number      // choc de prime de risque actif, en points de %
}

export interface CreditChannelResult {
  lendingRate: number
  creditGrowth: number
}

export function computeCreditChannel(inputs: CreditChannelInputs): CreditChannelResult {
  const { lendingRatePrev, interbankRate, outputGap,
          inflationExpected, riskPremiumShock } = inputs
  const { lambda, bankMargin, theta0, theta1, theta2, theta3 } = PARAMS

  // Ajustement partiel du taux débiteur vers son niveau cible
  const targetRate = interbankRate + bankMargin
  const lendingRate =
    (1 - lambda) * lendingRatePrev +
    lambda * targetRate +
    riskPremiumShock

  // Dynamique du crédit
  const creditGrowth =
    theta0 +
    theta1 * outputGap -
    theta2 * lendingRate +
    theta3 * inflationExpected

  return { lendingRate, creditGrowth }
}
