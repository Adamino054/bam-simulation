'use client'

import { useShallow } from 'zustand/react/shallow'
import { Loader2 } from 'lucide-react'
import { useGameStore } from '@/store/gameStore'
import { TOTAL_QUARTERS, FREE_MODE_QUARTERS } from '@/lib/constants'

export function TurnButton() {
  const { advanceTurn, currentState, isTransitioning, setTransitioning, freeMode } = useGameStore(
    useShallow(s => ({
      advanceTurn:      s.advanceTurn,
      currentState:     s.currentState,
      isTransitioning:  s.isTransitioning,
      setTransitioning: s.setTransitioning,
      freeMode:         s.freeMode,
    }))
  )

  const maxQuarters = freeMode ? FREE_MODE_QUARTERS : TOTAL_QUARTERS
  const isLast     = currentState.quarter >= maxQuarters - 1
  const isDisabled = isTransitioning

  const handleClick = async () => {
    if (isDisabled) return
    setTransitioning(true)
    // Courte pause pour l'animation (les MetricCards convergent)
    await new Promise(r => setTimeout(r, 600))
    try {
      advanceTurn()
    } catch (err) {
      console.error('Erreur lors du calcul du tour :', err)
    } finally {
      setTransitioning(false)
    }
    // La redirection vers /debrief est gérée par le useEffect de play/page.tsx
  }

  return (
    <button
      id="turn-button-container"
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      className="w-full py-3 rounded-md font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2"
      style={{
        background: isDisabled
          ? 'var(--bg-elevated)'
          : isLast
            ? 'linear-gradient(135deg, #C9A86A 0%, #A68A4F 100%)'
            : 'linear-gradient(135deg, #C41923 0%, #8B131B 100%)',
        color: isDisabled ? 'var(--text-tertiary)' : '#fff',
        border: 'none',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        letterSpacing: '0.04em',
        boxShadow: isDisabled
          ? 'none'
          : isLast
            ? '0 1px 3px rgba(0,0,0,0.2), 0 4px 16px rgba(201,168,106,0.3)'
            : '0 1px 3px rgba(0,0,0,0.2), 0 4px 16px rgba(180,25,35,0.3)',
        opacity: isDisabled ? 0.6 : 1,
      }}
      onMouseEnter={e => {
        if (!isDisabled) {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
          (e.currentTarget as HTMLElement).style.boxShadow = isLast
            ? '0 1px 3px rgba(0,0,0,0.2), 0 8px 24px rgba(201,168,106,0.4)'
            : '0 1px 3px rgba(0,0,0,0.2), 0 8px 24px rgba(180,25,35,0.4)'
        }
      }}
      onMouseLeave={e => {
        if (!isDisabled) {
          (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
          (e.currentTarget as HTMLElement).style.boxShadow = isLast
            ? '0 1px 3px rgba(0,0,0,0.2), 0 4px 16px rgba(201,168,106,0.3)'
            : '0 1px 3px rgba(0,0,0,0.2), 0 4px 16px rgba(180,25,35,0.3)'
        }
      }}
      aria-busy={isTransitioning}
      aria-live="polite"
    >
      {isTransitioning ? (
        <>
          <Loader2 size={14} className="animate-spin" />
          Calcul en cours…
        </>
      ) : isLast ? (
        'Terminer la partie →'
      ) : (
        'Trimestre suivant →'
      )}
    </button>
  )
}
