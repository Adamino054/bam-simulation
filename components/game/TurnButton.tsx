'use client'

import { useGameStore } from '@/store/gameStore'
import { TOTAL_QUARTERS } from '@/lib/constants'

export function TurnButton() {
  const { advanceTurn, currentState, isTransitioning, setTransitioning } = useGameStore(s => ({
    advanceTurn:      s.advanceTurn,
    currentState:     s.currentState,
    isTransitioning:  s.isTransitioning,
    setTransitioning: s.setTransitioning,
  }))

  const isLast     = currentState.quarter >= TOTAL_QUARTERS - 1
  const isDisabled = isTransitioning

  const handleClick = async () => {
    if (isDisabled) return
    setTransitioning(true)
    // Courte pause pour l'animation (les MetricCards convergent)
    await new Promise(r => setTimeout(r, 450))
    advanceTurn()
    setTransitioning(false)
    // La redirection vers /debrief est gérée par le useEffect de play/page.tsx
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      className="w-full py-3 rounded font-medium text-sm transition-opacity duration-150"
      style={{
        backgroundColor: isDisabled ? 'var(--bg-elevated)' : 'var(--accent-primary)',
        color: isDisabled ? 'var(--text-tertiary)' : '#FFFFFF',
        border: 'none',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        letterSpacing: '0.03em',
      }}
      aria-busy={isTransitioning}
      aria-live="polite"
    >
      {isTransitioning
        ? 'Calcul en cours…'
        : isLast
        ? 'Terminer la partie'
        : 'Trimestre suivant →'}
    </button>
  )
}
