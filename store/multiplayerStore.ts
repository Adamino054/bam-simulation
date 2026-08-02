import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { EconomicState, PolicyAction, Shock, ScenarioId, DifficultyLevel } from '@/engine/state'
import { DEFAULT_POLICY_ACTION } from '@/engine/state'
import { computeScore, type ScoreResult } from '@/engine/scoring'
import {
  cloneEconomicState,
  getScenarioInitialShocks,
  getScenarioInitialState,
  getScenarioMaxQuarters,
  runScenarioStep,
} from '@/engine/scenarioRunner'

// ── Types ────────────────────────────────────────────────────────────────────

export type MultiplayerMode = 'duel' | 'coop'

export type GamePhase =
  | 'setup'           // Configuration initiale
  | 'playing'         // Jeu en cours
  | 'turnTransition'  // Écran de passage de relais (Duel)
  | 'quarterReview'   // Bilan trimestriel comparatif (Duel)
  | 'finished'        // Partie terminée

export type ActivePlayer = 'p1' | 'p2'

export interface PlayerConfig {
  name: string
  avatar: string
}

/** Badges humoristiques attribués en fin de partie */
export interface MultiplayerBadge {
  id: string
  label: string
  emoji: string
  description: string
  player: ActivePlayer
}

// ── Duel state ───────────────────────────────────────────────────────────────

interface DuelState {
  p1State: EconomicState
  p1History: EconomicState[]
  p1ActionHistory: PolicyAction[]
  p1ActiveShocks: Shock[]
  p1PendingAction: PolicyAction
  p1PreviousRateChange: number
  p1FxHistory: number[]

  p2State: EconomicState
  p2History: EconomicState[]
  p2ActionHistory: PolicyAction[]
  p2ActiveShocks: Shock[]
  p2PendingAction: PolicyAction
  p2PreviousRateChange: number
  p2FxHistory: number[]

  activePlayer: ActivePlayer
}

// ── Coop state ───────────────────────────────────────────────────────────────

interface CoopState {
  sharedState: EconomicState
  sharedHistory: EconomicState[]
  sharedActionHistory: PolicyAction[]
  sharedActiveShocks: Shock[]
  sharedPendingAction: PolicyAction
  sharedPreviousRateChange: number
  sharedFxHistory: number[]

  p1Locked: boolean
  p2Locked: boolean
}

// ── Store interface ──────────────────────────────────────────────────────────

interface MultiplayerStore {
  // ── Config ──
  mode: MultiplayerMode
  phase: GamePhase
  player1: PlayerConfig
  player2: PlayerConfig
  scenario: ScenarioId
  difficultyLevel: DifficultyLevel
  seed: number
  currentQuarterIndex: number  // Compteur de trimestres global pour les deux joueurs

  // ── Duel state ──
  duel: DuelState

  // ── Coop state ──
  coop: CoopState

  // ── Actions: Setup ──
  setMode: (mode: MultiplayerMode) => void
  setPlayer1: (config: Partial<PlayerConfig>) => void
  setPlayer2: (config: Partial<PlayerConfig>) => void
  setScenario: (scenario: ScenarioId) => void
  setDifficultyLevel: (level: DifficultyLevel) => void
  startGame: () => void

  // ── Actions: Duel ──
  setDuelAction: (player: ActivePlayer, action: Partial<PolicyAction>) => void
  submitDuelTurn: () => void        // Le joueur actif valide → transition
  proceedToNextPlayer: () => void   // Fin de l'écran de transition
  proceedFromReview: () => void     // Fin du bilan trimestriel → tour suivant

  // ── Actions: Coop ──
  setCoopAction: (action: Partial<PolicyAction>) => void
  lockPlayer: (player: ActivePlayer) => void
  unlockPlayer: (player: ActivePlayer) => void
  submitCoopTurn: () => void

  // ── Scores ──
  getScores: () => { p1: ScoreResult; p2: ScoreResult } | null
  getCoopScore: () => ScoreResult | null
  getBadges: () => MultiplayerBadge[]

  // ── Lifecycle ──
  reset: () => void
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateSeed(): number {
  return Math.floor(Math.random() * 1_000_000)
}

const PLAYER_AVATARS = ['🏛️', '🏦', '📊', '💹', '🎯', '🦁', '🦅', '⚡']

function getDefaultDuelState(scenario: ScenarioId): DuelState {
  const initialState = getScenarioInitialState(scenario)
  const initialShocks = getScenarioInitialShocks(scenario)
  return {
    p1State: cloneEconomicState(initialState),
    p1History: [],
    p1ActionHistory: [],
    p1ActiveShocks: initialShocks.map(shock => ({ ...shock })),
    p1PendingAction: { ...DEFAULT_POLICY_ACTION },
    p1PreviousRateChange: 0,
    p1FxHistory: [],

    p2State: cloneEconomicState(initialState),
    p2History: [],
    p2ActionHistory: [],
    p2ActiveShocks: initialShocks.map(shock => ({ ...shock })),
    p2PendingAction: { ...DEFAULT_POLICY_ACTION },
    p2PreviousRateChange: 0,
    p2FxHistory: [],

    activePlayer: 'p1',
  }
}

function getDefaultCoopState(scenario: ScenarioId): CoopState {
  const initialState = getScenarioInitialState(scenario)
  return {
    sharedState: cloneEconomicState(initialState),
    sharedHistory: [],
    sharedActionHistory: [],
    sharedActiveShocks: getScenarioInitialShocks(scenario),
    sharedPendingAction: { ...DEFAULT_POLICY_ACTION },
    sharedPreviousRateChange: 0,
    sharedFxHistory: [],
    p1Locked: false,
    p2Locked: false,
  }
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useMultiplayerStore = create<MultiplayerStore>()(
  persist(
    (set, get) => ({
      mode: 'duel',
      phase: 'setup',
      player1: { name: '', avatar: '🏛️' },
      player2: { name: '', avatar: '🏦' },
      scenario: 'standard',
      difficultyLevel: 'intermediate',
      seed: generateSeed(),
      currentQuarterIndex: 0,

      duel: getDefaultDuelState('standard'),
      coop: getDefaultCoopState('standard'),

      // ── Setup actions ──────────────────────────────────────────────────

      setMode(mode) { set({ mode }) },

      setPlayer1(config) {
        set(s => ({ player1: { ...s.player1, ...config } }))
      },

      setPlayer2(config) {
        set(s => ({ player2: { ...s.player2, ...config } }))
      },

      setScenario(scenario) { set({ scenario }) },

      setDifficultyLevel(level) { set({ difficultyLevel: level }) },

      startGame() {
        const { mode, scenario } = get()
        set({
          phase: 'playing',
          seed: generateSeed(),
          currentQuarterIndex: 0,
          duel: getDefaultDuelState(scenario),
          coop: getDefaultCoopState(scenario),
        })
      },

      // ── Duel actions ───────────────────────────────────────────────────

      setDuelAction(player, action) {
        set(s => {
          const d = { ...s.duel }
          if (player === 'p1') {
            d.p1PendingAction = { ...d.p1PendingAction, ...action }
          } else {
            d.p2PendingAction = { ...d.p2PendingAction, ...action }
          }
          return { duel: d }
        })
      },

      submitDuelTurn() {
        const { duel, seed, scenario, difficultyLevel } = get()
        const ap = duel.activePlayer
        const maxQ = getScenarioMaxQuarters(scenario, difficultyLevel)

        if (ap === 'p1') {
          // Simuler le tour de P1
          const { result, activeShocks } = runScenarioStep({
            state: duel.p1State,
            action: duel.p1PendingAction,
            activeShocks: duel.p1ActiveShocks,
            seed,
            scenario,
            previousPolicyRateChangeBp: duel.p1PreviousRateChange,
            fxInterventionHistory: duel.p1FxHistory,
            history: duel.p1History,
          })
          const newFxHistory = [...duel.p1FxHistory, duel.p1PendingAction.fxInterventionBnMad].slice(-4)

          set(s => ({
            duel: {
              ...s.duel,
              p1History: [...s.duel.p1History, s.duel.p1State],
              p1ActionHistory: [...(s.duel.p1ActionHistory ?? []), s.duel.p1PendingAction],
              p1State: result.newState,
              p1ActiveShocks: activeShocks,
              p1PreviousRateChange: s.duel.p1PendingAction.policyRateChangeBp,
              p1FxHistory: newFxHistory,
              p1PendingAction: { ...DEFAULT_POLICY_ACTION },
            },
            phase: 'turnTransition',
          }))
        } else {
          // Simuler le tour de P2
          const { result, activeShocks } = runScenarioStep({
            state: duel.p2State,
            action: duel.p2PendingAction,
            activeShocks: duel.p2ActiveShocks,
            seed,
            scenario,
            previousPolicyRateChangeBp: duel.p2PreviousRateChange,
            fxInterventionHistory: duel.p2FxHistory,
            history: duel.p2History,
          })
          const newFxHistory = [...duel.p2FxHistory, duel.p2PendingAction.fxInterventionBnMad].slice(-4)

          const nextQuarter = get().currentQuarterIndex + 1
          const isFinished = nextQuarter >= maxQ

          set(s => ({
            duel: {
              ...s.duel,
              p2History: [...s.duel.p2History, s.duel.p2State],
              p2ActionHistory: [...(s.duel.p2ActionHistory ?? []), s.duel.p2PendingAction],
              p2State: result.newState,
              p2ActiveShocks: activeShocks,
              p2PreviousRateChange: s.duel.p2PendingAction.policyRateChangeBp,
              p2FxHistory: newFxHistory,
              p2PendingAction: { ...DEFAULT_POLICY_ACTION },
            },
            currentQuarterIndex: nextQuarter,
            phase: isFinished ? 'finished' : 'quarterReview',
          }))
        }
      },

      proceedToNextPlayer() {
        // De l'écran de transition → joueur 2 joue
        set(s => ({
          duel: { ...s.duel, activePlayer: 'p2' },
          phase: 'playing',
        }))
      },

      proceedFromReview() {
        // Du bilan trimestriel → retour à P1 pour le trimestre suivant
        set(s => ({
          duel: { ...s.duel, activePlayer: 'p1' },
          phase: 'playing',
        }))
      },

      // ── Coop actions ───────────────────────────────────────────────────

      setCoopAction(action) {
        set(s => ({
          coop: {
            ...s.coop,
            sharedPendingAction: { ...s.coop.sharedPendingAction, ...action },
          },
        }))
      },

      lockPlayer(player) {
        set(s => ({
          coop: {
            ...s.coop,
            ...(player === 'p1' ? { p1Locked: true } : { p2Locked: true }),
          },
        }))
      },

      unlockPlayer(player) {
        set(s => ({
          coop: {
            ...s.coop,
            ...(player === 'p1' ? { p1Locked: false } : { p2Locked: false }),
          },
        }))
      },

      submitCoopTurn() {
        const { coop, seed, scenario, difficultyLevel, currentQuarterIndex } = get()
        if (!coop.p1Locked || !coop.p2Locked) return

        const maxQ = getScenarioMaxQuarters(scenario, difficultyLevel)

        const { result, activeShocks } = runScenarioStep({
          state: coop.sharedState,
          action: coop.sharedPendingAction,
          activeShocks: coop.sharedActiveShocks,
          seed,
          scenario,
          previousPolicyRateChangeBp: coop.sharedPreviousRateChange,
          fxInterventionHistory: coop.sharedFxHistory,
          history: coop.sharedHistory,
        })
        const newFxHistory = [...coop.sharedFxHistory, coop.sharedPendingAction.fxInterventionBnMad].slice(-4)

        const nextQuarter = currentQuarterIndex + 1
        const isFinished = nextQuarter >= maxQ

        set(s => ({
          coop: {
            sharedHistory: [...s.coop.sharedHistory, s.coop.sharedState],
            sharedActionHistory: [...(s.coop.sharedActionHistory ?? []), s.coop.sharedPendingAction],
            sharedState: result.newState,
            sharedActiveShocks: activeShocks,
            sharedPendingAction: { ...DEFAULT_POLICY_ACTION },
            sharedPreviousRateChange: s.coop.sharedPendingAction.policyRateChangeBp,
            sharedFxHistory: newFxHistory,
            p1Locked: false,
            p2Locked: false,
          },
          currentQuarterIndex: nextQuarter,
          phase: isFinished ? 'finished' : 'playing',
        }))
      },

      // ── Scoring ────────────────────────────────────────────────────────

      getScores() {
        const { duel, difficultyLevel, scenario } = get()
        const p1All = [...duel.p1History, duel.p1State]
        const p2All = [...duel.p2History, duel.p2State]
        if (p1All.length < 2 || p2All.length < 2) return null
        return {
          p1: computeScore(p1All, difficultyLevel, { scenario, actionHistory: duel.p1ActionHistory ?? [] }),
          p2: computeScore(p2All, difficultyLevel, { scenario, actionHistory: duel.p2ActionHistory ?? [] }),
        }
      },

      getCoopScore() {
        const { coop, difficultyLevel, scenario } = get()
        const all = [...coop.sharedHistory, coop.sharedState]
        if (all.length < 2) return null
        return computeScore(all, difficultyLevel, { scenario, actionHistory: coop.sharedActionHistory ?? [] })
      },

      getBadges() {
        const { mode, duel, coop, difficultyLevel } = get()
        const badges: MultiplayerBadge[] = []

        if (mode === 'duel') {
          const p1All = [...duel.p1History, duel.p1State]
          const p2All = [...duel.p2History, duel.p2State]
          if (p1All.length < 2) return badges

          const p1Avg = p1All.reduce((a, s) => a + s.inflation, 0) / p1All.length
          const p2Avg = p2All.reduce((a, s) => a + s.inflation, 0) / p2All.length

          // Le faucon (plus restrictif)
          const p1AvgRate = p1All.reduce((a, s) => a + s.policyRate, 0) / p1All.length
          const p2AvgRate = p2All.reduce((a, s) => a + s.policyRate, 0) / p2All.length
          const hawkish = p1AvgRate > p2AvgRate ? 'p1' : 'p2'
          badges.push({
            id: 'hawk', label: 'Le Faucon de Fer', emoji: '🦅',
            description: 'Le gouverneur le plus restrictif du duel.',
            player: hawkish,
          })

          // La colombe (plus accommodant)
          const dovish = hawkish === 'p1' ? 'p2' : 'p1'
          badges.push({
            id: 'dove', label: 'La Colombe Prudente', emoji: '🕊️',
            description: 'Le gouverneur le plus accommodant du duel.',
            player: dovish,
          })

          // Stabilisateur (plus proche de la cible)
          const p1Dev = Math.abs(p1Avg - 2)
          const p2Dev = Math.abs(p2Avg - 2)
          badges.push({
            id: 'stabilizer', label: 'Le Stabilisateur', emoji: '🎯',
            description: 'Inflation la plus proche de la cible de 2%.',
            player: p1Dev < p2Dev ? 'p1' : 'p2',
          })

          // Crédibilité
          const p1Cred = p1All.reduce((a, s) => a + s.centralBankCredibility, 0) / p1All.length
          const p2Cred = p2All.reduce((a, s) => a + s.centralBankCredibility, 0) / p2All.length
          badges.push({
            id: 'credible', label: "L'Oracle des Marchés", emoji: '🔮',
            description: 'Crédibilité moyenne la plus élevée.',
            player: p1Cred > p2Cred ? 'p1' : 'p2',
          })

          // Croissance
          const p1Growth = p1All.reduce((a, s) => a + s.gdpGrowth, 0) / p1All.length
          const p2Growth = p2All.reduce((a, s) => a + s.gdpGrowth, 0) / p2All.length
          badges.push({
            id: 'growth', label: 'Le Bâtisseur du PIB', emoji: '📈',
            description: 'Croissance moyenne la plus forte.',
            player: p1Growth > p2Growth ? 'p1' : 'p2',
          })

        } else {
          // Coop badges
          const all = [...coop.sharedHistory, coop.sharedState]
          if (all.length < 2) return badges

          const score = computeScore(all, difficultyLevel)

          if (score.grade === 'A') {
            badges.push({ id: 'perfect_team', label: 'Duo de Légende', emoji: '👑', description: 'Score A obtenu en coopération !', player: 'p1' })
            badges.push({ id: 'perfect_team_2', label: 'Duo de Légende', emoji: '👑', description: 'Score A obtenu en coopération !', player: 'p2' })
          }

          const avgInfl = all.reduce((a, s) => a + s.inflation, 0) / all.length
          if (Math.abs(avgInfl - 2) < 0.3) {
            badges.push({ id: 'precision', label: 'Chirurgiens Monétaires', emoji: '🔬', description: 'Inflation maintenue à ±0,3 pt de la cible.', player: 'p1' })
          }
        }

        return badges
      },

      // ── Lifecycle ──────────────────────────────────────────────────────

      reset() {
        set({
          phase: 'setup',
          seed: generateSeed(),
          currentQuarterIndex: 0,
          duel: getDefaultDuelState('standard'),
          coop: getDefaultCoopState('standard'),
        })
      },
    }),
    {
      name: 'cbs-multiplayer',
      partialize: (state) => ({
        mode: state.mode,
        phase: state.phase,
        player1: state.player1,
        player2: state.player2,
        scenario: state.scenario,
        difficultyLevel: state.difficultyLevel,
        seed: state.seed,
        currentQuarterIndex: state.currentQuarterIndex,
        duel: state.duel,
        coop: state.coop,
      }),
    },
  ),
)
