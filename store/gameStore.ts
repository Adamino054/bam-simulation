import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { EconomicState, PolicyAction, Shock, ScenarioId } from '@/engine/state'
import { DEFAULT_POLICY_ACTION } from '@/engine/state'
import { INITIAL_STATE } from '@/engine/parameters'
import { step } from '@/engine/simulator'
import { SCENARIOS } from '@/engine/scenarios'
import { TOTAL_QUARTERS, FREE_MODE_QUARTERS } from '@/lib/constants'

interface GameStore {
  scenario: ScenarioId | null
  currentState: EconomicState
  history: EconomicState[]
  activeShocks: Shock[]
  pendingAction: PolicyAction
  status: 'menu' | 'playing' | 'finished'
  seed: number
  isTransitioning: boolean
  freeMode: boolean
  /** Track previous policy rate change for credibility reversal detection */
  previousPolicyRateChangeBp: number
  /** Track FX intervention history for credibility boost */
  fxInterventionHistory: number[]

  startGame: (scenario: ScenarioId) => void
  setPendingAction: (action: Partial<PolicyAction>) => void
  advanceTurn: () => void
  reset: () => void
  setTransitioning: (v: boolean) => void
  setFreeMode: (v: boolean) => void
}

function generateSeed(): number {
  return Math.floor(Math.random() * 1_000_000)
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      scenario: null,
      currentState: INITIAL_STATE,
      history: [],
      activeShocks: [],
      pendingAction: { ...DEFAULT_POLICY_ACTION },
      status: 'menu',
      seed: generateSeed(),
      isTransitioning: false,
      freeMode: false,
      previousPolicyRateChangeBp: 0,
      fxInterventionHistory: [],

      startGame(scenarioId) {
        const scenario = SCENARIOS[scenarioId]
        set({
          scenario: scenarioId,
          currentState: { ...scenario.initialState },
          history: [],
          activeShocks: [...scenario.initialShocks],
          pendingAction: { ...DEFAULT_POLICY_ACTION },
          status: 'playing',
          seed: generateSeed(),
          isTransitioning: false,
          previousPolicyRateChangeBp: 0,
          fxInterventionHistory: [],
        })
      },

      setPendingAction(action) {
        set(state => ({ pendingAction: { ...state.pendingAction, ...action } }))
      },

      advanceTurn() {
        const {
          currentState, pendingAction, activeShocks, seed, history,
          scenario, previousPolicyRateChangeBp, fxInterventionHistory, freeMode,
        } = get()
        const maxQuarters = freeMode ? FREE_MODE_QUARTERS : TOTAL_QUARTERS
        if (currentState.quarter >= maxQuarters - 1) {
          set({ status: 'finished' })
          return
        }

        const result = step(currentState, pendingAction, activeShocks, seed, {
          scenarioId: scenario ?? undefined,
          previousPolicyRateChangeBp,
          fxInterventionHistory,
        })
        const newActiveShocks = [
          ...activeShocks
            .map(s => ({ ...s, remainingQuarters: s.remainingQuarters - 1 }))
            .filter(s => s.remainingQuarters > 0),
          ...result.triggeredShocks,
        ]

        const newFxHistory = [...fxInterventionHistory, pendingAction.fxInterventionBnMad].slice(-4)

        set({
          history: [...history, currentState],
          currentState: result.newState,
          activeShocks: newActiveShocks,
          pendingAction: { ...DEFAULT_POLICY_ACTION },
          status: result.newState.quarter >= maxQuarters ? 'finished' : 'playing',
          previousPolicyRateChangeBp: pendingAction.policyRateChangeBp,
          fxInterventionHistory: newFxHistory,
        })
      },

      reset() {
        set({
          scenario: null,
          currentState: INITIAL_STATE,
          history: [],
          activeShocks: [],
          pendingAction: { ...DEFAULT_POLICY_ACTION },
          status: 'menu',
          seed: generateSeed(),
          isTransitioning: false,
          previousPolicyRateChangeBp: 0,
          fxInterventionHistory: [],
        })
      },

      setTransitioning(v) {
        set({ isTransitioning: v })
      },

      setFreeMode(v) {
        set({ freeMode: v })
      },
    }),
    {
      name: 'cbs-game-state',
      partialize: (state) => ({
        scenario: state.scenario,
        currentState: state.currentState,
        history: state.history,
        activeShocks: state.activeShocks,
        pendingAction: state.pendingAction,
        status: state.status,
        seed: state.seed,
        freeMode: state.freeMode,
        previousPolicyRateChangeBp: state.previousPolicyRateChangeBp,
        fxInterventionHistory: state.fxInterventionHistory,
      }),
    },
  ),
)
