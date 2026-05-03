/**
 * Scénarios de départ prédéfinis.
 * Chaque scénario modifie l'état initial et peut injecter des chocs de départ.
 */

import type { EconomicState, ScenarioId, Shock } from './state'
import { INITIAL_STATE } from './parameters'

export interface Scenario {
  id: ScenarioId
  title: string
  subtitle: string
  description: string
  difficulty: 'normal' | 'hard' | 'crisis'
  initialState: EconomicState
  initialShocks: Shock[]
}

export const SCENARIOS: Record<ScenarioId, Scenario> = {
  standard: {
    id: 'standard',
    title: 'Scénario standard',
    subtitle: 'Situation de départ normale',
    description:
      'L\'économie marocaine démarre dans un état proche de l\'équilibre. L\'inflation est légèrement au-dessus de la cible, la croissance est soutenue. Des chocs aléatoires surviendront au fil des trimestres.',
    difficulty: 'normal',
    initialState: { ...INITIAL_STATE },
    initialShocks: [],
  },

  inflation2022: {
    id: 'inflation2022',
    title: 'Choc inflationniste 2022',
    subtitle: 'Inflation à 6 %, chocs énergétiques',
    description:
      'Contexte inspiré de 2022 : l\'inflation a bondi à 6 % sous l\'effet des prix énergétiques mondiaux et des tensions sur les chaînes d\'approvisionnement. Votre mandat prioritaire est de ramener l\'inflation vers 2 % sans casser la croissance.',
    difficulty: 'hard',
    initialState: {
      ...INITIAL_STATE,
      inflation: 6.1,
      inflationCore: 4.8,
      inflationExpected: 4.5,
      gdpGrowth: 3.0,
      outputGap: 0.5,
      policyRate: 2.50,
      interbankRate: 2.50,
      lendingRate: 5.50,
    },
    initialShocks: [
      {
        id: 'oil_q0',
        label: 'Choc pétrolier',
        type: 'supply',
        magnitude: 0.85,
        remainingQuarters: 3,
        description: 'Forte hausse des prix mondiaux du pétrole consécutive aux tensions géopolitiques.',
        inflationImpact: 2.2,
        outputGapImpact: -0.5,
        lendingRateImpact: 0,
        externalDemandImpact: 0,
      },
    ],
  },

  covid2020: {
    id: 'covid2020',
    title: 'Choc COVID-2020',
    subtitle: 'Choc de demande sévère, output gap −4 %',
    description:
      'Contexte inspiré du T2 2020 : l\'économie mondiale a subi un choc de demande sans précédent. L\'output gap marocain s\'est effondré à −4 %. Votre mission est de soutenir la reprise tout en évitant une spirale déflationniste et une fragilisation du système financier.',
    difficulty: 'crisis',
    initialState: {
      ...INITIAL_STATE,
      inflation: 0.7,
      inflationCore: 0.5,
      inflationExpected: 0.8,
      gdpGrowth: -6.3,
      outputGap: -4.0,
      unemployment: 13.5,
      policyRate: 1.50,
      interbankRate: 1.50,
      lendingRate: 4.20,
      creditGrowth: 1.5,
      liquidityNeed: 110.0,
    },
    initialShocks: [
      {
        id: 'external_demand_q0',
        label: 'Récession zone euro',
        type: 'external',
        magnitude: 0.90,
        remainingQuarters: 5,
        description: 'Récession profonde en Europe, premier partenaire commercial du Maroc.',
        inflationImpact: -0.6,
        outputGapImpact: 0,
        lendingRateImpact: 0,
        externalDemandImpact: -1.8,
      },
    ],
  },
}
