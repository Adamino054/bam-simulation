'use client'

import Link from 'next/link'
import { ThemeToggle } from './ThemeToggle'
import { useGameStore } from '@/store/gameStore'
import { SCENARIOS } from '@/engine/scenarios'
import { computeScore } from '@/engine/scoring'
import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'

interface HeaderProps {
  variant: 'home' | 'game' | 'debrief'
}

export function Header({ variant }: HeaderProps) {
  const { scenario, status, history, currentState } = useGameStore(
    useShallow(s => ({
      scenario:     s.scenario,
      status:       s.status,
      history:      s.history,
      currentState: s.currentState,
    }))
  )

  const scenarioLabel = scenario ? SCENARIOS[scenario]?.title : null

  const partialScore = useMemo(() => {
    if (history.length < 2) return null
    return computeScore([...history, currentState]).total
  }, [history, currentState])

  return (
    <header
      className="flex items-center justify-between gap-4 px-5"
      style={{
        height: '52px',
        backgroundColor: 'var(--bg-base)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {/* Gauche */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <Link
          href="/"
          className="font-editorial text-sm tracking-tight"
          style={{ color: 'var(--text-primary)', textDecoration: 'none' }}
        >
          CBS
        </Link>
        {scenarioLabel && variant === 'game' && (
          <>
            <span style={{ color: 'var(--border-default)' }}>·</span>
            <span className="label-caps hidden sm:block">{scenarioLabel}</span>
          </>
        )}
        {variant === 'debrief' && (
          <>
            <span style={{ color: 'var(--border-default)' }}>·</span>
            <span className="label-caps">Bilan de mandat</span>
          </>
        )}
      </div>

      {/* Droite */}
      <div className="flex items-center gap-4">
        {/* Score partiel en jeu */}
        {variant === 'game' && status === 'playing' && partialScore !== null && (
          <span className="label-caps hidden sm:block" style={{ color: 'var(--text-tertiary)' }}>
            Score&nbsp;: <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>{partialScore}</span>
          </span>
        )}

        <ThemeToggle />

        {variant === 'game' && status === 'playing' && (
          <Link
            href="/"
            className="label-caps transition-colors duration-200"
            style={{ color: 'var(--text-tertiary)', textDecoration: 'none' }}
          >
            Quitter
          </Link>
        )}
      </div>
    </header>
  )
}
