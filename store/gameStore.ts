import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { EconomicState, PolicyAction, Shock, ScenarioId, DifficultyLevel } from '@/engine/state'
import { DEFAULT_POLICY_ACTION } from '@/engine/state'
import { INITIAL_STATE } from '@/engine/parameters'
import { step } from '@/engine/simulator'
import { SCENARIOS } from '@/engine/scenarios'
import { fetchCentralBankPolicySettings } from '@/engine/centralBankPolicy'
import { getLevelConfig } from '@/engine/difficulty'
import { FREE_MODE_QUARTERS } from '@/lib/constants'
import { PRESS_CONFERENCES } from '@/engine/pressConferences'

interface GameStore {
  scenario: ScenarioId | null
  difficultyLevel: DifficultyLevel
  currentState: EconomicState
  history: EconomicState[]
  actionHistory: PolicyAction[]
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
  campaignStatus: 'won' | 'lost' | null
  pendingPressConference: { questionId: string; year: number } | null

  startGame: (scenario: ScenarioId, level?: DifficultyLevel) => Promise<void>
  syncInitialCentralBankPolicy: () => Promise<void>
  setDifficultyLevel: (level: DifficultyLevel) => void
  setPendingAction: (action: Partial<PolicyAction>) => void
  advanceTurn: () => void
  answerPressConference: (optionIndex: number) => void
  reset: () => void
  setTransitioning: (v: boolean) => void
  setFreeMode: (v: boolean) => void
}

function generateSeed(): number {
  return Math.floor(Math.random() * 1_000_000)
}

function applyCentralBankInitialPolicy(state: EconomicState, policyRate: number, reserveRequirement: number): EconomicState {
  const policyRateDelta = policyRate - state.policyRate

  return {
    ...state,
    policyRate,
    interbankRate: policyRate,
    reserveRequirement,
    lendingRate: Math.max(0, Number((state.lendingRate + policyRateDelta).toFixed(2))),
  }
}

function scenarioPolicyDate(state: EconomicState): string {
  const quarterEndMonth = state.date.q * 3
  const day = state.date.q === 1 || state.date.q === 4 ? 31 : 30
  return `${state.date.year}-${String(quarterEndMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function shouldUseLivePolicy(scenarioId: ScenarioId, state: EconomicState): boolean {
  return scenarioId !== 'volcker1979' && state.date.year >= 2008
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      scenario: null,
      difficultyLevel: 'intermediate' as DifficultyLevel,
      currentState: INITIAL_STATE,
      history: [],
      actionHistory: [],
      activeShocks: [],
      pendingAction: { ...DEFAULT_POLICY_ACTION },
      status: 'menu',
      seed: generateSeed(),
      isTransitioning: false,
      freeMode: false,
      previousPolicyRateChangeBp: 0,
      fxInterventionHistory: [],
      campaignStatus: null,
      pendingPressConference: null,

      async startGame(scenarioId, level) {
        const scenario = SCENARIOS[scenarioId]
        const chosenLevel = level ?? get().difficultyLevel
        let initialState = { ...scenario.initialState }

        if (shouldUseLivePolicy(scenarioId, scenario.initialState)) {
          const policy = await fetchCentralBankPolicySettings(scenarioPolicyDate(scenario.initialState))
          initialState = applyCentralBankInitialPolicy(
            scenario.initialState,
            policy.policyRate,
            policy.reserveRequirement,
          )
        }

        set({
          scenario: scenarioId,
          difficultyLevel: chosenLevel,
          currentState: initialState,
          history: [],
          actionHistory: [],
          activeShocks: [...scenario.initialShocks],
          pendingAction: { ...DEFAULT_POLICY_ACTION },
          status: 'playing',
          seed: generateSeed(),
          isTransitioning: false,
          previousPolicyRateChangeBp: 0,
          fxInterventionHistory: [],
          campaignStatus: null,
        })
      },

      async syncInitialCentralBankPolicy() {
        const { currentState, history, status, scenario } = get()
        if (status !== 'playing' || currentState.quarter !== 0 || history.length > 0) return
        if (!scenario || !shouldUseLivePolicy(scenario, currentState)) return

        const scenarioInitialState = SCENARIOS[scenario].initialState
        const policy = await fetchCentralBankPolicySettings(scenarioPolicyDate(scenarioInitialState))
        set({
          currentState: applyCentralBankInitialPolicy(
            scenarioInitialState,
            policy.policyRate,
            policy.reserveRequirement,
          ),
        })
      },

      setDifficultyLevel(level) {
        set({ difficultyLevel: level })
      },

      setPendingAction(action) {
        set(state => ({ pendingAction: { ...state.pendingAction, ...action } }))
      },

      advanceTurn() {
        const {
          currentState, pendingAction, activeShocks, seed, history,
          actionHistory, scenario, previousPolicyRateChangeBp, fxInterventionHistory, freeMode,
        } = get()
        const { difficultyLevel } = get()
        const levelConfig = getLevelConfig(difficultyLevel)
        
        const isCampaign = scenario === 'volcker1979' || scenario === 'crisis2008'
        const maxQuarters = isCampaign ? 8 : (freeMode ? FREE_MODE_QUARTERS : levelConfig.quarters)

        if (currentState.quarter >= maxQuarters - 1) {
          if (isCampaign) {
            let won = false
            if (scenario === 'volcker1979') {
              won = currentState.inflation < 3.0 && currentState.centralBankCredibility > 0
            } else if (scenario === 'crisis2008') {
              won = currentState.nplRatio < 10.0 && currentState.creditGrowth > 2.0
            }
            set({
              status: 'finished',
              campaignStatus: won ? 'won' : 'lost'
            })
          } else {
            set({ status: 'finished' })
          }
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

        let immediateFinished = false
        let nextCampaignStatus: 'won' | 'lost' | null = null

        if (scenario === 'volcker1979' && result.newState.centralBankCredibility <= 0) {
          immediateFinished = true
          nextCampaignStatus = 'lost'
        }

        const isNextStepFinish = result.newState.quarter >= maxQuarters

        if (isNextStepFinish && isCampaign && !immediateFinished) {
          immediateFinished = true
          if (scenario === 'volcker1979') {
            const won = result.newState.inflation < 3.0 && result.newState.centralBankCredibility > 0
            nextCampaignStatus = won ? 'won' : 'lost'
          } else if (scenario === 'crisis2008') {
            const won = result.newState.nplRatio < 10.0 && result.newState.creditGrowth > 2.0
            nextCampaignStatus = won ? 'won' : 'lost'
          }
        }

        const nextQuarter = result.newState.quarter
        const justFinishedYear = nextQuarter > 0 && nextQuarter % 4 === 0
        const completedYear = Math.floor(nextQuarter / 4)
        const hasConf = PRESS_CONFERENCES[completedYear] !== undefined
        const pendingConf = justFinishedYear && hasConf ? { questionId: PRESS_CONFERENCES[completedYear].id, year: completedYear } : null

        set({
          history: [...history, currentState],
          actionHistory: [...actionHistory, { ...pendingAction }],
          currentState: result.newState,
          activeShocks: newActiveShocks,
          pendingAction: { ...DEFAULT_POLICY_ACTION },
          status: immediateFinished ? 'finished' : (result.newState.quarter >= maxQuarters ? 'finished' : 'playing'),
          previousPolicyRateChangeBp: pendingAction.policyRateChangeBp,
          fxInterventionHistory: newFxHistory,
          campaignStatus: nextCampaignStatus,
          pendingPressConference: pendingConf,
        })
      },

      answerPressConference(optionIndex) {
        const { pendingPressConference, currentState } = get()
        if (!pendingPressConference) return
        const question = PRESS_CONFERENCES[pendingPressConference.year]
        if (!question) return
        const option = question.options[optionIndex]
        if (!option) return

        const partialNewState = option.apply(currentState)
        set(state => ({
          currentState: { ...state.currentState, ...partialNewState },
          pendingPressConference: null
        }))
      },

      reset() {
        set({
          scenario: null,
          currentState: INITIAL_STATE,
          history: [],
          actionHistory: [],
          activeShocks: [],
          pendingAction: { ...DEFAULT_POLICY_ACTION },
          status: 'menu',
          seed: generateSeed(),
          isTransitioning: false,
          previousPolicyRateChangeBp: 0,
          fxInterventionHistory: [],
          campaignStatus: null,
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
        difficultyLevel: state.difficultyLevel,
        currentState: state.currentState,
        history: state.history,
        actionHistory: state.actionHistory,
        activeShocks: state.activeShocks,
        pendingAction: state.pendingAction,
        status: state.status,
        seed: state.seed,
        freeMode: state.freeMode,
        previousPolicyRateChangeBp: state.previousPolicyRateChangeBp,
        fxInterventionHistory: state.fxInterventionHistory,
        campaignStatus: state.campaignStatus,
        pendingPressConference: state.pendingPressConference,
      }),
    },
  ),
)
