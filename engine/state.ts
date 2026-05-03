/**
 * Types de base du moteur de simulation macroéconomique.
 * Ce fichier ne dépend de rien : ni React, ni Zustand, ni Next.js.
 * Il peut être porté tel quel vers un environnement Python (Sujet 1 du PFA).
 */

export interface EconomicState {
  // --- Méta ---
  quarter: number                      // 0 à 19 (20 trimestres = 5 ans)
  date: { year: number; q: 1 | 2 | 3 | 4 }

  // --- Bloc prix ---
  inflation: number                    // π, en %, annualisé
  inflationCore: number                // π core, hors énergie/alimentaire
  inflationExpected: number            // π^e, anticipations

  // --- Bloc activité ---
  gdpGrowth: number                    // croissance PIB en g.a., %
  outputGap: number                    // ỹ, en % du PIB potentiel
  unemployment: number                 // taux de chômage, %

  // --- Bloc taux ---
  policyRate: number                   // i*, taux directeur BAM, %
  interbankRate: number                // i^TMP, taux interbancaire, %
  lendingRate: number                  // i^D, taux débiteur moyen, %

  // --- Bloc bancaire ---
  reserveRequirement: number           // r^RO, taux de réserve obligatoire, %
  creditGrowth: number                 // Δ encours crédit, %
  liquidityNeed: number                // besoin de liquidité bancaire, mds MAD

  // --- Bloc externe ---
  exchangeRate: number                 // taux de change effectif, base 100
  externalDemand: number               // ỹ*, output gap zone euro, %
}

export interface PolicyAction {
  policyRateChangeBp: number           // -100 à +100, pas de 25
  reserveRequirementChangeBp: number   // -200 à +200, pas de 50
  marketOperationsBnMad: number        // injection (+) ou ponction (-) de liquidité
}

export const DEFAULT_POLICY_ACTION: PolicyAction = {
  policyRateChangeBp: 0,
  reserveRequirementChangeBp: 0,
  marketOperationsBnMad: 0,
}

export interface Shock {
  id: string
  label: string
  type: 'supply' | 'demand' | 'financial' | 'external'
  magnitude: number                    // intensité 0-1
  remainingQuarters: number
  description: string
  // Effets quantifiés (% d'impact sur les variables cibles)
  inflationImpact: number
  outputGapImpact: number
  lendingRateImpact: number
  externalDemandImpact: number
}

export interface SimulationResult {
  newState: EconomicState
  triggeredShocks: Shock[]
  trace: Record<string, { value: number; explanation: string }>
}

export type ScenarioId = 'standard' | 'inflation2022' | 'covid2020'
