/**
 * Calcul du score de fin de partie.
 *
 * — Inflation (40 pts) : déviation absolue moyenne à la cible 2 %
 * — Croissance (30 pts) : croissance PIB moyenne
 * — Stabilité (30 pts) : faible variance de l'inflation et de l'output gap
 */

import type { EconomicState } from './state'
import { SCORE_THRESHOLDS } from '../lib/constants'

export interface ScoreResult {
  total: number
  inflation: number  // sur 40
  growth: number     // sur 30
  stability: number  // sur 30
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  commentary: string
  details: {
    avgInflationDeviation: number
    avgGdpGrowth: number
    inflationVariance: number
    outputGapVariance: number
  }
}

const INFLATION_TARGET = 2.0

export function computeScore(history: EconomicState[]): ScoreResult {
  if (history.length === 0) {
    return {
      total: 0, inflation: 0, growth: 0, stability: 0,
      grade: 'F', commentary: 'Aucune donnée disponible.',
      details: { avgInflationDeviation: 0, avgGdpGrowth: 0, inflationVariance: 0, outputGapVariance: 0 },
    }
  }

  const n = history.length

  // ── Score inflation (40 pts) ────────────────────────────────────
  const deviations = history.map(s => Math.abs(s.inflation - INFLATION_TARGET))
  const avgDeviation = deviations.reduce((a, b) => a + b, 0) / n
  // 0 déviation → 40 pts ; déviation ≥ 4 pts → 0 pt (interpolation linéaire)
  const inflationScore = Math.max(0, 40 * (1 - avgDeviation / 4))

  // ── Score croissance (30 pts) ───────────────────────────────────
  const growthValues = history.map(s => s.gdpGrowth)
  const avgGrowth = growthValues.reduce((a, b) => a + b, 0) / n
  // 4 %+ → 30 pts ; 1 % → 0 pt (interpolation linéaire)
  const growthScore = Math.max(0, Math.min(30, 30 * (avgGrowth - 1) / 3))

  // ── Score stabilité (30 pts) ────────────────────────────────────
  const inflMean = history.map(s => s.inflation).reduce((a, b) => a + b, 0) / n
  const inflVariance = history.map(s => (s.inflation - inflMean) ** 2).reduce((a, b) => a + b, 0) / n
  const gapMean = history.map(s => s.outputGap).reduce((a, b) => a + b, 0) / n
  const gapVariance = history.map(s => (s.outputGap - gapMean) ** 2).reduce((a, b) => a + b, 0) / n

  const combinedVariance = inflVariance + 0.5 * gapVariance
  // Variance ≤ 0.5 → 30 pts ; variance ≥ 5 → 0 pt
  const stabilityScore = Math.max(0, 30 * (1 - combinedVariance / 5))

  // ── Total et grade ───────────────────────────────────────────────
  const total = Math.round(inflationScore + growthScore + stabilityScore)
  let grade: ScoreResult['grade'] = 'F'
  if (total >= SCORE_THRESHOLDS.A) grade = 'A'
  else if (total >= SCORE_THRESHOLDS.B) grade = 'B'
  else if (total >= SCORE_THRESHOLDS.C) grade = 'C'
  else if (total >= SCORE_THRESHOLDS.D) grade = 'D'

  // ── Commentaire généré ───────────────────────────────────────────
  const commentary = generateCommentary(grade, avgDeviation, avgGrowth, combinedVariance)

  return {
    total,
    inflation: Math.round(inflationScore),
    growth: Math.round(growthScore),
    stability: Math.round(stabilityScore),
    grade,
    commentary,
    details: {
      avgInflationDeviation: avgDeviation,
      avgGdpGrowth: avgGrowth,
      inflationVariance: inflVariance,
      outputGapVariance: gapVariance,
    },
  }
}

function generateCommentary(
  grade: ScoreResult['grade'],
  avgDev: number,
  avgGrowth: number,
  variance: number,
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

  if (variance > 3) {
    parts.push('Les trajectoires de l\'inflation et de l\'output gap ont manqué de lisibilité, signe d\'une politique peu prévisible pour les agents économiques.')
  }

  return parts.slice(0, 4).join(' ')
}
