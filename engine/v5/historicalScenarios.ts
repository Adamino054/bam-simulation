/**
 * Scénarios historiques rejouables — moteur historique.
 *
 * Trois scénarios de la plateforme rejouent une période réelle : le joueur qui
 * reproduit les décisions de Bank Al-Maghrib retrouve les séries du HCP.
 *
 *   covid2020      2020T3 → 2025T2   (20 trimestres)
 *   flexibilite    2018T2 → 2023T1   (20 trimestres)
 *   crisis2008     2008T1 → 2012T4   (20 trimestres)
 *   inflation2022  2022T1 → 2025T3   (15 trimestres)
 *
 * Méthode : décomposition historique des chocs. Pour chaque trimestre, l'écart
 * entre l'observé et ce que l'équation prédit à partir du passé est réinjecté
 * comme constante propre à ce trimestre (voir engine/v5/README.md).
 *
 * IMPORTANT — le scénario covid2020 délègue intégralement au module d'origine
 * `covidRealHook`, laissé inchangé : ses résultats sont donc rigoureusement
 * identiques à ceux d'avant l'ajout des deux autres crises.
 */

import type { EconomicState, ScenarioId } from '../state'
import { TOTAL_QUARTERS } from '../../lib/constants'
import covidData from './covidRealData.json'
import crisis2008Data from './crisis2008Data.json'
import inflation2022Data from './inflation2022Data.json'
import flexibiliteData from './flexibiliteData.json'
import {
  COVID_REAL_QUARTERS_COUNT, covidRealBamRate, covidRealHcp,
  covidRealDate, covidRealGapLag4, covidRealPotentialGrowth, covidRealInitialState,
} from './covidRealHook'

interface HistoricalData {
  initial: {
    q: string; u: number; pi: number; gap: number; g: number
    policyRate: number; reserveRequirement: number
  }
  quarters: string[]
  policyRate: Record<string, number>
  reserveRequirement: Record<string, number>
  upi: Record<string, number>
  uy: Record<string, number>
  uu: Record<string, number>
  hcp: {
    u: Record<string, number>; pi: Record<string, number>
    gap: Record<string, number>; g: Record<string, number>
  }
  gapLag4Seed: Record<string, number>
  seedKeys: string[]
  potentialGrowth: Record<string, number>
}

const REGISTRY: Partial<Record<ScenarioId, HistoricalData>> = {
  covid2020: covidData as unknown as HistoricalData,
  crisis2008: crisis2008Data as HistoricalData,
  inflation2022: inflation2022Data as HistoricalData,
  flexibilite: flexibiliteData as HistoricalData,
}

/** Un scénario est « historique » s'il rejoue une période réelle documentée. */
export function isHistoricalScenario(id: ScenarioId | null | undefined): boolean {
  return id === 'covid2020' || (!!id && id in REGISTRY)
}

const get = (id: ScenarioId) => REGISTRY[id]

/**
 * Nombre de trimestres jouables : toutes les parties durent TOTAL_QUARTERS (20).
 * Les jeux de données peuvent en contenir davantage (covid2020 : 21 trimestres
 * disponibles) ; seuls les 20 premiers sont joués, les résultats de ces 20
 * trimestres étant strictement inchangés.
 */
export function historicalQuartersCount(id: ScenarioId): number {
  const available = id === 'covid2020' ? COVID_REAL_QUARTERS_COUNT : (get(id)?.quarters.length ?? 0)
  return Math.min(TOTAL_QUARTERS, available)
}

/**
 * Chocs historiques injectés au trimestre d'index donné (0 = premier tour).
 *  u^π  choc d'offre (inflation importée)   u^y  choc de demande (activité)
 *  u^u  choc du marché du travail (chômage)
 * Ces trois constantes ancrent la trajectoire sur l'observé : deux scénarios qui se
 * recouvrent produisent donc rigoureusement les mêmes chiffres sur leurs trimestres communs.
 */
export function historicalShocks(id: ScenarioId, idx: number): { upi: number; uy: number; uu: number } | null {
  const d = get(id)
  const k = d?.quarters[idx]
  if (!d || !k) return null
  return { upi: d.upi[k] ?? 0, uy: d.uy[k] ?? 0, uu: d.uu[k] ?? 0 }
}

/** Taux directeur réellement décidé par BAM ce trimestre (repère pour le joueur). */
export function historicalBamRate(id: ScenarioId, idx: number): number | null {
  if (id === 'covid2020') return covidRealBamRate(idx)
  const d = get(id)
  const k = d?.quarters[idx]
  return d && k ? (d.policyRate[k] ?? null) : null
}

/** Réserve obligatoire réellement décidée par BAM ce trimestre (en %). */
export function historicalBamReserve(id: ScenarioId, idx: number): number | null {
  if (id === 'covid2020') return 0 // RO maintenue à 0 % sur toute la période 2020-2025
  const d = get(id)
  const k = d?.quarters[idx]
  return d && k ? (d.reserveRequirement[k] ?? null) : null
}

/** Séries HCP observées du trimestre (affichage comparatif). */
export function historicalHcp(id: ScenarioId, idx: number) {
  if (id === 'covid2020') return covidRealHcp(idx)
  const d = get(id)
  const k = d?.quarters[idx]
  if (!d || !k) return null
  return {
    quarter: k,
    inflation: d.hcp.pi?.[k],
    unemployment: d.hcp.u?.[k],
    outputGap: d.hcp.gap?.[k],
    gdpGrowth: d.hcp.g?.[k],
  }
}

/** Date réelle du trimestre d'index donné. */
export function historicalDate(id: ScenarioId, idx: number): { year: number; q: 1 | 2 | 3 | 4 } {
  if (id === 'covid2020') return covidRealDate(idx)
  const d = get(id)!
  const k = d.quarters[Math.min(idx, d.quarters.length - 1)]
  return { year: parseInt(k.slice(0, 4)), q: parseInt(k.slice(-1)) as 1 | 2 | 3 | 4 }
}

/**
 * Output gap d'il y a 4 trimestres (pour la croissance en variation annuelle).
 * Les 4 premiers tours n'ont pas d'historique de partie : on prend l'observé.
 */
export function historicalGapLag4(id: ScenarioId, idx: number, historyGaps: number[]): number {
  if (id === 'covid2020') return covidRealGapLag4(idx, historyGaps)
  if (idx >= 4) return historyGaps[historyGaps.length - 4]
  const d = get(id)!
  return d.gapLag4Seed[d.seedKeys[idx]] ?? 0
}

/** Croissance potentielle implicite : fait réagir la croissance au taux du joueur. */
export function historicalPotentialGrowth(id: ScenarioId, idx: number): number {
  if (id === 'covid2020') return covidRealPotentialGrowth(idx)
  const d = get(id)
  const k = d?.quarters[idx]
  return d && k ? (d.potentialGrowth[k] ?? 3.0) : 3.0
}

/**
 * État initial : l'observé du trimestre précédant le premier tour.
 * Le bloc bancaire (taux débiteur, NPL, crédit…) est conservé depuis le scénario
 * de la plateforme — il ne participe pas aux quatre variables macro du moteur historique.
 */
export function historicalInitialState(id: ScenarioId, base: EconomicState): EconomicState {
  if (id === 'covid2020') return { ...base, ...covidRealInitialState() } as EconomicState
  const d = get(id)
  if (!d) return base
  const init = d.initial
  return {
    ...base,
    quarter: 0,
    date: {
      year: parseInt(init.q.slice(0, 4)),
      q: parseInt(init.q.slice(-1)) as 1 | 2 | 3 | 4,
    },
    inflation: init.pi,
    inflationCore: init.pi,
    inflationExpected: init.pi,
    gdpGrowth: init.g,
    outputGap: init.gap,
    unemployment: init.u,
    policyRate: init.policyRate,
    interbankRate: init.policyRate,
    reserveRequirement: init.reserveRequirement,
  }
}
