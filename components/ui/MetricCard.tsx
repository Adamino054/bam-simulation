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
  invertDelta?: boolean
}

function useCountUp(to: number, duration = 800): number {
  const [displayed, setDisplayed] = useState(to)
  const prevRef = useRef(to)
  const rafRef  = useRef<number>(0)

  useEffect(() => {
    const from = prevRef.current
    prevRef.current = to
    if (from === to) return

    const start = performance.now()
    const diff  = to - from

    const tick = (now: number) => {
      const elapsed = Math.min((now - start) / duration, 1)
      const eased   = 1 - Math.pow(2, -10 * elapsed)
      setDisplayed(from + diff * eased)
      if (elapsed < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setDisplayed(to)
      }
    }

    cancelAnimationFrame(rafRef.current)
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
  invertDelta = false,
}: MetricCardProps) {
  const animatedValue = useCountUp(value)
  const cardRef = useRef<HTMLDivElement>(null)
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)
  const [flashClass, setFlashClass] = useState('')
  const prevValueRef = useRef(value)

  useEffect(() => {
    const prev = prevValueRef.current
    if (prev !== value) {
      // Delta logic: invert it for negative indicators (e.g. unemployment, NPL)
      const isPositiveChange = invertDelta ? value < prev : value > prev
      setFlashClass(isPositiveChange ? 'metric-flash-positive' : 'metric-flash-negative')
      prevValueRef.current = value

      const timer = setTimeout(() => {
        setFlashClass('')
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [value, invertDelta])

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  const isGood = delta !== undefined ? (invertDelta ? delta < 0 : delta > 0) : null
  const isBad  = delta !== undefined ? (invertDelta ? delta > 0 : delta < 0) : null

  const deltaColor =
    isGood ? 'var(--data-positive)' :
    isBad  ? 'var(--data-negative)' :
    'var(--text-tertiary)'

  const leftBorder = accentColor ?? 'var(--border-default)'

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`rounded-md overflow-hidden relative ${className}`}
      style={{
        backgroundColor: 'var(--bg-panel)',
        border: '1px solid var(--border-default)',
        borderLeft: `3px solid ${leftBorder}`,
        position: 'relative',
        transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.22s, box-shadow 0.22s',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: isHovered ? '0 10px 24px rgba(0, 0, 0, 0.25)' : 'none',
        borderColor: isHovered ? 'var(--border-strong)' : 'var(--border-default)',
      }}
    >
      {/* Subtle top gradient wash */}
      {accentColor && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '56px',
            background: `linear-gradient(180deg, ${accentColor}0E 0%, transparent 100%)`,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}

      {/* Dynamic Cursor Aura Glow */}
      {isHovered && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(100px circle at ${coords.x}px ${coords.y}px, ${accentColor ? `${accentColor}18` : 'rgba(255, 255, 255, 0.04)'}, transparent 80%)`,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}

      <div className="p-3.5 flex flex-col gap-2.5 relative">
        {/* Label row */}
        <div className="flex items-center justify-between min-h-[16px]">
          <span className="label-caps">{label}</span>
          {tooltipContent && (
            <Tooltip content={tooltipContent}>
              <span
                className="flex items-center justify-center w-[16px] h-[16px] rounded-full cursor-help select-none"
                style={{
                  border: '1px solid var(--border-strong)',
                  color: 'var(--text-secondary)',
                  fontSize: '11px',
                  fontWeight: 600,
                }}
              >
                i
              </span>
            </Tooltip>
          )}
        </div>

        {/* Value */}
        <div className="flex items-end gap-1.5">
          <span
            className={`font-editorial leading-none tabular ${flashClass}`}
            style={{
              fontSize: 'clamp(1.6rem, 2.5vw, 2rem)',
              color: accentColor ?? 'var(--text-primary)',
              fontVariantNumeric: 'tabular-nums',
              display: 'inline-block',
            }}
          >
            {animatedValue.toFixed(precision).replace('.', ',')}
          </span>
          <span className="text-sm pb-0.5" style={{ color: 'var(--text-tertiary)' }}>
            {unit}
          </span>
        </div>

        {/* Delta + sparkline */}
        <div className="flex items-center justify-between">
          <div className="min-w-[60px]">
            {delta !== undefined && delta !== 0 ? (
              <span className="text-xs font-mono tabular" style={{ color: deltaColor }}>
                {delta > 0 ? '+' : ''}{delta.toFixed(precision).replace('.', ',')} {deltaUnit}
              </span>
            ) : delta === 0 ? (
              <span className="text-xs font-mono" style={{ color: 'var(--text-tertiary)' }}>—</span>
            ) : null}
          </div>
          {history.length >= 2 && (
            <Sparkline
              data={history}
              color={accentColor ?? 'var(--text-tertiary)'}
              width={72}
              height={22}
            />
          )}
        </div>
      </div>
    </div>
  )
}
