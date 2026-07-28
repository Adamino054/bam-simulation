/**
 * Entrée d'un tour de rejeu historique — utilisée par tous les modes de jeu.
 *
 * Regroupe en un seul endroit les trois précautions qui conditionnent l'exactitude
 * du rejeu, pour qu'aucun mode (solo, duel, coopératif) ne puisse les oublier :
 *
 *  1. l'état passé au moteur doit porter la date du trimestre SIMULÉ (saisonnalité
 *     d'Okun), pas celle du trimestre de départ ;
 *  2. les constantes u^π / u^y / u^u du trimestre doivent être injectées ;
 *  3. l'output gap retardé de 4 trimestres se lit dans l'historique PRIVÉ de son
 *     premier élément — `history` commence par l'état initial, qui n'est pas un
 *     trimestre joué. Sans ce décalage la croissance utilise un retard de 5.
 */

import type { EconomicState, ScenarioId } from '../state'
import type { StepV5Options } from './simulatorV5'
import {
  isHistoricalScenario, historicalShocks, historicalGapLag4,
  historicalPotentialGrowth, historicalDate,
} from './historicalScenarios'

export type ReplayOptions = Pick<StepV5Options, 'realShocks' | 'outputGapLag4' | 'potentialGrowth'>

/**
 * @param scenario scénario de la partie
 * @param current  état courant (trimestre précédant celui qu'on simule)
 * @param history  états passés, le premier étant l'état initial
 * @returns null si le scénario n'est pas un rejeu historique — le moteur v1 s'applique alors
 */
export function historicalStepInput(
  scenario: ScenarioId | null | undefined,
  current: EconomicState,
  history: EconomicState[],
): { state: EconomicState; options: ReplayOptions } | null {
  if (!scenario || !isHistoricalScenario(scenario)) return null

  const idx = current.quarter
  const state: EconomicState = { ...current, date: historicalDate(scenario, idx) }

  const realShocks = historicalShocks(scenario, idx)
  // Au-delà de la série de constantes, le joueur continue sur la seule dynamique estimée.
  if (!realShocks) return { state, options: {} }

  const historyGaps = [...history.slice(1).map(h => h.outputGap), current.outputGap]
  return {
    state,
    options: {
      realShocks,
      outputGapLag4: historicalGapLag4(scenario, idx, historyGaps),
      potentialGrowth: historicalPotentialGrowth(scenario, idx),
    },
  }
}

/** Date réelle du trimestre simulé, à recaler sur l'état produit par le moteur. */
export function historicalStepDate(scenario: ScenarioId, quarterIndex: number) {
  return historicalDate(scenario, quarterIndex)
}
