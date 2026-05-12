/**
 * Types et utilitaires de base pour les chocs macroéconomiques.
 * Chaque type de choc est défini dans son propre fichier.
 */

import type { Shock } from '../state'

export interface ShockDefinition {
  id: string
  label: string
  type: Shock['type']
  description: string
  /** Probabilité d'occurrence par trimestre (0-1) */
  probability: number
  /** Durée en trimestres [min, max] */
  durationRange: [number, number]
  /** Magnitude [min, max] sur [0, 1] */
  magnitudeRange: [number, number]
  /** Calcule les effets quantitatifs depuis la magnitude */
  computeEffects: (magnitude: number) => {
    inflationImpact: number
    outputGapImpact: number
    lendingRateImpact: number
    externalDemandImpact: number
    currentAccountImpact?: number
  }
}

/** Générateur pseudo-aléatoire déterministe (LCG simple) */
export function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

/** Interpole une valeur dans [min, max] à partir d'un nombre [0, 1] */
export function lerp(min: number, max: number, t: number): number {
  return min + (max - min) * t
}

/** Instancie un Shock à partir d'une définition et d'un tirage aléatoire */
export function instantiateShock(
  def: ShockDefinition,
  rand: () => number,
  quarterSuffix: number
): Shock {
  const magnitude = lerp(def.magnitudeRange[0], def.magnitudeRange[1], rand())
  const duration = Math.round(
    lerp(def.durationRange[0], def.durationRange[1], rand())
  )
  const effects = def.computeEffects(magnitude)

  return {
    id: `${def.id}_q${quarterSuffix}`,
    label: def.label,
    type: def.type,
    magnitude,
    remainingQuarters: duration,
    description: def.description,
    inflationImpact: effects.inflationImpact,
    outputGapImpact: effects.outputGapImpact,
    lendingRateImpact: effects.lendingRateImpact,
    externalDemandImpact: effects.externalDemandImpact,
    currentAccountImpact: effects.currentAccountImpact,
  }
}
