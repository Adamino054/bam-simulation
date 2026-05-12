'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Trophy, TrendingUp, Target, BarChart3, LogOut,
  Clock, Star, ChevronRight, Flame, Award,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useGameStore } from '@/store/gameStore'
import { SCENARIOS } from '@/engine/scenarios'
import { ThemeToggle } from '@/components/shell/ThemeToggle'
import { fmtPct } from '@/lib/format'
import type { ScenarioId } from '@/engine/state'

const DIFFICULTY_META: Record<string, { label: string; color: string; bg: string }> = {
  normal: { label: 'Standard',  color: '#4A9D7C', bg: 'rgba(74, 157, 124, 0.12)' },
  hard:   { label: 'Difficile', color: '#C9A86A', bg: 'rgba(201, 168, 106, 0.12)' },
  crisis: { label: 'Crise',     color: '#C25450', bg: 'rgba(194, 84, 80, 0.12)' },
}

const GRADE_COLORS: Record<string, string> = {
  A: '#4A9D7C', B: '#5C7E92', C: '#C9A86A', D: '#C9A86A', F: '#C25450',
}

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
}

export default function DashboardPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [selected, setSelected] = useState<ScenarioId>('standard')

  const currentUser = useAuthStore(s => s.currentUser)
  const getCurrentPlayer = useAuthStore(s => s.getCurrentPlayer)
  const getPlayerStats = useAuthStore(s => s.getPlayerStats)
  const logout = useAuthStore(s => s.logout)
  const startGame = useGameStore(s => s.startGame)
  const freeMode = useGameStore(s => s.freeMode)
  const setFreeMode = useGameStore(s => s.setFreeMode)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (mounted && !currentUser) {
      router.push('/login')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, currentUser])

  const player = useMemo(() => mounted ? getCurrentPlayer() : null, [mounted, getCurrentPlayer])
  const stats = useMemo(() => mounted ? getPlayerStats() : null, [mounted, getPlayerStats])

  if (!mounted || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-base)' }}>
        <p className="label-caps" style={{ color: 'var(--text-tertiary)' }}>Chargement…</p>
      </div>
    )
  }

  const handleStart = () => {
    startGame(selected)
    router.push('/play')
  }

  const scenarios = Object.values(SCENARIOS)
  const selectedMeta = DIFFICULTY_META[SCENARIOS[selected].difficulty]
  const gameHistory = player?.gameHistory ?? []

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-base)' }}>

      {/* ══════ NAV ══════ */}
      <nav
        className="flex items-center justify-between px-6"
        style={{ height: '52px', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-base)' }}
      >
        <div className="flex items-center gap-3">
          <a href="/" className="font-editorial text-sm" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>CBS</a>
          <span style={{ color: 'var(--border-default)' }}>·</span>
          <span className="label-caps" style={{ color: 'var(--text-tertiary)' }}>Tableau de bord</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            {player?.pseudo}
          </span>
          <ThemeToggle />
          <button
            onClick={() => { logout(); router.push('/') }}
            className="flex items-center gap-1.5 label-caps transition-colors"
            style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <LogOut size={12} />
            Déconnexion
          </button>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-6xl mx-auto px-6 py-8">

        {/* ══════ WELCOME ══════ */}
        <motion.div className="mb-10" {...fadeUp}>
          <h1 className="font-editorial text-3xl sm:text-4xl mb-2" style={{ color: 'var(--text-primary)' }}>
            Bonjour, {player?.pseudo} 👋
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            {stats
              ? `${stats.totalGames} partie${stats.totalGames > 1 ? 's' : ''} jouée${stats.totalGames > 1 ? 's' : ''} · Score moyen : ${stats.avgScore}/100`
              : "Bienvenue ! Lancez votre première simulation pour commencer."}
          </p>
        </motion.div>

        {/* ══════ STATS CARDS ══════ */}
        {stats && (
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-10"
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.1 }}
          >
            {[
              { icon: Trophy, label: 'Parties jouées', value: String(stats.totalGames), color: 'var(--accent-primary)' },
              { icon: Target, label: 'Score moyen', value: String(stats.avgScore), color: 'var(--accent-cool)' },
              { icon: Star, label: 'Meilleur score', value: String(stats.bestScore), color: 'var(--accent-warm)' },
              { icon: Award, label: 'Meilleur grade', value: stats.bestGrade, color: GRADE_COLORS[stats.bestGrade] ?? 'var(--text-primary)' },
              { icon: TrendingUp, label: 'Taux de réussite', value: `${stats.winRate} %`, color: 'var(--data-positive)' },
              { icon: BarChart3, label: 'Scénario favori', value: stats.favoriteScenario.length > 12 ? stats.favoriteScenario.slice(0, 12) + '…' : stats.favoriteScenario, color: 'var(--text-secondary)' },
            ].map((card, i) => {
              const Icon = card.icon
              return (
                <div
                  key={card.label}
                  className="rounded-lg p-4"
                  style={{
                    backgroundColor: 'var(--bg-panel)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={12} style={{ color: card.color }} />
                    <span className="label-caps" style={{ fontSize: '8px' }}>{card.label}</span>
                  </div>
                  <span className="font-editorial-roman text-xl block" style={{ color: card.color }}>
                    {card.value}
                  </span>
                </div>
              )
            })}
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ══════ LEFT: SCENARIO PICKER ══════ */}
          <motion.div
            className="lg:col-span-2"
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.15 }}
          >
            <h2 className="label-caps mb-4" style={{ color: 'var(--accent-primary)' }}>Nouvelle partie</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {scenarios.map(sc => {
                const isSelected = sc.id === selected
                const meta = DIFFICULTY_META[sc.difficulty]
                return (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => setSelected(sc.id)}
                    className="relative text-left rounded-lg p-5 transition-all duration-200"
                    style={{
                      backgroundColor: isSelected ? 'var(--bg-elevated)' : 'var(--bg-panel)',
                      border: `1px solid ${isSelected ? meta.color + '55' : 'var(--border-default)'}`,
                      boxShadow: isSelected ? `0 0 0 1px ${meta.color}22, 0 6px 24px rgba(0,0,0,0.2)` : 'none',
                      transform: isSelected ? 'translateY(-2px)' : 'translateY(0)',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => { if (!isSelected) { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-elevated)' } }}
                    onMouseLeave={e => { if (!isSelected) { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-panel)' } }}
                  >
                    <span
                      className="inline-flex items-center gap-1.5 mb-3 px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: meta.bg, color: meta.color,
                        fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                      }}
                    >
                      <span style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: meta.color, display: 'inline-block' }} />
                      {meta.label}
                    </span>
                    <span className="block font-medium mb-1" style={{ color: 'var(--text-primary)', fontSize: '13px' }}>
                      {sc.title}
                    </span>
                    <span className="block text-xs mb-2" style={{ color: 'var(--text-tertiary)' }}>
                      {sc.subtitle}
                    </span>
                    {sc.keyKpi && (
                      <span className="block font-mono text-[10px] font-semibold tabular" style={{ color: meta.color }}>
                        {sc.keyKpi}
                      </span>
                    )}
                    {isSelected && (
                      <span className="absolute top-3 right-3 flex items-center justify-center w-[18px] h-[18px] rounded-full" style={{ backgroundColor: meta.color }}>
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Scenario description */}
            <div
              className="rounded-md px-4 py-3 mb-4 text-sm leading-relaxed"
              style={{
                backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-subtle)',
                borderLeft: `3px solid ${selectedMeta.color}`, color: 'var(--text-secondary)', fontStyle: 'italic',
              }}
            >
              {SCENARIOS[selected].description}
            </div>

            {/* Mode Libre */}
            <div
              className="flex items-center justify-between mb-4 px-4 py-2.5 rounded-md"
              style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-subtle)' }}
            >
              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>Mode Libre</p>
                <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>25 trimestres · +50 % de probabilité de chocs</p>
              </div>
              <button
                type="button"
                onClick={() => setFreeMode(!freeMode)}
                className="relative w-9 h-5 rounded-full transition-colors duration-200"
                style={{ backgroundColor: freeMode ? 'var(--accent-primary)' : 'var(--bg-hover)' }}
                role="switch"
                aria-checked={freeMode}
              >
                <span
                  className="absolute top-0.5 w-4 h-4 rounded-full transition-transform duration-200"
                  style={{
                    backgroundColor: '#fff', left: '2px',
                    transform: freeMode ? 'translateX(16px)' : 'translateX(0)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }}
                />
              </button>
            </div>

            {/* CTA */}
            <button
              onClick={handleStart}
              className="w-full py-4 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, #C41923 0%, #8B131B 100%)',
                color: '#fff', border: 'none', cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2), 0 4px 20px rgba(180,25,35,0.3)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.2), 0 8px 32px rgba(180,25,35,0.45)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.2), 0 4px 20px rgba(180,25,35,0.3)'
              }}
            >
              Commencer la partie
              <ChevronRight size={16} />
            </button>
          </motion.div>

          {/* ══════ RIGHT: GAME HISTORY ══════ */}
          <motion.div
            className="lg:col-span-1"
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.2 }}
          >
            <h2 className="label-caps mb-4" style={{ color: 'var(--accent-warm)' }}>Historique des parties</h2>

            {gameHistory.length === 0 ? (
              <div
                className="rounded-lg p-8 text-center"
                style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-subtle)' }}
              >
                <Trophy size={32} style={{ color: 'var(--text-tertiary)', margin: '0 auto 12px' }} />
                <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>Aucune partie jouée</p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Lancez votre première simulation !</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                {gameHistory.map((game, i) => {
                  const gradeColor = GRADE_COLORS[game.grade] ?? 'var(--text-primary)'
                  const date = new Date(game.date)
                  const dateStr = date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
                  const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

                  return (
                    <motion.div
                      key={game.id}
                      className="rounded-lg p-4 transition-colors"
                      style={{
                        backgroundColor: 'var(--bg-panel)',
                        border: '1px solid var(--border-subtle)',
                      }}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05, duration: 0.3 }}
                    >
                      {/* Header: grade + score */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="font-editorial text-lg"
                            style={{ color: gradeColor, lineHeight: 1 }}
                          >
                            {game.grade}
                          </span>
                          <span className="font-mono text-sm font-semibold tabular" style={{ color: 'var(--text-primary)' }}>
                            {game.score}/100
                          </span>
                          {game.score >= 85 && <Star size={10} style={{ color: '#C9A86A' }} />}
                        </div>
                        {game.freeMode && (
                          <span className="label-caps px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(201,168,106,0.12)', color: 'var(--accent-warm)', fontSize: '7px' }}>
                            LIBRE
                          </span>
                        )}
                      </div>

                      {/* Scenario + date */}
                      <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--text-secondary)' }}>
                        {game.scenarioTitle}
                      </p>
                      <div className="flex items-center gap-1.5 mb-3">
                        <Clock size={9} style={{ color: 'var(--text-tertiary)' }} />
                        <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                          {dateStr} à {timeStr} · {game.quarters}T
                        </span>
                      </div>

                      {/* Mini stats */}
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: 'Infl. moy.', value: fmtPct(game.avgInflation) },
                          { label: 'Croiss. moy.', value: fmtPct(game.avgGrowth) },
                          { label: 'Créd. moy.', value: Math.round(game.avgCredibility).toString() },
                        ].map(stat => (
                          <div key={stat.label}>
                            <span className="label-caps block" style={{ fontSize: '7px' }}>{stat.label}</span>
                            <span className="font-mono text-xs tabular" style={{ color: 'var(--text-primary)' }}>{stat.value}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </motion.div>

        </div>
      </main>
    </div>
  )
}
