'use client'

import { useGameStore } from '@/store/gameStore'
import { TOTAL_QUARTERS } from '@/lib/constants'

interface TurnButtonProps {
  onAdvance?: () => void
}

export function TurnButton({ onAdvance }: TurnButtonProps) {
  const { advanceTurn, currentState, isTransitioning, setTransitioning } = useGameStore(s => ({
    advanceTurn: s.advanceTurn,
    currentState: s.currentState,
    isTransitioning: s.isTransitioning,
    setTransitioning: s.setTransitioning,
  }))

  const isLast     = currentState.quarter >= TOTAL_QUARTERS - 1
  const isDisabled = isTransitioning

  const handleClick = async () => {
    if (isDisabled) return
    setTransitioning(true)
    onAdvance?.()
    // Courte pause pour l'animation
    await new Promise(r => setTimeout(r, 600))
    advanceTurn()
    setTransitioning(false)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      className="w-full py-3 px-4 rounded font-medium text-sm transition-all duration-200 relative overflow-hidden"
      style={{
        backgroundColor: isDisabled ? 'var(--bg-elevated)' : 'var(--accent-primary)',
        color: isDisabled ? 'var(--text-tertiary)' : '#fff',
        border: 'none',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        letterSpacing: '0.02em',
      }}
      aria-live="polite"
      aria-busy={isTransitioning}
    >
      {isTransitioning ? (
        <span>Calcul en cours…</span>
      ) : isLast ? (
        <span>Terminer la partie</span>
      ) : (
        <span>Trimestre suivant →</span>
      )}
    </button>
  )
}
