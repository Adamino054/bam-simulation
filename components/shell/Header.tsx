'use client'

import Link from 'next/link'
import { ThemeToggle } from './ThemeToggle'
import { useGameStore } from '@/store/gameStore'
import { SCENARIOS } from '@/engine/scenarios'

interface HeaderProps {
  variant: 'home' | 'game' | 'debrief'
}

export function Header({ variant }: HeaderProps) {
  const { scenario, status } = useGameStore(s => ({
    scenario: s.scenario,
    status: s.status,
  }))

  const scenarioLabel = scenario ? SCENARIOS[scenario]?.title : null

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between gap-4 px-4"
      style={{
        height: '56px',
        backgroundColor: 'var(--bg-base)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {/* Gauche : wordmark */}
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
            <span className="label-caps">{scenarioLabel}</span>
          </>
        )}
      </div>

      {/* Droite */}
      <div className="flex items-center gap-3">
        <ThemeToggle />
        {variant === 'game' && status === 'playing' && (
          <Link
            href="/"
            className="label-caps transition-colors duration-200"
            style={{ color: 'var(--text-tertiary)', textDecoration: 'none' }}
            onClick={() => {
              if (!confirm('Abandonner la partie en cours ?')) return
            }}
          >
            Abandonner
          </Link>
        )}
      </div>
    </header>
  )
}
