import type { DifficultyLevel, EconomicState, PolicyAction, ScenarioId, Shock, SimulationResult } from './state'
import { DEFAULT_POLICY_ACTION } from './state'
import { getLevelConfig } from './difficulty'
import { SCENARIOS } from './scenarios'
import { step } from './simulator'
import { stepV5 } from './v5'
import {
  historicalBamRate,
  historicalBamReserve,
  historicalDate,
  historicalGapLag4,
  historicalInitialState,
  historicalPotentialGrowth,
  historicalQuartersCount,
  historicalShocks,
  isHistoricalScenario,
} from './v5/historicalScenarios'

export interface ScenarioStepResult {
  result: SimulationResult
  activeShocks: Shock[]
}

export interface ScenarioStepOptions {
  state: EconomicState
  action: PolicyAction
  activeShocks: Shock[]
  seed: number
  scenario: ScenarioId
  previousPolicyRateChangeBp?: number
  fxInterventionHistory?: number[]
  history?: EconomicState[]
}

export function cloneEconomicState(state: EconomicState): EconomicState {
  return { ...state, date: { ...state.date } }
}

export function getScenarioInitialState(scenario: ScenarioId): EconomicState {
  const base = cloneEconomicState(SCENARIOS[scenario].initialState)
  return isHistoricalScenario(scenario) ? historicalInitialState(scenario, base) : base
}

export function getScenarioInitialShocks(scenario: ScenarioId): Shock[] {
  return isHistoricalScenario(scenario) ? [] : SCENARIOS[scenario].initialShocks.map(shock => ({ ...shock }))
}

export function getScenarioMaxQuarters(scenario: ScenarioId, difficultyLevel: DifficultyLevel): number {
  return isHistoricalScenario(scenario)
    ? historicalQuartersCount(scenario)
    : getLevelConfig(difficultyLevel).quarters
}

export function getHistoricalBamAction(scenario: ScenarioId, quarter: number): PolicyAction | null {
  if (!isHistoricalScenario(scenario)) return null
  const rate = historicalBamRate(scenario, quarter)
  const previousRate = quarter === 0
    ? getScenarioInitialState(scenario).policyRate
    : historicalBamRate(scenario, quarter - 1)
  const reserve = historicalBamReserve(scenario, quarter)
  const previousReserve = quarter === 0
    ? getScenarioInitialState(scenario).reserveRequirement
    : historicalBamReserve(scenario, quarter - 1)

  if (rate === null || previousRate === null || reserve === null || previousReserve === null) {
    return null
  }

  return {
    ...DEFAULT_POLICY_ACTION,
    policyRateChangeBp: Math.round((rate - previousRate) * 100),
    reserveRequirementChangeBp: Math.round((reserve - previousReserve) * 100),
  }
}

export function runScenarioStep(options: ScenarioStepOptions): ScenarioStepResult {
  const {
    state,
    action,
    activeShocks,
    seed,
    scenario,
    previousPolicyRateChangeBp = 0,
    fxInterventionHistory = [],
    history = [],
  } = options

  if (isHistoricalScenario(scenario)) {
    const gapHistory = [...history.slice(1).map(s => s.outputGap), state.outputGap]
    const result = stepV5(
      { ...state, date: historicalDate(scenario, state.quarter) },
      action,
      [],
      seed,
      {
        scenarioId: scenario,
        previousPolicyRateChangeBp,
        fxInterventionHistory,
        realShocks: historicalShocks(scenario, state.quarter) ?? undefined,
        outputGapLag4: historicalGapLag4(scenario, state.quarter, gapHistory),
        potentialGrowth: historicalPotentialGrowth(scenario, state.quarter),
      },
    )
    result.newState.date = historicalDate(scenario, result.newState.quarter)
    return { result, activeShocks: [] }
  }

  const result = step(
    state,
    action,
    activeShocks,
    seed,
    { scenarioId: scenario, previousPolicyRateChangeBp, fxInterventionHistory },
  )
  const nextShocks = [
    ...activeShocks
      .map(shock => ({ ...shock, remainingQuarters: shock.remainingQuarters - 1 }))
      .filter(shock => shock.remainingQuarters > 0),
    ...result.triggeredShocks,
  ]

  return { result, activeShocks: nextShocks }
}
