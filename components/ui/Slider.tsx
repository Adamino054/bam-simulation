'use client'

import { useRef, useCallback } from 'react'

interface SliderProps {
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  formatValue?: (value: number) => string
  label: string
  id?: string
  className?: string
}

export function Slider({
  value,
  min,
  max,
  step,
  onChange,
  formatValue,
  label,
  id,
  className = '',
}: SliderProps) {
  const trackRef = useRef<HTMLDivElement>(null)

  const getPercent = useCallback(
    (v: number) => ((v - min) / (max - min)) * 100,
    [min, max],
  )

  const handleTrackClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!trackRef.current) return
      const rect = trackRef.current.getBoundingClientRect()
      const pct = (e.clientX - rect.left) / rect.width
      const raw = min + pct * (max - min)
      const stepped = Math.round(raw / step) * step
      onChange(Math.max(min, Math.min(max, stepped)))
    },
    [min, max, step, onChange],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowUp':
          e.preventDefault()
          onChange(Math.min(max, value + step))
          break
        case 'ArrowLeft':
        case 'ArrowDown':
          e.preventDefault()
          onChange(Math.max(min, value - step))
          break
        case 'Home':
          e.preventDefault()
          onChange(min)
          break
        case 'End':
          e.preventDefault()
          onChange(max)
          break
      }
    },
    [value, min, max, step, onChange],
  )

  const percent = getPercent(value)
  const display = formatValue ? formatValue(value) : String(value)

  return (
    <div className={`w-full ${className}`}>
      <div
        ref={trackRef}
        className="relative h-1 cursor-pointer rounded-full"
        style={{ backgroundColor: 'var(--bg-hover)' }}
        onClick={handleTrackClick}
        role="none"
      >
        {/* Rail rempli */}
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${percent}%`,
            backgroundColor: 'var(--accent-primary)',
          }}
        />

        {/* Poignée */}
        <div
          role="slider"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={display}
          aria-label={label}
          id={id}
          tabIndex={0}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full cursor-grab active:cursor-grabbing focus:outline-none"
          style={{
            left: `${percent}%`,
            backgroundColor: 'var(--text-primary)',
            boxShadow: '0 0 0 3px var(--bg-base)',
          }}
          onKeyDown={handleKeyDown}
          onMouseDown={(e) => {
            e.preventDefault()
            const move = (ev: MouseEvent) => {
              if (!trackRef.current) return
              const rect = trackRef.current.getBoundingClientRect()
              const pct = (ev.clientX - rect.left) / rect.width
              const raw = min + pct * (max - min)
              const stepped = Math.round(raw / step) * step
              onChange(Math.max(min, Math.min(max, stepped)))
            }
            const up = () => {
              document.removeEventListener('mousemove', move)
              document.removeEventListener('mouseup', up)
            }
            document.addEventListener('mousemove', move)
            document.addEventListener('mouseup', up)
          }}
        />
      </div>

      {/* Ticks (min/max) */}
      <div className="flex justify-between mt-1.5">
        <span className="label-caps">{formatValue ? formatValue(min) : min}</span>
        <span className="label-caps">{formatValue ? formatValue(max) : max}</span>
      </div>
    </div>
  )
}
