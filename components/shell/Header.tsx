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

  const { scenario, status, history, currentState, actionHistory, difficultyLevel } = useGameStore(
    useShallow(s => ({
      scenario:     s.scenario,
      status:       s.status,
      history:      s.history,
      currentState: s.currentState,
      actionHistory: s.actionHistory,
      difficultyLevel: s.difficultyLevel,
    }))
  )

  const currentUser = useAuthStore(s => s.currentUser)
  const getCurrentPlayer = useAuthStore(s => s.getCurrentPlayer)
  const logout = useAuthStore(s => s.logout)

  const player = getCurrentPlayer()
  const scenarioLabel = scenario ? SCENARIOS[scenario]?.title : null

  const partialScore = useMemo(() => {
    if (history.length < 2) return null
    return computeScore([...history, currentState], difficultyLevel, { scenario, actionHistory }).total
  }, [history, currentState, difficultyLevel, scenario, actionHistory])

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

        {/* Governor Profile Capsule */}
        {currentUser && player && (
          <button
            onClick={() => router.push('/dashboard')}
            className="profile-capsule flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-mono transition-all duration-200"
            style={{
              cursor: 'pointer',
              border: '1px solid var(--border-default)',
            }}
          >
            {/* Avatar Circle */}
            <div
              className="flex items-center justify-center w-5 h-5 rounded-full font-editorial text-xs font-bold"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: '#fff',
              }}
            >
              {player.pseudo.slice(0, 2).toUpperCase()}
            </div>

            {/* Username & Level */}
            <div className="flex flex-col items-start text-left leading-none">
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                Gouv. {player.pseudo}
              </span>
              <span className="flex items-center gap-1" style={{ fontSize: '9px', color: 'var(--text-tertiary)' }}>
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse-soft"
                  style={{
                    backgroundColor:
                      difficultyLevel === 'beginner'
                        ? '#4A9D7C'
                        : difficultyLevel === 'intermediate'
                        ? '#C9A86A'
                        : '#E05A47',
                    boxShadow: `0 0 4px ${
                      difficultyLevel === 'beginner'
                        ? '#4A9D7C'
                        : difficultyLevel === 'intermediate'
                        ? '#C9A86A'
                        : '#E05A47'
                    }`,
                  }}
                />
                {difficultyLevel === 'beginner'
                  ? 'Débutant'
                  : difficultyLevel === 'intermediate'
                  ? 'Intermédiaire'
                  : 'Expert'}
              </span>
            </div>
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
