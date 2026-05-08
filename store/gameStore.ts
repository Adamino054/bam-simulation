import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { EconomicState, PolicyAction, Shock, ScenarioId } from '@/engine/state'
import { DEFAULT_POLICY_ACTION } from '@/engine/state'
import { INITIAL_STATE } from '@/engine/parameters'
import { step } from '@/engine/simulator'
import { SCENARIOS } from '@/engine/scenarios'
import { TOTAL_QUARTERS } from '@/lib/constants'

interface GameStore {
  scenario: ScenarioId | null
  currentState: EconomicState
  history: EconomicState[]
  activeShocks: Shock[]
  pendingAction: PolicyAction
  status: 'menu' | 'playing' | 'finished'
  seed: number
  isTransitioning: boolean

  startGame: (scenario: ScenarioId) => void
  setPendingAction: (action: Partial<PolicyAction>) => void
  advanceTurn: () => void
  reset: () => void
  setTransitioning: (v: boolean) => void
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
        })
      },

      setPendingAction(action) {
        set(state => ({ pendingAction: { ...state.pendingAction, ...action } }))
      },

      advanceTurn() {
        const { currentState, pendingAction, activeShocks, seed, history } = get()
        if (currentState.quarter >= TOTAL_QUARTERS - 1) {
          set({ status: 'finished' })
          return
        }

        const result = step(currentState, pendingAction, activeShocks, seed)
        const newActiveShocks = [
          ...activeShocks
            .map(s => ({ ...s, remainingQuarters: s.remainingQuarters - 1 }))
            .filter(s => s.remainingQuarters > 0),
          ...result.triggeredShocks,
        ]

        set({
          history: [...history, currentState],
          currentState: result.newState,
          activeShocks: newActiveShocks,
          pendingAction: { ...DEFAULT_POLICY_ACTION },
          status: result.newState.quarter >= TOTAL_QUARTERS ? 'finished' : 'playing',
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
        })
      },

      setTransitioning(v) {
        set({ isTransitioning: v })
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
      }),
    },
  ),
)
