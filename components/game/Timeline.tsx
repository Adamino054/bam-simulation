'use client'

import { useGameStore } from '@/store/gameStore'
import { TOTAL_QUARTERS } from '@/lib/constants'
import { fmtQuarter } from '@/lib/format'

export function Timeline() {
  const currentState = useGameStore(s => s.currentState)

  const currentQ = currentState.quarter
  const pct = Math.round(((currentQ + 1) / TOTAL_QUARTERS) * 100)

  return (
    <div className="flex flex-col items-center gap-2 w-full max-w-lg">
      {/* Label */}
      <div className="flex items-center gap-3">
        <span
          className="font-mono text-xs tabular"
          style={{ color: 'var(--accent-primary)', fontWeight: 600 }}
        >
          {fmtQuarter(currentState.date.year, currentState.date.q)}
        </span>
        <span style={{ color: 'var(--border-default)' }}>·</span>
        <span className="label-caps">
          Trimestre {currentQ + 1} / {TOTAL_QUARTERS}
        </span>
        <span style={{ color: 'var(--border-default)' }}>·</span>
        <span className="label-caps" style={{ color: 'var(--text-tertiary)' }}>
          {pct}&nbsp;% du mandat
        </span>
      </div>

      {/* Barre de 20 dots */}
      <div
        className="flex items-center gap-[3px]"
        role="progressbar"
        aria-valuenow={currentQ + 1}
        aria-valuemin={1}
        aria-valuemax={TOTAL_QUARTERS}
        aria-label={`Trimestre ${currentQ + 1} sur ${TOTAL_QUARTERS}`}
      >
        {Array.from({ length: TOTAL_QUARTERS }, (_, i) => {
          const isPast    = i < currentQ
          const isCurrent = i === currentQ

          return (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width:  isCurrent ? '10px' : '5px',
                height: isCurrent ? '6px'  : '5px',
                backgroundColor: isCurrent
                  ? 'var(--accent-primary)'
                  : isPast
                  ? 'var(--text-tertiary)'
                  : 'var(--border-default)',
                flexShrink: 0,
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
