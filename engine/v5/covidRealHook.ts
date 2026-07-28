/**
 * Branchement du scénario COVID réel dans le gameplay.
 *
 * Fournit, pour chaque trimestre du scénario covid2020 (index 0 = 2020Q3),
 * les chocs historiques identifiés (u^π offre importée, u^y demande) et les
 * données HCP observées, pour que le moteur v5 rejoue l'histoire quand le
 * joueur reproduit les taux officiels de la banque centrale.
 */

import data from './covidRealData.json'

const QUARTERS = data.quarters as string[]
const UPI = data.upi as Record<string, number>
const UY = data.uy as Record<string, number>
const POLICY = data.policyRate as Record<string, number>
const HCP = data.hcp as {
  u: Record<string, number>
  pi: Record<string, number>
  gap: Record<string, number>
  g: Record<string, number>
}

/** Nombre de trimestres jouables du scénario réel. */
export const COVID_REAL_QUARTERS_COUNT = QUARTERS.length

/**
 * Chocs historiques pour le trimestre d'index donné (0 = premier tour = 2020Q3).
 * Retourne null si hors plage (le joueur continue alors sans choc injecté).
 */
export function covidRealShocks(quarterIndex: number): { upi: number; uy: number } | null {
  const key = QUARTERS[quarterIndex]
  if (!key) return null
  return { upi: UPI[key], uy: UY[key] }
}

/** Décision réelle de la banque centrale pour le trimestre d'index donné (repère joueur). */
export function covidRealPolicyRate(quarterIndex: number): number | null {
  const key = QUARTERS[quarterIndex]
  return key ? POLICY[key] : null
}

/** Données HCP observées pour le trimestre d'index donné (affichage comparatif). */
export function covidRealHcp(quarterIndex: number) {
  const key = QUARTERS[quarterIndex]
  if (!key) return null
  return {
    quarter: key,
    inflation: HCP.pi?.[key],
    unemployment: HCP.u?.[key],
    outputGap: HCP.gap?.[key],
    gdpGrowth: HCP.g?.[key],
  }
}

/** Date (année, trimestre) du trimestre réel d'index donné. */
export function covidRealDate(quarterIndex: number): { year: number; q: 1 | 2 | 3 | 4 } {
  const key = QUARTERS[Math.min(quarterIndex, QUARTERS.length - 1)]
  return { year: parseInt(key.slice(0, 4)), q: parseInt(key.slice(-1)) as 1 | 2 | 3 | 4 }
}

const GAP_SEED = data.gapLag4Seed as Record<string, number>
const HCP_GROWTH = data.hcpGrowth as Record<string, number>

/**
 * Output gap d'il y a 4 trimestres, pour le calcul de la croissance (Δ4).
 * Pour les 4 premiers trimestres joués, il n'existe pas d'historique de partie :
 * on le prend dans les données observées (2019Q3 → 2020Q2).
 * @param quarterIndex index du trimestre courant (0 = 2020Q3)
 * @param historyGaps  gaps des trimestres déjà joués dans la partie
 */
export function covidRealGapLag4(quarterIndex: number, historyGaps: number[]): number {
  if (quarterIndex >= 4) {
    return historyGaps[historyGaps.length - 4]
  }
  const seedKeys = ['2019Q3', '2019Q4', '2020Q1', '2020Q2']
  return GAP_SEED[seedKeys[quarterIndex]] ?? 0
}

/** Croissance HCP observée pour le trimestre d'index donné (fournie en rejeu). */
export function covidRealGrowth(quarterIndex: number): number | null {
  const key = QUARTERS[quarterIndex]
  return key ? (HCP_GROWTH[key] ?? null) : null
}

const POTENTIAL = data.potentialGrowth as Record<string, number>

/**
 * Potentiel de croissance implicite du trimestre (g^pot).
 * Défini pour que g = g^pot + (gap − gap_lag4) redonne le g_HCP quand gap=gap_HCP,
 * et DÉVIE proprement quand le joueur choisit d'autres taux (le gap change alors).
 * C'est ce qui fait réagir la croissance à la décision du joueur, sans la recopier.
 */
export function covidRealPotentialGrowth(quarterIndex: number): number {
  const key = QUARTERS[quarterIndex]
  return key ? (POTENTIAL[key] ?? 3.0) : 3.0
}

/**
 * État initial du scénario COVID réel : l'observé de 2020Q2 (vrai creux COVID).
 * Le premier tour joué (quarter 0) simule 2020Q3.
 */
export function covidRealInitialState() {
  const init = data.initial as { u: number; pi: number; gap: number }
  return {
    quarter: 0,
    date: { year: 2020, q: 2 as 1 | 2 | 3 | 4 },
    inflation: init.pi,
    inflationCore: init.pi,
    inflationExpected: init.pi,
    gdpGrowth: -14.0,
    outputGap: init.gap,
    unemployment: init.u,
    policyRate: 1.5,
    interbankRate: 1.5,
    lendingRate: 4.2,
    reserveRequirement: 0,
    creditGrowth: 1.5,
    liquidityNeed: 110,
    nplRatio: 7.5,
    exchangeRate: 100,
    externalDemand: 0,
    centralBankCredibility: 70,
    currentAccountBalance: -2.5,
    fiscalStance: 'neutral' as const,
    financialInnovationActive: false,
    assetBubbleIndex: 0,
  }
}
