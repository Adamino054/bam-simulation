import type { EconomicState, PolicyAction, Shock } from './state'
import { step } from './simulator'
import { stepV5 } from './v5'
import {
  historicalDate,
  historicalGapLag4,
  historicalPotentialGrowth,
  historicalShocks,
  isHistoricalScenario,
} from './v5/historicalScenarios'
import { DEFAULT_POLICY_ACTION } from './state'
import { fmtQuarter } from '@/lib/format'

export function projectStateFourQuarters(
  currentState: EconomicState,
  history: EconomicState[],
  pendingAction: PolicyAction,
  activeShocks: Shock[],
  seed: number,
  scenarioId?: string,
): EconomicState {
  if (!isHistoricalScenario(scenarioId as any)) {
    let simState = { ...currentState }
    let simActiveShocks = [...activeShocks]

    for (let h = 0; h < 4; h++) {
      const actionForQuarter = h === 0
        ? pendingAction
        : {
            ...DEFAULT_POLICY_ACTION,
            policyRateChangeBp: 0,
          }

      const result = step(simState, actionForQuarter, simActiveShocks, seed + 50000 + h * 100, {
        scenarioId: scenarioId as any,
      })

      simState = result.newState
      simActiveShocks = [
        ...simActiveShocks
          .map(s => ({ ...s, remainingQuarters: s.remainingQuarters - 1 }))
          .filter(s => s.remainingQuarters > 0),
        ...result.triggeredShocks,
      ]
    }

    return simState
  }

  let simState = { ...currentState }
  let simHistory = [...history, currentState]

  for (let h = 0; h < 4; h++) {
    const actionForQuarter = h === 0
      ? pendingAction
      : {
          ...DEFAULT_POLICY_ACTION,
          policyRateChangeBp: 0,
        }

    const result = stepV5(simState, actionForQuarter, [], seed + 50000 + h * 100, {
      scenarioId: scenarioId as any,
      realShocks: historicalShocks(scenarioId as any, simState.quarter) ?? undefined,
      outputGapLag4: historicalGapLag4(
        scenarioId as any,
        simState.quarter,
        simHistory.map(s => s.outputGap),
      ),
      potentialGrowth: historicalPotentialGrowth(scenarioId as any, simState.quarter),
    })

    simState = result.newState
    simState.date = historicalDate(scenarioId as any, simState.quarter)
    simHistory = [...simHistory, simState]
  }

  return simState
}

export interface FanChartPoint {
  quarterLabel: string
  quarterIndex: number
  isForecast: boolean
  inflation: number          // For history or median projection
  p50: [number, number]      // 50% confidence interval [p25, p75]
  p90: [number, number]      // 90% confidence interval [p5, p95]
  median: number
}

/**
 * Box-Muller transform to generate normally distributed random numbers.
 */
function nextGaussian(mean = 0, stdDev = 1): number {
  const u = 1 - Math.random() // Converting [0,1) to (0,1]
  const v = Math.random()
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
  return z * stdDev + mean
}

/**
 * Runs 100 stochastically shocked simulations of the next 4 quarters.
 * Returns aggregated percentiles for rendering the Fan Chart.
 */
export function generateInflationFanChart(
  currentState: EconomicState,
  history: EconomicState[],
  pendingAction: PolicyAction,
  activeShocks: Shock[],
  seed: number,
  scenarioId?: string,
): FanChartPoint[] {
  const runsCount = 100
  const forecastHorizon = 4
  
  // Standard deviations for stochastics (tuned for Moroccan economy volatility)
  const SIGMA_INFLATION = 0.4 // 0.4% std dev on inflation supply shock
  const SIGMA_OUTPUT_GAP = 0.5 // 0.5% std dev on output gap demand shock
  const useHistoricalV5 = isHistoricalScenario(scenarioId as any)

  // 1. Run the simulations
  // We will store the inflation paths for each run: paths[runIndex][quarterIndex]
  const paths: number[][] = Array.from({ length: runsCount }, () => [])

  for (let run = 0; run < runsCount; run++) {
    let simState = { ...currentState }
    let simActiveShocks = [...activeShocks]
    let simHistory = [...history, currentState]
    
    // For each future quarter:
    for (let h = 0; h < forecastHorizon; h++) {
      // Draw random Gaussian shocks representing future uncertainty
      const supplyShockNoise = nextGaussian(0, SIGMA_INFLATION)
      const demandShockNoise = nextGaussian(0, SIGMA_OUTPUT_GAP)

      // Create temporary stochastics shocks
      const tempSupplyShock: Shock = {
        id: `mc_supply_run${run}_h${h}`,
        label: 'Stochastics Supply Noise',
        type: 'supply',
        magnitude: 1.0,
        remainingQuarters: 1,
        description: 'Monte Carlo stochastic noise',
        inflationImpact: supplyShockNoise,
        outputGapImpact: 0,
        lendingRateImpact: 0,
        externalDemandImpact: 0,
      }

      const tempDemandShock: Shock = {
        id: `mc_demand_run${run}_h${h}`,
        label: 'Stochastics Demand Noise',
        type: 'demand',
        magnitude: 1.0,
        remainingQuarters: 1,
        description: 'Monte Carlo stochastic noise',
        inflationImpact: 0,
        outputGapImpact: demandShockNoise,
        lendingRateImpact: 0,
        externalDemandImpact: 0,
      }

      // First quarter (h=0) applies the user's pending action.
      // Subsequent quarters keep the policy rate at the newly decided rate, but reset other options.
      const actionForQuarter: PolicyAction = h === 0 
        ? pendingAction 
        : {
            ...DEFAULT_POLICY_ACTION,
            policyRateChangeBp: 0, // Keep rate at its new level
            // Reserve requirement, market ops are neutral
          }

      // Combine current active shocks, decremented by timeline, with our stochastic noise
      const stepShocks = [...simActiveShocks, tempSupplyShock, tempDemandShock]

      // Advance one step stochastically.
      // Historical scenarios use stepV5 plus the historical residuals for the quarter,
      // then add Monte-Carlo noise around those residuals.
      const simSeed = seed + run * 79 + h * 997
      const result = useHistoricalV5
        ? stepV5(simState, actionForQuarter, [], simSeed, {
            scenarioId: scenarioId as any,
            realShocks: {
              upi: (historicalShocks(scenarioId as any, simState.quarter)?.upi ?? 0) + supplyShockNoise,
              uy: (historicalShocks(scenarioId as any, simState.quarter)?.uy ?? 0) + demandShockNoise,
              uu: historicalShocks(scenarioId as any, simState.quarter)?.uu ?? 0,
            },
            outputGapLag4: historicalGapLag4(
              scenarioId as any,
              simState.quarter,
              simHistory.map(s => s.outputGap),
            ),
            potentialGrowth: historicalPotentialGrowth(scenarioId as any, simState.quarter),
          })
        : step(simState, actionForQuarter, stepShocks, simSeed, {
            scenarioId: scenarioId as any,
          })

      simState = result.newState
      if (useHistoricalV5) {
        simState.date = historicalDate(scenarioId as any, simState.quarter)
      }
      simHistory = [...simHistory, simState]
      simActiveShocks = [
        ...simActiveShocks
          .map(s => ({ ...s, remainingQuarters: s.remainingQuarters - 1 }))
          .filter(s => s.remainingQuarters > 0),
        ...result.triggeredShocks,
      ]

      paths[run].push(simState.inflation)
    }
  }

  // 2. Aggregate the forecast paths to calculate percentiles for each quarter h
  const forecastPoints: FanChartPoint[] = []
  
  let currentYear = currentState.date.year
  let currentQ = currentState.date.q

  for (let h = 0; h < forecastHorizon; h++) {
    // Collect inflation values across all 100 runs for this step h
    const values = paths.map(p => p[h])
    values.sort((a, b) => a - b) // Sort ascending

    // Extract percentiles
    // 90% confidence interval: [5th, 95th]
    const p5 = values[4]  // index 4 of 100
    const p95 = values[94] // index 94 of 100

    // 50% confidence interval: [25th, 75th]
    const p25 = values[24]
    const p75 = values[74]

    // Median
    const median = values[49]

    // Advance date
    currentQ = (currentQ % 4) + 1
    if (currentQ === 1) {
      currentYear += 1
    }

    forecastPoints.push({
      quarterLabel: fmtQuarter(currentYear, currentQ as any),
      quarterIndex: currentState.quarter + 1 + h,
      isForecast: true,
      inflation: median,
      p50: [p25, p75],
      p90: [p5, p95],
      median: median,
    })
  }

  // 3. Build history points (up to last 4 quarters) to provide visual continuity
  const historyHorizon = Math.min(history.length, 4)
  const historyPoints: FanChartPoint[] = []

  // Add the current actual state first (origin of the fan)
  const currentActualPoint: FanChartPoint = {
    quarterLabel: fmtQuarter(currentState.date.year, currentState.date.q as any),
    quarterIndex: currentState.quarter,
    isForecast: false,
    inflation: currentState.inflation,
    p50: [currentState.inflation, currentState.inflation],
    p90: [currentState.inflation, currentState.inflation],
    median: currentState.inflation,
  }

  // Add older history points
  for (let i = historyHorizon; i > 0; i--) {
    const s = history[history.length - i]
    historyPoints.push({
      quarterLabel: fmtQuarter(s.date.year, s.date.q as any),
      quarterIndex: s.quarter,
      isForecast: false,
      inflation: s.inflation,
      p50: [s.inflation, s.inflation],
      p90: [s.inflation, s.inflation],
      median: s.inflation,
    })
  }

  return [...historyPoints, currentActualPoint, ...forecastPoints]
}
