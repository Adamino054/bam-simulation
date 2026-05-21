import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DifficultyLevel } from '@/engine/state'

export interface GameRecord {
  id: string
  date: string
  scenario: string
  scenarioTitle: string
  score: number
  grade: string
  quarters: number
  avgInflation: number
  avgGrowth: number
  avgCredibility: number
  freeMode: boolean
  difficultyLevel: DifficultyLevel
}

export interface QuizScore {
  moduleId: string
  score: number
  total: number
  date: string
  level: DifficultyLevel
}

export interface PlayerProfile {
  pseudo: string
  passwordHash: string
  createdAt: string
  gameHistory: GameRecord[]
  badges: string[]
  quizScores: QuizScore[]
  notes: Record<string, string>  // moduleId -> note text
  preferredLevel: DifficultyLevel
}

interface AuthStore {
  currentUser: string | null
  players: Record<string, PlayerProfile>

  register: (pseudo: string, password: string) => { success: boolean; error?: string }
  login: (pseudo: string, password: string) => { success: boolean; error?: string }
  logout: () => void

  addGameRecord: (record: Omit<GameRecord, 'id' | 'date'>) => void
  getCurrentPlayer: () => PlayerProfile | null
  getPlayerStats: () => {
    totalGames: number
    avgScore: number
    bestScore: number
    bestGrade: string
    favoriteScenario: string
    winRate: number
  } | null

  // New: badges, quizzes, notes
  addBadge: (badge: string) => void
  hasBadge: (badge: string) => boolean
  addQuizScore: (score: QuizScore) => void
  setNote: (moduleId: string, text: string) => void
  getNote: (moduleId: string) => string
  setPreferredLevel: (level: DifficultyLevel) => void
}

/** Simple hash function for client-side password storage (not cryptographically secure) */
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36)
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      currentUser: null,
      players: {},

      register(pseudo, password) {
        const { players } = get()
        const key = pseudo.toLowerCase().trim()
        if (key.length < 2) return { success: false, error: 'Le pseudo doit contenir au moins 2 caractères.' }
        if (password.length < 3) return { success: false, error: 'Le mot de passe doit contenir au moins 3 caractères.' }
        if (players[key]) return { success: false, error: 'Ce pseudo est déjà pris.' }

        set({
          players: {
            ...players,
            [key]: {
              pseudo: pseudo.trim(),
              passwordHash: simpleHash(password),
              createdAt: new Date().toISOString(),
              gameHistory: [],
              badges: [],
              quizScores: [],
              notes: {},
              preferredLevel: 'beginner' as DifficultyLevel,
            },
          },
          currentUser: key,
        })
        return { success: true }
      },

      login(pseudo, password) {
        const { players } = get()
        const key = pseudo.toLowerCase().trim()
        const player = players[key]
        if (!player) return { success: false, error: 'Pseudo introuvable.' }
        if (player.passwordHash !== simpleHash(password)) return { success: false, error: 'Mot de passe incorrect.' }

        set({ currentUser: key })
        return { success: true }
      },

      logout() {
        set({ currentUser: null })
      },

      addGameRecord(record) {
        const { currentUser, players } = get()
        if (!currentUser || !players[currentUser]) return

        const newRecord: GameRecord = {
          ...record,
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          date: new Date().toISOString(),
        }

        set({
          players: {
            ...players,
            [currentUser]: {
              ...players[currentUser],
              gameHistory: [newRecord, ...players[currentUser].gameHistory],
            },
          },
        })
      },

      getCurrentPlayer() {
        const { currentUser, players } = get()
        if (!currentUser) return null
        return players[currentUser] ?? null
      },

      getPlayerStats() {
        const player = get().getCurrentPlayer()
        if (!player || player.gameHistory.length === 0) return null

        const games = player.gameHistory
        const totalGames = games.length
        const scores = games.map(g => g.score)
        const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / totalGames)
        const bestScore = Math.max(...scores)
        const bestGrade = games.reduce((best, g) => {
          const order = ['A', 'B', 'C', 'D', 'F']
          return order.indexOf(g.grade) < order.indexOf(best) ? g.grade : best
        }, 'F')

        // Favorite scenario (most played)
        const scenarioCounts: Record<string, number> = {}
        games.forEach(g => { scenarioCounts[g.scenarioTitle] = (scenarioCounts[g.scenarioTitle] ?? 0) + 1 })
        const favoriteScenario = Object.entries(scenarioCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'

        // Win rate: grade A or B
        const winRate = Math.round((games.filter(g => g.grade === 'A' || g.grade === 'B').length / totalGames) * 100)

        return { totalGames, avgScore, bestScore, bestGrade, favoriteScenario, winRate }
      },

      addBadge(badge) {
        const { currentUser, players } = get()
        if (!currentUser || !players[currentUser]) return
        const player = players[currentUser]
        if (player.badges?.includes(badge)) return
        set({
          players: {
            ...players,
            [currentUser]: {
              ...player,
              badges: [...(player.badges ?? []), badge],
            },
          },
        })
      },

      hasBadge(badge) {
        const player = get().getCurrentPlayer()
        return player?.badges?.includes(badge) ?? false
      },

      addQuizScore(score) {
        const { currentUser, players } = get()
        if (!currentUser || !players[currentUser]) return
        const player = players[currentUser]
        set({
          players: {
            ...players,
            [currentUser]: {
              ...player,
              quizScores: [...(player.quizScores ?? []), score],
            },
          },
        })
      },

      setNote(moduleId, text) {
        const { currentUser, players } = get()
        if (!currentUser || !players[currentUser]) return
        const player = players[currentUser]
        set({
          players: {
            ...players,
            [currentUser]: {
              ...player,
              notes: { ...(player.notes ?? {}), [moduleId]: text },
            },
          },
        })
      },

      getNote(moduleId) {
        const player = get().getCurrentPlayer()
        return player?.notes?.[moduleId] ?? ''
      },

      setPreferredLevel(level) {
        const { currentUser, players } = get()
        if (!currentUser || !players[currentUser]) return
        set({
          players: {
            ...players,
            [currentUser]: {
              ...players[currentUser],
              preferredLevel: level,
            },
          },
        })
      },
    }),
    {
      name: 'cbs-auth',
    },
  ),
)
