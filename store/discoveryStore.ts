import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useAuthStore } from './authStore'
import { getLevelProgress, STORY_CHAPTERS, DISCOVERY_LEVELS } from '@/engine/discovery'

/**
 * Progression du Mode Découverte, sauvegardée par joueur (pseudo).
 * Indépendante du gameStore expert pour ne rien casser côté simulation.
 */

export interface DiscoveryProfile {
  xp: number
  completedChapters: string[]
  quizBestScore: number          // meilleur nombre de bonnes réponses
  quizBestTotal: number
  quizPlays: number
  predictionBestStreak: number
  predictionPlays: number
  matchingBestErrors: number | null  // moins il y a d'erreurs, mieux c'est
  matchingPlays: number
  balloonBestPct: number         // % de temps dans la zone verte
  balloonPlays: number
  missionsCompleted: number
  missionBestStars: number
  missionBestScore: number
  badges: string[]
}

export const EMPTY_DISCOVERY_PROFILE: DiscoveryProfile = {
  xp: 0,
  completedChapters: [],
  quizBestScore: 0,
  quizBestTotal: 0,
  quizPlays: 0,
  predictionBestStreak: 0,
  predictionPlays: 0,
  matchingBestErrors: null,
  matchingPlays: 0,
  balloonBestPct: 0,
  balloonPlays: 0,
  missionsCompleted: 0,
  missionBestStars: 0,
  missionBestScore: 0,
  badges: [],
}

interface DiscoveryStore {
  profiles: Record<string, DiscoveryProfile>

  getProfile: () => DiscoveryProfile
  addXp: (amount: number) => void
  /** Marque un chapitre terminé. Retourne l'XP gagnée (0 si déjà fait). */
  completeChapter: (chapterId: string) => number
  recordQuiz: (correct: number, total: number) => void
  recordPrediction: (bestStreak: number) => void
  recordMatching: (errors: number) => void
  recordBalloon: (pctInZone: number) => void
  recordMission: (stars: number, score: number) => void
  /** Débloque un badge. Retourne true s'il vient d'être gagné. */
  unlockBadge: (badgeId: string) => boolean
  hasBadge: (badgeId: string) => boolean
}

function currentPseudo(): string | null {
  return useAuthStore.getState().currentUser
}

export const useDiscoveryStore = create<DiscoveryStore>()(
  persist(
    (set, get) => {
      /** Applique une mutation au profil du joueur connecté */
      const mutate = (fn: (p: DiscoveryProfile) => DiscoveryProfile) => {
        const user = currentPseudo()
        if (!user) return
        const { profiles } = get()
        const profile = profiles[user] ?? { ...EMPTY_DISCOVERY_PROFILE }
        set({ profiles: { ...profiles, [user]: fn(profile) } })
      }

      const maybeUnlockLegend = (p: DiscoveryProfile): DiscoveryProfile => {
        const maxLevel = DISCOVERY_LEVELS[DISCOVERY_LEVELS.length - 1]
        if (getLevelProgress(p.xp).current.level >= maxLevel.level && !p.badges.includes('legende')) {
          return { ...p, badges: [...p.badges, 'legende'] }
        }
        return p
      }

      return {
        profiles: {},

        getProfile() {
          const user = currentPseudo()
          if (!user) return { ...EMPTY_DISCOVERY_PROFILE }
          return get().profiles[user] ?? { ...EMPTY_DISCOVERY_PROFILE }
        },

        addXp(amount) {
          mutate(p => maybeUnlockLegend({ ...p, xp: p.xp + Math.max(0, Math.round(amount)) }))
        },

        completeChapter(chapterId) {
          const user = currentPseudo()
          if (!user) return 0
          const profile = get().profiles[user] ?? { ...EMPTY_DISCOVERY_PROFILE }
          if (profile.completedChapters.includes(chapterId)) return 0

          const chapter = STORY_CHAPTERS.find(c => c.id === chapterId)
          const xpGain = chapter?.xpReward ?? 30

          mutate(p => {
            const completed = [...p.completedChapters, chapterId]
            let badges = p.badges
            if (!badges.includes('premiere-lecon')) badges = [...badges, 'premiere-lecon']
            if (completed.length >= STORY_CHAPTERS.length && !badges.includes('grand-lecteur')) {
              badges = [...badges, 'grand-lecteur']
            }
            return maybeUnlockLegend({ ...p, xp: p.xp + xpGain, completedChapters: completed, badges })
          })
          return xpGain
        },

        recordQuiz(correct, total) {
          mutate(p => {
            let badges = p.badges
            if (correct === total && total > 0 && !badges.includes('sans-faute')) {
              badges = [...badges, 'sans-faute']
            }
            const isBest = correct > p.quizBestScore
            return maybeUnlockLegend({
              ...p,
              quizPlays: p.quizPlays + 1,
              quizBestScore: isBest ? correct : p.quizBestScore,
              quizBestTotal: isBest ? total : p.quizBestTotal,
              badges,
            })
          })
        },

        recordPrediction(bestStreak) {
          mutate(p => {
            let badges = p.badges
            if (bestStreak >= 8 && !badges.includes('en-feu')) {
              badges = [...badges, 'en-feu']
            }
            return maybeUnlockLegend({
              ...p,
              predictionPlays: p.predictionPlays + 1,
              predictionBestStreak: Math.max(p.predictionBestStreak, bestStreak),
              badges,
            })
          })
        },

        recordMatching(errors) {
          mutate(p => {
            let badges = p.badges
            if (errors === 0 && !badges.includes('champion-paires')) {
              badges = [...badges, 'champion-paires']
            }
            return maybeUnlockLegend({
              ...p,
              matchingPlays: p.matchingPlays + 1,
              matchingBestErrors: p.matchingBestErrors === null ? errors : Math.min(p.matchingBestErrors, errors),
              badges,
            })
          })
        },

        recordBalloon(pctInZone) {
          mutate(p => {
            let badges = p.badges
            if (pctInZone >= 80 && !badges.includes('ballon-dor')) {
              badges = [...badges, 'ballon-dor']
            }
            return maybeUnlockLegend({
              ...p,
              balloonPlays: p.balloonPlays + 1,
              balloonBestPct: Math.max(p.balloonBestPct, Math.round(pctInZone)),
              badges,
            })
          })
        },

        recordMission(stars, score) {
          mutate(p => {
            let badges = p.badges
            if (!badges.includes('capitaine')) badges = [...badges, 'capitaine']
            if (stars >= 3 && !badges.includes('trois-etoiles')) badges = [...badges, 'trois-etoiles']
            return maybeUnlockLegend({
              ...p,
              missionsCompleted: p.missionsCompleted + 1,
              missionBestStars: Math.max(p.missionBestStars, stars),
              missionBestScore: Math.max(p.missionBestScore, score),
              badges,
            })
          })
        },

        unlockBadge(badgeId) {
          const user = currentPseudo()
          if (!user) return false
          const profile = get().profiles[user] ?? { ...EMPTY_DISCOVERY_PROFILE }
          if (profile.badges.includes(badgeId)) return false
          mutate(p => ({ ...p, badges: [...p.badges, badgeId] }))
          return true
        },

        hasBadge(badgeId) {
          return get().getProfile().badges.includes(badgeId)
        },
      }
    },
    {
      name: 'cbs-discovery',
    },
  ),
)

/** Hook utilitaire : profil réactif du joueur connecté */
export function useDiscoveryProfile(): DiscoveryProfile {
  const currentUser = useAuthStore(s => s.currentUser)
  const profiles = useDiscoveryStore(s => s.profiles)
  if (!currentUser) return EMPTY_DISCOVERY_PROFILE
  return profiles[currentUser] ?? EMPTY_DISCOVERY_PROFILE
}
