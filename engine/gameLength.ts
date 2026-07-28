/**
 * Durée d'une partie — source unique de vérité.
 *
 * Avant l'arrivée du moteur v5, la durée était décidée à trois endroits différents
 * (store, Timeline, bouton de tour) avec des valeurs qui ne coïncidaient pas : le
 * joueur débutant voyait « Trimestre 16 / 20 » puis la partie s'arrêtait. Tout passe
 * désormais par `gameQuarters()`.
 *
 *   scénario historique  → la longueur de sa série de constantes (20 trimestres)
 *   campagne Volcker     → mission courte de 8 trimestres (cf. engine/campaigns.ts)
 *   mode libre           → FREE_MODE_QUARTERS
 *   reste                → TOTAL_QUARTERS
 */

import type { ScenarioId } from './state'
import { TOTAL_QUARTERS, FREE_MODE_QUARTERS } from '../lib/constants'
import { isHistoricalScenario, historicalQuartersCount } from './v5/historicalScenarios'

/** Durée de la mission Volcker (campagne non historique). */
export const CAMPAIGN_QUARTERS = 8

export function gameQuarters(scenario: ScenarioId | null | undefined, freeMode = false): number {
  if (scenario && isHistoricalScenario(scenario)) return historicalQuartersCount(scenario)
  if (scenario === 'volcker1979') return CAMPAIGN_QUARTERS
  return freeMode ? FREE_MODE_QUARTERS : TOTAL_QUARTERS
}
