/**
 * Types de base du moteur de simulation macroéconomique.
 * Ce fichier ne dépend de rien : ni React, ni Zustand, ni Next.js.
 * Il peut être porté tel quel vers un environnement Python (Sujet 1 du PFA).
 */

export type CommunicationStance = 'dovish' | 'neutral' | 'hawkish'
export type FiscalStance = 'expansionary' | 'neutral' | 'contractionary'

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
  nplRatio: number                     // ratio de créances en souffrance (NPL), %

  // --- Bloc externe ---
  exchangeRate: number                 // taux de change effectif, base 100
  externalDemand: number               // ỹ*, output gap zone euro, %

  // --- Crédibilité (Task 2a) ---
  centralBankCredibility: number       // 0–100, crédibilité de BAM

  // --- Balance extérieure (Task 2b) ---
  currentAccountBalance: number        // solde courant, % du PIB

  // --- Stance budgétaire (Task 2c) ---
  fiscalStance: FiscalStance           // stance budgétaire courante
}

export interface PolicyAction {
  // --- Original 3 instruments ---
  policyRateChangeBp: number           // -100 à +100, pas de 25
  reserveRequirementChangeBp: number   // -200 à +200, pas de 50
  marketOperationsBnMad: number        // injection (+) ou ponction (-) de liquidité

  // --- Task 1: 3 new instruments ---
  communicationStance: CommunicationStance   // Forward guidance
  fxInterventionBnMad: number                // FX intervention: -10 | 0 | 10 | 20 | 30
  emergencyLendingBnMad: number              // Emergency lending: 0 | 5 | 10 | 20

  // --- Macroprudentiel ---
  ccybRate: number                           // Coussin contracyclique (CCyB): 0 à 2.5 %
}

export const DEFAULT_POLICY_ACTION: PolicyAction = {
  policyRateChangeBp: 0,
  reserveRequirementChangeBp: 0,
  marketOperationsBnMad: 0,
  communicationStance: 'neutral',
  fxInterventionBnMad: 0,
  emergencyLendingBnMad: 0,
  ccybRate: 0, // Par défaut le coussin est désactivé (0%)
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
  // Optional: current account impact for capital flight
  currentAccountImpact?: number
}

export interface SimulationResult {
  newState: EconomicState
  triggeredShocks: Shock[]
  trace: Record<string, { value: number; explanation: string }>
}

export type ScenarioId = 'standard' | 'inflation2022' | 'covid2020' | 'flexibilite'
