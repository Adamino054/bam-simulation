/**
 * Configuration des niveaux de difficulté.
 * Chaque niveau modifie les instruments visibles, le scoring, les hints, etc.
 */

export type DifficultyLevel = 'beginner' | 'intermediate' | 'expert'

export interface LevelConfig {
  id: DifficultyLevel
  label: string
  labelFr: string
  emoji: string
  color: string
  bgColor: string
  description: string
  /** Instruments accessibles à ce niveau */
  visibleInstruments: string[]
  /** Multiplicateur de probabilité de chocs */
  shockProbabilityMultiplier: number
  /** Poids du scoring */
  scoringWeights: {
    inflation: number
    growth: number
    stability: number
    credibility: number
  }
  /** Tolérance en pp autour de la cible d'inflation pour le scoring */
  inflationTolerancePp: number
  /** Seuils de grade */
  gradeThresholds: { A: number; B: number; C: number; D: number }
  /** Nombre de trimestres */
  quarters: number
  /** Afficher le hint Taylor */
  showTaylorHint: boolean
  /** Afficher les recommandations du bot */
  showRecommendations: boolean
  /** Afficher les métriques avancées (NPL, CCyB, etc.) */
  showAdvancedMetrics: boolean
}

export const LEVEL_CONFIGS: Record<DifficultyLevel, LevelConfig> = {
  beginner: {
    id: 'beginner',
    label: 'Beginner',
    labelFr: 'Débutant',
    emoji: '🌱',
    color: '#4A9D7C',
    bgColor: 'rgba(74, 157, 124, 0.12)',
    description:
      'Idéal pour découvrir la politique monétaire. 3 instruments de base, scoring indulgent, et des conseils à chaque étape.',
    visibleInstruments: [
      'policyRateChangeBp',
      'reserveRequirementChangeBp',
      'marketOperationsBnMad',
    ],
    shockProbabilityMultiplier: 0.6,
    scoringWeights: { inflation: 35, growth: 20, stability: 15, credibility: 10 },
    inflationTolerancePp: 1.5,
    gradeThresholds: { A: 70, B: 55, C: 40, D: 25 },
    quarters: 16,
    showTaylorHint: true,
    showRecommendations: true,
    showAdvancedMetrics: false,
  },

  intermediate: {
    id: 'intermediate',
    label: 'Intermediate',
    labelFr: 'Intermédiaire',
    emoji: '📈',
    color: '#C9A86A',
    bgColor: 'rgba(201, 168, 106, 0.12)',
    description:
      '5 instruments dont le forward guidance et l\'intervention de change. Scoring standard, chocs réalistes.',
    visibleInstruments: [
      'policyRateChangeBp',
      'reserveRequirementChangeBp',
      'marketOperationsBnMad',
      'communicationStance',
      'fxInterventionBnMad',
    ],
    shockProbabilityMultiplier: 1.0,
    scoringWeights: { inflation: 35, growth: 25, stability: 20, credibility: 20 },
    inflationTolerancePp: 1.0,
    gradeThresholds: { A: 85, B: 70, C: 55, D: 40 },
    quarters: 20,
    showTaylorHint: true,
    showRecommendations: false,
    showAdvancedMetrics: false,
  },

  expert: {
    id: 'expert',
    label: 'Expert',
    labelFr: 'Expert',
    emoji: '🎯',
    color: '#C25450',
    bgColor: 'rgba(194, 84, 80, 0.12)',
    description:
      'Tous les instruments y compris emergency lending et CCyB. Scoring exigeant, aucune aide. Réservé aux vrais banquiers centraux.',
    visibleInstruments: [
      'policyRateChangeBp',
      'reserveRequirementChangeBp',
      'marketOperationsBnMad',
      'communicationStance',
      'fxInterventionBnMad',
      'emergencyLendingBnMad',
      'ccybRate',
    ],
    shockProbabilityMultiplier: 1.4,
    scoringWeights: { inflation: 40, growth: 20, stability: 20, credibility: 20 },
    inflationTolerancePp: 0.5,
    gradeThresholds: { A: 90, B: 80, C: 65, D: 50 },
    quarters: 25,
    showTaylorHint: false,
    showRecommendations: false,
    showAdvancedMetrics: true,
  },
}

/** Get config for a given level, defaults to intermediate */
export function getLevelConfig(level?: DifficultyLevel | null): LevelConfig {
  return LEVEL_CONFIGS[level ?? 'intermediate']
}

/** Check if an instrument is visible for a given level */
export function isInstrumentVisible(instrument: string, level: DifficultyLevel): boolean {
  return LEVEL_CONFIGS[level].visibleInstruments.includes(instrument)
}
