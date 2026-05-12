'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, LayoutDashboard } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { useGameStore } from '@/store/gameStore'
import { useAuthStore } from '@/store/authStore'
import { SCENARIOS } from '@/engine/scenarios'
import { computeScore } from '@/engine/scoring'
import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'

interface HeaderProps {
  variant: 'home' | 'game' | 'debrief'
}

export function Header({ variant }: HeaderProps) {
  const router = useRouter()

  const { scenario, status, history, currentState } = useGameStore(
    useShallow(s => ({
      scenario:     s.scenario,
      status:       s.status,
      history:      s.history,
      currentState: s.currentState,
    }))
  )

  const currentUser = useAuthStore(s => s.currentUser)
  const getCurrentPlayer = useAuthStore(s => s.getCurrentPlayer)
  const logout = useAuthStore(s => s.logout)

  const player = getCurrentPlayer()
  const scenarioLabel = scenario ? SCENARIOS[scenario]?.title : null

  const partialScore = useMemo(() => {
    if (history.length < 2) return null
    return computeScore([...history, currentState]).total
  }, [history, currentState])

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <header
      className="flex items-center justify-between gap-4 px-5"
      style={{
        height: '52px',
        backgroundColor: 'var(--bg-base)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {/* ── Gauche ── */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <Link
          href={currentUser ? '/dashboard' : '/'}
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

      {/* ── Droite ── */}
      <div className="flex items-center gap-3">
        {/* Score partiel en jeu */}
        {variant === 'game' && status === 'playing' && partialScore !== null && (
          <span className="label-caps hidden sm:block" style={{ color: 'var(--text-tertiary)' }}>
            Score&nbsp;: <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>{partialScore}</span>
          </span>
        )}

        <ThemeToggle />

        {/* Pseudo + dashboard link */}
        {currentUser && player && (
          <button
            onClick={() => router.push('/dashboard')}
            className="hidden sm:flex items-center gap-1.5 label-caps transition-colors duration-200"
            style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)' }}
          >
            <LayoutDashboard size={11} />
            {player.pseudo}
          </button>
        )}

        {/* Quitter la partie */}
        {variant === 'game' && status === 'playing' && (
          <Link
            href="/dashboard"
            className="label-caps transition-colors duration-200"
            style={{ color: 'var(--text-tertiary)', textDecoration: 'none' }}
          >
            Quitter
          </Link>
        )}

        {/* Déconnexion (en dehors du jeu) */}
        {variant !== 'game' && currentUser && (
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 label-caps transition-colors duration-200"
            style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--data-negative)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)' }}
          >
            <LogOut size={11} />
            <span className="hidden sm:block">Déconnexion</span>
          </button>
        )}
      </div>
    </header>
  )
}
