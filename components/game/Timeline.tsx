'use client'

import { useGameStore } from '@/store/gameStore'
import { TOTAL_QUARTERS } from '@/lib/constants'
import { fmtQuarter } from '@/lib/format'

export function Timeline() {
  const { currentState, history } = useGameStore(s => ({
    currentState: s.currentState,
    history: s.history,
  }))

  const currentQ = currentState.quarter

  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* Label de trimestre */}
      <span className="label-caps" style={{ color: 'var(--accent-primary)' }}>
        {fmtQuarter(currentState.date.year, currentState.date.q)}
        {' · '}Trimestre {currentQ + 1} / {TOTAL_QUARTERS}
      </span>

      {/* Barre de dots */}
      <div className="flex items-center gap-1" role="progressbar" aria-valuenow={currentQ + 1} aria-valuemin={1} aria-valuemax={TOTAL_QUARTERS}>
        {Array.from({ length: TOTAL_QUARTERS }, (_, i) => {
          const isPast    = i < currentQ
          const isCurrent = i === currentQ
          const isFuture  = i > currentQ

          return (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width:  isCurrent ? '8px' : '5px',
                height: isCurrent ? '8px' : '5px',
                backgroundColor: isCurrent
                  ? 'var(--accent-primary)'
                  : isPast
                  ? 'var(--text-tertiary)'
                  : 'var(--border-subtle)',
                flexShrink: 0,
              }}
              aria-label={
                isCurrent
                  ? `Trimestre actuel : ${i + 1}`
                  : isPast
                  ? `Trimestre ${i + 1} — passé`
                  : `Trimestre ${i + 1} — à venir`
              }
            />
          )
        })}
      </div>
    </div>
  )
}
