/**
 * Marché monétaire — formation du taux interbancaire (TMP).
 *
 * Formule standardisée :
 *   TMP_t = i_t + α_liq · (NPL_t / 10) + ε_t
 *
 * Où :
 *   - α_liq = 0.05 (calibré pour la transmission monétaire marocaine)
 *   - ε_t = (liquidityNeed_t - 80) · 0.002 (effet marginal de la liquidité)
 *   - nplRatio représente la qualité des actifs bancaires (Task 4)
 *
 * Le TMP est encadré à [i - 10bp, i + 150bp] en conditions normales,
 * reflétant les corridors de taux directeurs et le taux de la facilité de prêt.
 */

import { PARAMS } from '../parameters'

export interface MonetaryMarketInputs {
  policyRate: number                 // i*_t, nouveau taux directeur, %
  liquidityNeedPrev: number          // besoin précédent, mds MAD
  reserveRequirementChange: number   // Δr^RO, en points de %
  marketOperations: number           // injection (+) ou ponction (-), mds MAD
  totalDeposits: number              // encours dépôts (approximation 1 500 mds MAD)
  nplRatio: number                   // Ratio de créances en souffrance (NPL), %
  scenarioId?: string                // Scénario actif (ex: crisis2008)
}

export interface MonetaryMarketResult {
  interbankRate: number
  liquidityNeed: number
}

export function computeMonetaryMarket(inputs: MonetaryMarketInputs): MonetaryMarketResult {
  const {
    policyRate,
    liquidityNeedPrev,
    reserveRequirementChange,
    marketOperations,
    totalDeposits,
    nplRatio,
    scenarioId,
  } = inputs

  // 1. La hausse du taux de réserve obligatoire (RO) crée un besoin de liquidité
  const reserveRequirementImpact = (reserveRequirementChange / 100) * totalDeposits
  const liquidityNeed = liquidityNeedPrev + reserveRequirementImpact - marketOperations

  // 2. Taux du Marché Monétaire (TMP) avec spread réaliste
  const isCrisis = scenarioId === 'crisis2008'
  const alpha_liq = 0.05
  
  // ε_t: variation marginale due à l'écart de liquidité par rapport au baseline (80)
  const epsilon = (liquidityNeed - 80) * 0.002
  
  let spread = alpha_liq * (nplRatio / 10) + epsilon

  // Corridor de sécurité : le TMP ne doit pas s'écarter de manière absurde en dehors des crises
  // En conditions normales, spread max de +150bp (facilité de prêt marginal), min de -10bp
  const maxSpread = isCrisis ? 2.50 : 1.50
  const minSpread = -0.10

  spread = Math.max(minSpread, Math.min(maxSpread, spread))

  const interbankRate = policyRate + spread

  return { interbankRate, liquidityNeed }
}
