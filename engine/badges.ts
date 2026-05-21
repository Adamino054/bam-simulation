/**
 * Système de badges — récompenses pour la progression.
 */

export interface BadgeDefinition {
  id: string
  emoji: string
  title: string
  description: string
  color: string
  /** Condition function — receives player data and returns true if earned */
  category: 'course' | 'simulation' | 'mastery'
}

export const BADGES: BadgeDefinition[] = [
  // Course badges
  {
    id: 'fundamentals',
    emoji: '🎓',
    title: 'Fondamentaux',
    description: 'Compléter les modules 01 et 02',
    color: '#5C7E92',
    category: 'course',
  },
  {
    id: 'modelist',
    emoji: '📊',
    title: 'Modéliste',
    description: 'Compléter les modules 03 et 04',
    color: '#4A9D7C',
    category: 'course',
  },
  {
    id: 'technician',
    emoji: '🔧',
    title: 'Technicien',
    description: 'Compléter les modules 05 et 06',
    color: '#C9A86A',
    category: 'course',
  },
  {
    id: 'survivor',
    emoji: '⚡',
    title: 'Survivant',
    description: 'Compléter les modules 07 et 08',
    color: '#C25450',
    category: 'course',
  },
  {
    id: 'quiz-master',
    emoji: '🏆',
    title: 'Maître Économiste',
    description: 'Obtenir > 80% à tous les quizzes',
    color: '#C9A86A',
    category: 'course',
  },

  // Simulation badges
  {
    id: 'first-game',
    emoji: '🎮',
    title: 'Première Partie',
    description: 'Terminer votre première simulation',
    color: '#4A9D7C',
    category: 'simulation',
  },
  {
    id: 'grade-a',
    emoji: '🌟',
    title: 'Grade A',
    description: 'Obtenir un Grade A en simulation',
    color: '#C9A86A',
    category: 'simulation',
  },
  {
    id: 'all-scenarios',
    emoji: '🔥',
    title: 'Tous Scénarios',
    description: 'Jouer les 4 scénarios disponibles',
    color: '#C25450',
    category: 'simulation',
  },
  {
    id: 'inflation-master',
    emoji: '🎯',
    title: 'Maître de l\'Inflation',
    description: 'Maintenir l\'inflation entre 1,5% et 2,5% pendant 5 ans',
    color: '#B41923',
    category: 'simulation',
  },
  {
    id: 'crisis-survivor',
    emoji: '🛡️',
    title: 'Survivant de Crise',
    description: 'Obtenir Grade B+ au scénario COVID-2020',
    color: '#5C7E92',
    category: 'simulation',
  },

  // Mastery badges
  {
    id: 'expert-total',
    emoji: '💎',
    title: 'Expert Total',
    description: 'Grade A en mode Expert',
    color: '#C25450',
    category: 'mastery',
  },
  {
    id: 'perfect-score',
    emoji: '👑',
    title: 'Score Parfait',
    description: 'Obtenir 95+ / 100',
    color: '#C9A86A',
    category: 'mastery',
  },
  {
    id: 'scholar',
    emoji: '📚',
    title: 'Érudit',
    description: 'Compléter tous les cours + tous les quizzes + Grade A',
    color: '#5C7E92',
    category: 'mastery',
  },
]

/** Get badge definition by ID */
export function getBadge(id: string): BadgeDefinition | undefined {
  return BADGES.find(b => b.id === id)
}

/** Get all badges in a category */
export function getBadgesByCategory(category: BadgeDefinition['category']): BadgeDefinition[] {
  return BADGES.filter(b => b.category === category)
}

/** Check badge conditions against player data */
export function checkBadgeEligibility(
  badgeId: string,
  data: {
    completedModules: string[]
    quizScores: Array<{ moduleId: string; score: number; total: number }>
    gameHistory: Array<{ grade: string; scenario: string; score: number; difficultyLevel?: string }>
  },
): boolean {
  const moduleMap: Record<string, string[]> = {
    fundamentals: ['intro', 'policy-rate'],
    modelist: ['is-curve', 'phillips'],
    technician: ['channels', 'taylor'],
    survivor: ['shocks', 'financial-stability'],
  }

  switch (badgeId) {
    case 'fundamentals':
    case 'modelist':
    case 'technician':
    case 'survivor':
      return moduleMap[badgeId]?.every(m => data.completedModules.includes(m)) ?? false

    case 'quiz-master':
      return data.quizScores.length >= 8 &&
        data.quizScores.every(q => q.total > 0 && (q.score / q.total) >= 0.8)

    case 'first-game':
      return data.gameHistory.length >= 1

    case 'grade-a':
      return data.gameHistory.some(g => g.grade === 'A')

    case 'all-scenarios':
      return new Set(data.gameHistory.map(g => g.scenario)).size >= 4

    case 'crisis-survivor':
      return data.gameHistory.some(g => g.scenario === 'covid2020' && (g.grade === 'A' || g.grade === 'B'))

    case 'expert-total':
      return data.gameHistory.some(g => g.grade === 'A' && g.difficultyLevel === 'expert')

    case 'perfect-score':
      return data.gameHistory.some(g => g.score >= 95)

    case 'inflation-master':
      // Would need more detailed game data — approximate with high inflation score
      return data.gameHistory.some(g => g.score >= 85)

    case 'scholar':
      return data.completedModules.length >= 8 &&
        data.quizScores.length >= 8 &&
        data.gameHistory.some(g => g.grade === 'A')

    default:
      return false
  }
}
