/**
 * Calcul du score de fin de partie.
 *
 * — Inflation (35 pts) : déviation absolue moyenne à la cible 2 %
 * — Croissance (25 pts) : croissance PIB moyenne
 * — Stabilité (20 pts) : faible variance de l'inflation et de l'output gap
 * — Crédibilité (20 pts) : crédibilité moyenne de BAM sur le mandat
 */

import type { EconomicState } from './state'
import { SCORE_THRESHOLDS } from '../lib/constants'

export interface ScoreResult {
  total: number
  inflation: number    // sur 35
  growth: number       // sur 25
  stability: number    // sur 20
  credibility: number  // sur 20
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  commentary: string
  details: {
    avgInflationDeviation: number
    avgGdpGrowth: number
    inflationVariance: number
    outputGapVariance: number
    avgCredibility: number
    avgNplRatio: number
  }
}

const INFLATION_TARGET = 2.0

export function computeScore(history: EconomicState[]): ScoreResult {
  if (history.length === 0) {
    return {
      total: 0, inflation: 0, growth: 0, stability: 0, credibility: 0,
      grade: 'F', commentary: 'Aucune donnée disponible.',
      details: { avgInflationDeviation: 0, avgGdpGrowth: 0, inflationVariance: 0, outputGapVariance: 0, avgCredibility: 70, avgNplRatio: 7.0 },
    }
  }

  const n = history.length

  // ── Score inflation (35 pts) ────────────────────────────────────
  const deviations = history.map(s => Math.abs(s.inflation - INFLATION_TARGET))
  const avgDeviation = deviations.reduce((a, b) => a + b, 0) / n
  // 0 déviation → 35 pts ; déviation ≥ 4 pts → 0 pt (interpolation linéaire)
  const inflationScore = Math.max(0, 35 * (1 - avgDeviation / 4))

  // ── Score croissance (25 pts) ───────────────────────────────────
  const growthValues = history.map(s => s.gdpGrowth)
  const avgGrowth = growthValues.reduce((a, b) => a + b, 0) / n
  // 4 %+ → 25 pts ; 1 % → 0 pt (interpolation linéaire)
  const growthScore = Math.max(0, Math.min(25, 25 * (avgGrowth - 1) / 3))

  // ── Score stabilité (20 pts) ────────────────────────────────────
  const inflMean = history.map(s => s.inflation).reduce((a, b) => a + b, 0) / n
  const inflVariance = history.map(s => (s.inflation - inflMean) ** 2).reduce((a, b) => a + b, 0) / n
  const gapMean = history.map(s => s.outputGap).reduce((a, b) => a + b, 0) / n
  const gapVariance = history.map(s => (s.outputGap - gapMean) ** 2).reduce((a, b) => a + b, 0) / n
  const avgNplRatio = history.map(s => s.nplRatio ?? 7.0).reduce((a, b) => a + b, 0) / n

  const combinedVariance = inflVariance + 0.5 * gapVariance
  // Variance ≤ 0.5 → base 20 pts ; variance ≥ 5 → 0 pt
  let stabilityScore = Math.max(0, 20 * (1 - combinedVariance / 5))
  // Pénalité macroprudentielle (NPL élevés)
  if (avgNplRatio > 7.5) {
    stabilityScore = Math.max(0, stabilityScore - (avgNplRatio - 7.5) * 2) // -2 pts par point de NPL au-dessus de 7.5%
  }

  // ── Score crédibilité (20 pts) ──────────────────────────────────
  const credibilityValues = history.map(s => s.centralBankCredibility ?? 70)
  const avgCredibility = credibilityValues.reduce((a, b) => a + b, 0) / n
  // 80+ → 20 pts ; 30 → 0 pt (interpolation linéaire)
  const credibilityScore = Math.max(0, Math.min(20, 20 * (avgCredibility - 30) / 50))

  // ── Total et grade ───────────────────────────────────────────────
  const total = Math.round(inflationScore + growthScore + stabilityScore + credibilityScore)
  let grade: ScoreResult['grade'] = 'F'
  if (total >= SCORE_THRESHOLDS.A) grade = 'A'
  else if (total >= SCORE_THRESHOLDS.B) grade = 'B'
  else if (total >= SCORE_THRESHOLDS.C) grade = 'C'
  else if (total >= SCORE_THRESHOLDS.D) grade = 'D'

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
