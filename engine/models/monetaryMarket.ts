/**
 * Marché monétaire — formation du taux interbancaire (TMP).
 *
 * liquidityNeed_t = liquidityNeed_{t-1} + ΔRO − opérations de marché
 * i^TMP_t = i*_t + liquidityElasticity · liquidityNeed_t
 *
 * La pression de liquidité (besoin excédentaire) pousse le TMP
 * au-dessus du taux directeur ; les injections la réduisent.
 */

import { PARAMS } from '../parameters'

export interface MonetaryMarketInputs {
  policyRate: number                 // i*_t, nouveau taux directeur
  liquidityNeedPrev: number          // besoin précédent, mds MAD
  reserveRequirementChange: number   // Δr^RO, en points de %
  marketOperations: number           // injection (+) ou ponction (-), mds MAD
  totalDeposits: number              // encours dépôts (approximation 1 500 mds MAD)
}

export interface MonetaryMarketResult {
  interbankRate: number
  liquidityNeed: number
}

export function computeMonetaryMarket(inputs: MonetaryMarketInputs): MonetaryMarketResult {
  const { policyRate, liquidityNeedPrev, reserveRequirementChange,
          marketOperations, totalDeposits } = inputs

  // La hausse des RO crée un besoin supplémentaire de liquidité
  const reserveRequirementImpact = (reserveRequirementChange / 100) * totalDeposits

  const liquidityNeed = liquidityNeedPrev + reserveRequirementImpact - marketOperations

  // Le TMP se forme autour du taux directeur avec une prime de liquidité
  const interbankRate =
    policyRate + PARAMS.liquidityElasticity * Math.max(liquidityNeed, 0)

  return { interbankRate, liquidityNeed }
}
