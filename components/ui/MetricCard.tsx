'use client'

import { useEffect, useRef, useState } from 'react'
import { Sparkline } from './Sparkline'
import { Tooltip } from './Tooltip'
import type { ReactNode } from 'react'

interface MetricCardProps {
  label: string
  value: number
  unit?: string
  delta?: number
  deltaUnit?: string
  history?: number[]
  tooltipContent?: ReactNode
  precision?: number
  className?: string
  accentColor?: string
}

/** Anime un nombre de `from` à `to` en `duration` ms */
function useCountUp(to: number, duration = 400): number {
  const [displayed, setDisplayed] = useState(to)
  const prevRef = useRef(to)
  const rafRef  = useRef<number>(0)

  useEffect(() => {
    const from = prevRef.current
    if (from === to) return

    const start = performance.now()
    const diff  = to - from

    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // Easing out expo
      const eased = 1 - Math.pow(2, -10 * progress)
      setDisplayed(from + diff * eased)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setDisplayed(to)
        prevRef.current = to
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [to, duration])

  return displayed
}

export function MetricCard({
  label,
  value,
  unit = '%',
  delta,
  deltaUnit = 'pt',
  history = [],
  tooltipContent,
  precision = 1,
  className = '',
  accentColor,
}: MetricCardProps) {
  const animatedValue = useCountUp(value)
  const isPositiveDelta = delta !== undefined && delta > 0
  const isNegativeDelta = delta !== undefined && delta < 0

  const deltaColor = isPositiveDelta
    ? 'var(--data-positive)'
    : isNegativeDelta
    ? 'var(--data-negative)'
    : 'var(--text-tertiary)'

  const displayValue = animatedValue.toFixed(precision)
    .replace('.', ',')

  return (
    <div
      className={`rounded p-3 flex flex-col gap-1 ${className}`}
      style={{
        backgroundColor: 'var(--bg-panel)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      {/* Label */}
      <div className="flex items-center justify-between">
        <span className="label-caps">{label}</span>
        {tooltipContent && (
          <Tooltip content={tooltipContent}>
            <span
              className="w-4 h-4 rounded-full flex items-center justify-center text-xs"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                color: 'var(--text-tertiary)',
                fontSize: '10px',
              }}
            >
              i
            </span>
          </Tooltip>
        )}
      </div>

      {/* Valeur principale */}
      <div className="flex items-baseline gap-1.5">
        <span
          className="font-editorial leading-none tabular"
          style={{
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            color: accentColor ?? 'var(--text-primary)',
          }}
        >
          {displayValue}
        </span>
        <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          {unit}
        </span>
      </div>

      {/* Variation + sparkline */}
      <div className="flex items-end justify-between mt-auto">
        {delta !== undefined && (
          <span
            className="text-xs font-mono tabular"
            style={{ color: deltaColor }}
          >
            {delta > 0 ? '+' : ''}{delta.toFixed(precision).replace('.', ',')} {deltaUnit}
          </span>
        )}
        {history.length >= 2 && (
          <Sparkline
            data={history}
            color={accentColor ?? 'var(--text-secondary)'}
          />
        )}
      </div>
    </div>
  )
}
