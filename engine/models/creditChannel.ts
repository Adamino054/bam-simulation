/**
 * Canal du crédit — transmission du coût monétaire vers l'économie réelle.
 *
 * Taux débiteur (ajustement partiel, ~3 trimestres de délai) :
 *   i^D_t = (1 − λ)·i^D_{t-1} + λ·(i^TMP_t + marge bancaire + CCyB) + Prime_NPL + riskPremiumShock
 *
 * Note : La croissance incrémentale du crédit (ΔCrédit_t) est résolue au niveau du moteur
 * dans simulator.ts afin d'intégrer simultanément les variations de l'écart de production
 * et des NPL du trimestre en cours.
 */

import { PARAMS } from '../parameters'

export interface CreditChannelInputs {
  lendingRatePrev: number       // i^D_{t-1}, %
  interbankRate: number         // i^TMP_t, %
  riskPremiumShock: number      // choc de prime de risque actif, points de %
  ccybRate: number              // Coussin de capital contracyclique, %
  nplRatio: number              // Ratio de créances douteuses, %
}

export interface CreditChannelResult {
  lendingRate: number
  creditGrowth: number
}

export function computeCreditChannel(inputs: CreditChannelInputs): CreditChannelResult {
  const {
    lendingRatePrev,
    interbankRate,
    riskPremiumShock,
    ccybRate,
    nplRatio,
  } = inputs
  const { lambda, bankMargin, ccybLendingImpact, nplBase } = PARAMS

  // 1. Taux cible théorique intégrant le coût interbancaire et les exigences réglementaires CCyB
  const targetRate = interbankRate + bankMargin + (ccybRate * ccybLendingImpact)
  
  // 2. Prime de risque interne des banques liée aux portefeuilles d'actifs détériorés (NPL)
  const nplPremium = Math.max(0, nplRatio - nplBase) * 0.15

  // 3. Ajustement dynamique du taux débiteur
  const lendingRate =
    (1 - lambda) * lendingRatePrev +
    lambda * targetRate +
    riskPremiumShock +
    nplPremium

  return {
    lendingRate,
    creditGrowth: 0, // Résolu de manière simultanée dans simulator.ts
  }
}
