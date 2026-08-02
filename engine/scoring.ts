/**
 * Calcul du score de fin de partie.
 *
 * Scénarios non historiques : score macro absolu (inflation, croissance,
 * stabilité, crédibilité). Scénarios historiques : score de reproduction du
 * repère BAM/HCP, pour que les mêmes choix BAM donnent le meilleur score.
 */

import type { EconomicState, PolicyAction, ScenarioId } from './state'
import { getLevelConfig } from './difficulty'
import type { DifficultyLevel } from './difficulty'
import {
  historicalBamRate,
  historicalBamReserve,
  historicalHcp,
  isHistoricalScenario,
} from './v5/historicalScenarios'

export interface ScoreResult {
  total: number
  inflation: number    // sur 35
  growth: number       // sur 25
  stability: number    // sur 20
  credibility: number  // sur 20
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  commentary: string
  scoringMode?: 'macro' | 'historical-benchmark'
  details: {
    avgInflationDeviation: number
    avgGdpGrowth: number
    inflationVariance: number
    outputGapVariance: number
    avgCredibility: number
    avgNplRatio: number
    avgRateDeviationBp?: number
    avgReserveDeviationBp?: number
    avgHistoricalTrajectoryDeviation?: number
  }
}

const INFLATION_TARGET = 2.0
const HISTORICAL_WEIGHTS = {
  rate: 50,
  reserve: 15,
  trajectory: 20,
  consistency: 15,
}

interface ComputeScoreOptions {
  scenario?: ScenarioId | null
  actionHistory?: PolicyAction[]
}

export function computeScore(
  history: EconomicState[],
  level: DifficultyLevel = 'intermediate',
  options?: ComputeScoreOptions,
): ScoreResult {
  if (history.length === 0) {
    return {
      total: 0, inflation: 0, growth: 0, stability: 0, credibility: 0,
      grade: 'F', commentary: 'Aucune donnée disponible.',
      scoringMode: 'macro',
      details: { avgInflationDeviation: 0, avgGdpGrowth: 0, inflationVariance: 0, outputGapVariance: 0, avgCredibility: 70, avgNplRatio: 7.0 },
    }
  }

  if (options?.scenario && isHistoricalScenario(options.scenario) && options.actionHistory?.length) {
    return computeHistoricalBenchmarkScore(history, options.actionHistory, options.scenario, level)
  }

  const n = history.length
  const levelConfig = getLevelConfig(level)
  const weights = levelConfig.scoringWeights

  // ── Score inflation (weights.inflation pts) ─────────────────────────
  const deviations = history.map(s => Math.abs(s.inflation - INFLATION_TARGET))
  const avgDeviation = deviations.reduce((a, b) => a + b, 0) / n
  // 0 déviation → weights.inflation pts ; déviation au-dessus de inflationTolerancePp descend linéairement à 0 à 4.0 pp
  const inflationTolerancePp = levelConfig.inflationTolerancePp
  const inflationScore = Math.max(0, weights.inflation * (1 - Math.max(0, avgDeviation - inflationTolerancePp) / (4 - inflationTolerancePp)))

  // ── Score croissance (weights.growth pts) ──────────────────────────
  const growthValues = history.map(s => s.gdpGrowth)
  const avgGrowth = growthValues.reduce((a, b) => a + b, 0) / n
  // 4 %+ → max pts ; growthThreshold → 0 pt (interpolation linéaire)
  const growthThreshold = level === 'beginner' ? 0.5 : level === 'expert' ? 1.5 : 1.0
  const growthScore = Math.max(0, Math.min(weights.growth, weights.growth * (avgGrowth - growthThreshold) / (4 - growthThreshold)))

  // ── Score stabilité (weights.stability pts) ─────────────────────────
  const inflMean = history.map(s => s.inflation).reduce((a, b) => a + b, 0) / n
  const inflVariance = history.map(s => (s.inflation - inflMean) ** 2).reduce((a, b) => a + b, 0) / n
  const gapMean = history.map(s => s.outputGap).reduce((a, b) => a + b, 0) / n
  const gapVariance = history.map(s => (s.outputGap - gapMean) ** 2).reduce((a, b) => a + b, 0) / n
  const avgNplRatio = history.map(s => s.nplRatio ?? 7.0).reduce((a, b) => a + b, 0) / n

  const combinedVariance = inflVariance + 0.5 * gapVariance
  // Variance ≤ 0.5 → base max pts ; variance ≥ varianceDenominator → 0 pt
  const varianceDenominator = level === 'beginner' ? 7 : level === 'expert' ? 3 : 5
  let stabilityScore = Math.max(0, weights.stability * (1 - combinedVariance / varianceDenominator))
  
  // Pénalité macroprudentielle (NPL élevés) - Réservé au mode Expert uniquement
  if (level === 'expert' && avgNplRatio > 7.5) {
    stabilityScore = Math.max(0, stabilityScore - (avgNplRatio - 7.5) * 2) // -2 pts par point de NPL au-dessus de 7.5%
  }

  // ── Score crédibilité (weights.credibility pts) ─────────────────────
  const credibilityValues = history.map(s => s.centralBankCredibility ?? 70)
  const avgCredibility = credibilityValues.reduce((a, b) => a + b, 0) / n
  // 80+ → max pts ; credibilityThreshold → 0 pt (interpolation linéaire)
  const credibilityThreshold = level === 'beginner' ? 20 : level === 'expert' ? 40 : 30
  const credibilityScore = Math.max(0, Math.min(weights.credibility, weights.credibility * (avgCredibility - credibilityThreshold) / (80 - credibilityThreshold)))

  // ── Total et grade ───────────────────────────────────────────────
  const total = Math.round(inflationScore + growthScore + stabilityScore + credibilityScore)
  const thresholds = levelConfig.gradeThresholds
  let grade: ScoreResult['grade'] = 'F'
  if (total >= thresholds.A) grade = 'A'
  else if (total >= thresholds.B) grade = 'B'
  else if (total >= thresholds.C) grade = 'C'
  else if (total >= thresholds.D) grade = 'D'

  // ── Commentaire généré ───────────────────────────────────────────
  const commentary = generateCommentary(grade, avgDeviation, avgGrowth, combinedVariance, avgCredibility)

  return {
    total,
    inflation: Math.round(inflationScore),
    growth: Math.round(growthScore),
    stability: Math.round(stabilityScore),
    credibility: Math.round(credibilityScore),
    grade,
    commentary,
    scoringMode: 'macro',
    details: {
      avgInflationDeviation: avgDeviation,
      avgGdpGrowth: avgGrowth,
      inflationVariance: inflVariance,
      outputGapVariance: gapVariance,
      avgCredibility,
      avgNplRatio,
    },
  }
}

function levelPenaltyScale(level: DifficultyLevel) {
  if (level === 'beginner') {
    return { rateZeroAtBp: 200, reserveZeroAtBp: 600, trajectoryZeroAt: 6, consistencyZeroAtBp: 220 }
  }
  if (level === 'expert') {
    return { rateZeroAtBp: 100, reserveZeroAtBp: 250, trajectoryZeroAt: 3, consistencyZeroAtBp: 90 }
  }
  return { rateZeroAtBp: 150, reserveZeroAtBp: 400, trajectoryZeroAt: 4, consistencyZeroAtBp: 150 }
}

function linearScore(max: number, value: number, zeroAt: number) {
  if (zeroAt <= 0) return value <= 0 ? max : 0
  return Math.max(0, Math.min(max, max * (1 - value / zeroAt)))
}

function computeHistoricalBenchmarkScore(
  states: EconomicState[],
  actions: PolicyAction[],
  scenario: ScenarioId,
  level: DifficultyLevel,
): ScoreResult {
  const scale = levelPenaltyScale(level)
  const periods = Math.min(actions.length, Math.max(0, states.length - 1))
  const rateDiffs: number[] = []
  const reserveDiffs: number[] = []
  const trajectoryDiffs: number[] = []
  let lastBamRate = states[0]?.policyRate ?? 0
  let lastBamReserve = states[0]?.reserveRequirement ?? 0

  for (let i = 0; i < periods; i++) {
    const before = states[i]
    const after = states[i + 1]
    const action = actions[i]
    if (!before || !after || !action) continue

    const bamRate = historicalBamRate(scenario, i) ?? lastBamRate
    const bamReserve = historicalBamReserve(scenario, i) ?? lastBamReserve
    lastBamRate = bamRate
    lastBamReserve = bamReserve

    const chosenRate = before.policyRate + action.policyRateChangeBp / 100
    const chosenReserve = before.reserveRequirement + action.reserveRequirementChangeBp / 100
    rateDiffs.push(Math.abs(chosenRate - bamRate) * 100)
    reserveDiffs.push(Math.abs(chosenReserve - bamReserve) * 100)

    const hcp = historicalHcp(scenario, i)
    if (hcp) {
      const diffs = [
        typeof hcp.inflation === 'number' ? Math.abs(after.inflation - hcp.inflation) : null,
        typeof hcp.outputGap === 'number' ? Math.abs(after.outputGap - hcp.outputGap) : null,
        typeof hcp.gdpGrowth === 'number' ? Math.abs(after.gdpGrowth - hcp.gdpGrowth) : null,
        typeof hcp.unemployment === 'number' ? Math.abs(after.unemployment - hcp.unemployment) : null,
      ].filter((v): v is number => typeof v === 'number')
      if (diffs.length) trajectoryDiffs.push(diffs.reduce((a, b) => a + b, 0) / diffs.length)
    }
  }

  const avg = (values: number[]) => values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0
  const avgRateDeviationBp = avg(rateDiffs)
  const avgReserveDeviationBp = avg(reserveDiffs)
  const avgHistoricalTrajectoryDeviation = avg(trajectoryDiffs)
  const combinedPolicyDeviation = avgRateDeviationBp + avgReserveDeviationBp * 0.25

  const rateScore = linearScore(HISTORICAL_WEIGHTS.rate, avgRateDeviationBp, scale.rateZeroAtBp)
  const reserveScore = linearScore(HISTORICAL_WEIGHTS.reserve, avgReserveDeviationBp, scale.reserveZeroAtBp)
  const trajectoryScore = linearScore(HISTORICAL_WEIGHTS.trajectory, avgHistoricalTrajectoryDeviation, scale.trajectoryZeroAt)
  const consistencyScore = linearScore(HISTORICAL_WEIGHTS.consistency, combinedPolicyDeviation, scale.consistencyZeroAtBp)
  const total = Math.round(rateScore + reserveScore + trajectoryScore + consistencyScore)

  let grade: ScoreResult['grade'] = 'F'
  if (total >= 90) grade = 'A'
  else if (total >= 80) grade = 'B'
  else if (total >= 65) grade = 'C'
  else if (total >= 50) grade = 'D'

  const n = states.length
  const avgInflation = states.reduce((a, s) => a + s.inflation, 0) / n
  const avgGrowth = states.reduce((a, s) => a + s.gdpGrowth, 0) / n
  const avgCredibility = states.reduce((a, s) => a + (s.centralBankCredibility ?? 70), 0) / n
  const avgNplRatio = states.reduce((a, s) => a + (s.nplRatio ?? 7), 0) / n
  const inflVariance = states.map(s => (s.inflation - avgInflation) ** 2).reduce((a, b) => a + b, 0) / n
  const gapMean = states.reduce((a, s) => a + s.outputGap, 0) / n
  const gapVariance = states.map(s => (s.outputGap - gapMean) ** 2).reduce((a, b) => a + b, 0) / n

  return {
    total,
    inflation: Math.round(rateScore),
    growth: Math.round(reserveScore),
    stability: Math.round(trajectoryScore),
    credibility: Math.round(consistencyScore),
    grade,
    commentary: generateHistoricalBenchmarkCommentary(total, avgRateDeviationBp, avgReserveDeviationBp, avgHistoricalTrajectoryDeviation),
    scoringMode: 'historical-benchmark',
    details: {
      avgInflationDeviation: Math.abs(avgInflation - INFLATION_TARGET),
      avgGdpGrowth: avgGrowth,
      inflationVariance: inflVariance,
      outputGapVariance: gapVariance,
      avgCredibility,
      avgNplRatio,
      avgRateDeviationBp,
      avgReserveDeviationBp,
      avgHistoricalTrajectoryDeviation,
    },
  }
}

function generateHistoricalBenchmarkCommentary(
  total: number,
  avgRateDeviationBp: number,
  avgReserveDeviationBp: number,
  avgHistoricalTrajectoryDeviation: number,
): string {
  if (total >= 95) {
    return "Reproduction historique excellente : vos décisions suivent le repère BAM et la trajectoire reste alignée sur les valeurs HCP du scénario."
  }
  if (total >= 80) {
    return `Reproduction solide : l'écart moyen au taux BAM reste contenu (${avgRateDeviationBp.toFixed(0)} pb), avec une trajectoire proche du repère historique.`
  }
  if (total >= 65) {
    return `Reproduction partielle : plusieurs décisions s'écartent du repère BAM, notamment sur le taux (${avgRateDeviationBp.toFixed(0)} pb en moyenne) ou la réserve (${avgReserveDeviationBp.toFixed(0)} pb).`
  }
  return `Reproduction faible : les choix s'éloignent nettement du repère BAM et la trajectoire macro diverge du scénario historique (${avgHistoricalTrajectoryDeviation.toFixed(2)} pt d'écart moyen).`
}

/** Generate "Rapport de Gouverneur" analysis from history */
export function generateGovernorReport(history: EconomicState[]): {
  biggestMistake: string
  bestDecision: string
  finalTrajectory: string
} {
  if (history.length < 2) {
    return {
      biggestMistake: 'Pas assez de données pour identifier une erreur.',
      bestDecision: 'Pas assez de données.',
      finalTrajectory: 'Trajectoire indéterminée.',
    }
  }

  // Find biggest inflation peak
  let maxInflation = 0
  let maxInflationQ = 0
  let minInflation = 100
  let bestAlignQ = 0
  let bestAlignDev = 100

  for (let i = 0; i < history.length; i++) {
    const s = history[i]
    if (s.inflation > maxInflation) {
      maxInflation = s.inflation
      maxInflationQ = s.quarter
    }
    if (s.inflation < minInflation) {
      minInflation = s.inflation
    }
    const dev = Math.abs(s.inflation - 2.0)
    if (dev < bestAlignDev) {
      bestAlignDev = dev
      bestAlignQ = s.quarter
    }
  }

  // Find biggest rate change (simplified — look for largest quarter-over-quarter rate change)
  let maxRateChange = 0
  let rateChangeQ = 0
  for (let i = 1; i < history.length; i++) {
    const change = Math.abs(history[i].policyRate - history[i - 1].policyRate)
    if (change > maxRateChange) {
      maxRateChange = change
      rateChangeQ = history[i].quarter
    }
  }

  const maxNpl = Math.max(...history.map(s => s.nplRatio ?? 7.0))
  
  const biggestMistake = maxNpl > 10.0
    ? `Instabilité financière : les créances en souffrance (NPL) ont atteint ${maxNpl.toFixed(1)} %, étouffant le canal du crédit.`
    : maxInflation > 4
      ? `Trimestre ${maxInflationQ + 1} : pic d'inflation à ${maxInflation.toFixed(1)} % — réponse monétaire potentiellement tardive.`
      : minInflation < 0.5
        ? `L'inflation est tombée sous 0,5 %, signe d'un resserrement excessif.`
        : `Aucune erreur majeure identifiée — la politique a été globalement cohérente.`

  const bestDecision = bestAlignDev < 0.3
    ? `Trimestre ${bestAlignQ + 1} : inflation parfaitement alignée sur la cible (${history[bestAlignQ]?.inflation.toFixed(1)} %).`
    : `Meilleur alignement au trimestre ${bestAlignQ + 1} avec une déviation de ${bestAlignDev.toFixed(1)} pt.`

  const lastStates = history.slice(-4)
  const avgLastInflation = lastStates.reduce((a, s) => a + s.inflation, 0) / lastStates.length
  const avgLastGrowth = lastStates.reduce((a, s) => a + s.gdpGrowth, 0) / lastStates.length
  const finalTrajectory = avgLastInflation < 3 && avgLastGrowth > 2
    ? `Trajectoire finale positive : inflation moyenne ${avgLastInflation.toFixed(1)} % et croissance ${avgLastGrowth.toFixed(1)} % sur les 4 derniers trimestres.`
    : avgLastInflation > 4
      ? `Trajectoire finale préoccupante : l'inflation reste élevée à ${avgLastInflation.toFixed(1)} % en fin de mandat.`
      : `Trajectoire finale mitigée : inflation ${avgLastInflation.toFixed(1)} %, croissance ${avgLastGrowth.toFixed(1)} %.`

  return { biggestMistake, bestDecision, finalTrajectory }
}

function generateCommentary(
  grade: ScoreResult['grade'],
  avgDev: number,
  avgGrowth: number,
  variance: number,
  avgCredibility: number,
): string {
  const parts: string[] = []

  if (grade === 'A') {
    parts.push('Votre mandat s\'est distingué par une maîtrise exemplaire de la stabilité des prix et une trajectoire de croissance soutenue.')
  } else if (grade === 'B') {
    parts.push('Votre politique monétaire a globalement atteint ses objectifs, avec des déviations modérées par rapport à la cible.')
  } else if (grade === 'C') {
    parts.push('Des progrès notables ont été accomplis, mais la conduite de la politique monétaire a souffert de certaines incohérences.')
  } else if (grade === 'D') {
    parts.push('La gestion du cycle a présenté des difficultés significatives, notamment dans la stabilisation de l\'inflation.')
  } else {
    parts.push('Le bilan de ce mandat révèle des déséquilibres macroéconomiques persistants qui ont entravé la croissance et la stabilité des prix.')
  }

  if (avgDev > 2) {
    parts.push(`L'inflation s'est écarté de la cible de ${avgDev.toFixed(1)} point(s) en moyenne, ce qui témoigne d'une réponse insuffisante aux pressions inflationnistes.`)
  } else if (avgDev < 0.5) {
    parts.push('L\'ancrage de l\'inflation autour de la cible de 2 % a été particulièrement efficace.')
  }

  if (avgGrowth < 2) {
    parts.push('La croissance économique est restée en deçà du potentiel sur la période considérée.')
  } else if (avgGrowth > 3.5) {
    parts.push('L\'économie a maintenu une dynamique de croissance solide tout au long du mandat.')
  }

  if (avgCredibility > 75) {
    parts.push('La crédibilité de la Banque centrale s\'est renforcée, ancrant durablement les anticipations.')
  } else if (avgCredibility < 45) {
    parts.push('La crédibilité de la banque centrale a été mise à mal, fragilisant la transmission monétaire.')
  }

  if (variance > 3) {
    parts.push('Les trajectoires de l\'inflation et de l\'output gap ont manqué de lisibilité, signe d\'une politique peu prévisible pour les agents économiques.')
  }

  return parts.slice(0, 4).join(' ')
}
