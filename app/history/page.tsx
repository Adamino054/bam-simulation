'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Trophy, Star, Clock, Target, TrendingUp,
  Award, BarChart3, Filter, ChevronDown, Flame,
  CheckCircle, XCircle, GraduationCap,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { ThemeToggle } from '@/components/shell/ThemeToggle'
import { fmtPct } from '@/lib/format'
import type { GameRecord } from '@/store/authStore'

const ScoreProgressChart = dynamic(
  () => import('@/components/ui/ScoreProgressChart').then(m => ({ default: m.ScoreProgressChart })),
  { ssr: false, loading: () => <div style={{ height: '180px' }} /> },
)

// ── Constants ────────────────────────────────────────────────────────────────
const GRADE_COLORS: Record<string, string> = {
  A: '#4A9D7C', B: '#5C7E92', C: '#C9A86A', D: '#E8914A', F: '#C25450',
}

const SCENARIO_FILTERS = [
  { id: 'all',          label: 'Toutes' },
  { id: 'standard',     label: 'Standard' },
  { id: 'inflation2022',label: 'Inflation' },
  { id: 'covid2020',    label: 'COVID' },
  { id: 'flexibilite',  label: 'Dirham' },
]

type SortKey = 'date' | 'score_desc' | 'score_asc'
const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: 'date',       label: 'Plus récent' },
  { id: 'score_desc', label: 'Meilleur score' },
  { id: 'score_asc',  label: 'Moins bon score' },
]

// ── Helpers ──────────────────────────────────────────────────────────────────
function gradeLabel(grade: string) {
  return { A: 'Excellent', B: 'Bien', C: 'Moyen', D: 'Insuffisant', F: 'Échec' }[grade] ?? grade
}

function ScoreBadge({ score, grade }: { score: number; grade: string }) {
  const color = GRADE_COLORS[grade] ?? 'var(--text-primary)'
  return (
    <div className="flex items-center gap-2">
      <span className="font-editorial" style={{ fontSize: '2.2rem', color, lineHeight: 1 }}>{grade}</span>
      <div>
        <span className="font-mono font-semibold block" style={{ color, fontSize: '15px' }}>{score}<span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>/100</span></span>
        <span className="label-caps" style={{ color: 'var(--text-tertiary)', fontSize: '8px' }}>{gradeLabel(grade)}</span>
      </div>
    </div>
  )
}

function StatBar({ label, value, max = 100, color }: { label: string; value: number; max?: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <span className="label-caps" style={{ fontSize: '8px', color: 'var(--text-tertiary)' }}>{label}</span>
        <span className="font-mono text-xs" style={{ color }}>{typeof value === 'number' ? value.toFixed(1) : value}</span>
      </div>
      <div className="h-1 rounded-full" style={{ backgroundColor: 'var(--bg-hover)' }}>
        <motion.div
          className="h-1 rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  )
}

function GameCard({ game, index }: { game: GameRecord; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const gradeColor = GRADE_COLORS[game.grade] ?? 'var(--text-primary)'
  const isWin = game.grade === 'A' || game.grade === 'B'
  const date = new Date(game.date)
  const dateStr = date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  const inflationColor =
    Math.abs(game.avgInflation - 2) <= 0.5 ? '#4A9D7C' :
    Math.abs(game.avgInflation - 2) <= 1.5 ? '#C9A86A' : '#C25450'
  const growthColor =
    game.avgGrowth >= 3 ? '#4A9D7C' :
    game.avgGrowth >= 1.5 ? '#C9A86A' : '#C25450'
  const credColor =
    game.avgCredibility >= 70 ? '#4A9D7C' :
    game.avgCredibility >= 50 ? '#C9A86A' : '#C25450'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-lg overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-panel)',
        border: `1px solid ${isWin ? gradeColor + '33' : 'var(--border-default)'}`,
      }}
    >
      {/* Top bar */}
      {isWin && (
        <div style={{ height: '2px', background: `linear-gradient(90deg, ${gradeColor}, ${gradeColor}44)` }} />
      )}

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <ScoreBadge score={game.score} grade={game.grade} />

          <div className="flex flex-col items-end gap-1.5">
            {game.freeMode && (
              <span className="label-caps px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(201,168,106,0.12)', color: 'var(--accent-warm)', fontSize: '7px' }}>
                MODE LIBRE
              </span>
            )}
            <div className="flex items-center gap-1">
              {isWin ? (
                <CheckCircle size={10} style={{ color: '#4A9D7C' }} />
              ) : (
                <XCircle size={10} style={{ color: '#C25450' }} />
              )}
              <span className="label-caps" style={{ fontSize: '8px', color: isWin ? '#4A9D7C' : '#C25450' }}>
                {isWin ? 'Réussi' : 'Échec'}
              </span>
            </div>
            {game.score >= 90 && <Star size={11} style={{ color: '#C9A86A' }} />}
          </div>
        </div>

        {/* Scenario + date */}
        <div className="mb-4">
          <p className="font-medium text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
            {game.scenarioTitle ?? game.scenario}
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1">
              <Clock size={9} style={{ color: 'var(--text-tertiary)' }} />
              <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>
                {dateStr} · {timeStr}
              </span>
            </div>
            <span className="font-mono text-xs" style={{ color: 'var(--text-tertiary)' }}>
              {game.quarters}T joués
            </span>
          </div>
        </div>

        {/* Mini stats bars */}
        <div className="flex flex-col gap-2 mb-3">
          <StatBar label={`Inflation moy. (cible 2,0 %)`} value={game.avgInflation} max={10} color={inflationColor} />
          <StatBar label="Croissance moy." value={game.avgGrowth} max={8}  color={growthColor} />
          <StatBar label="Crédibilité moy." value={game.avgCredibility} max={100} color={credColor} />
        </div>

        {/* Expand button */}
        <button
          type="button"
          onClick={() => setExpanded(e => !e)}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded text-xs transition-colors"
          style={{ background: 'none', border: '1px solid var(--border-subtle)', cursor: 'pointer', color: 'var(--text-tertiary)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--bg-elevated)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
        >
          {expanded ? 'Moins de détails' : 'Plus de détails'}
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={12} />
          </motion.div>
        </button>

        {/* Expanded detail */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              key="detail"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              style={{ overflow: 'hidden' }}
            >
              <div className="pt-3 mt-3 grid grid-cols-3 gap-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                {[
                  { label: 'Score', value: `${game.score}/100`, color: gradeColor },
                  { label: 'Grade', value: game.grade, color: gradeColor },
                  { label: 'Trimestres', value: `${game.quarters}T`, color: 'var(--text-secondary)' },
                  { label: 'Inflation', value: fmtPct(game.avgInflation), color: inflationColor },
                  { label: 'Croissance', value: fmtPct(game.avgGrowth), color: growthColor },
                  { label: 'Crédibilité', value: Math.round(game.avgCredibility).toString(), color: credColor },
                ].map(item => (
                  <div key={item.label} className="flex flex-col">
                    <span className="label-caps" style={{ fontSize: '7px', color: 'var(--text-tertiary)', marginBottom: '2px' }}>{item.label}</span>
                    <span className="font-mono font-semibold text-xs" style={{ color: item.color }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// ── Grade distribution ────────────────────────────────────────────────────────
function GradeDistribution({ games }: { games: GameRecord[] }) {
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 }
  games.forEach(g => { if (g.grade in counts) counts[g.grade]++ })
  const max = Math.max(...Object.values(counts), 1)

  return (
    <div className="flex items-end justify-center gap-2 h-20">
      {Object.entries(counts).map(([grade, count]) => (
        <div key={grade} className="flex flex-col items-center gap-1" style={{ width: '40px' }}>
          <span className="font-mono text-xs font-semibold" style={{ color: GRADE_COLORS[grade] }}>{count > 0 ? count : '—'}</span>
          <motion.div
            className="w-full rounded-sm"
            style={{ backgroundColor: count > 0 ? `${GRADE_COLORS[grade]}44` : 'var(--bg-hover)', border: count > 0 ? `1px solid ${GRADE_COLORS[grade]}44` : '1px solid var(--border-subtle)' }}
            initial={{ height: 0 }}
            animate={{ height: `${(count / max) * 60 + 4}px` }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          />
          <span className="font-editorial text-base" style={{ color: GRADE_COLORS[grade], opacity: count > 0 ? 1 : 0.3 }}>{grade}</span>
        </div>
      ))}
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function HistoryPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [filterScenario, setFilterScenario] = useState('all')
  const [sortKey, setSortKey] = useState<SortKey>('date')

  const getCurrentPlayer = useAuthStore(s => s.getCurrentPlayer)
  const currentUser = useAuthStore(s => s.currentUser)
  const getPlayerStats = useAuthStore(s => s.getPlayerStats)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (mounted && !currentUser) router.push('/login')
  }, [mounted, currentUser, router])

  const player = useMemo(() => mounted ? getCurrentPlayer() : null, [mounted, getCurrentPlayer])
  const stats = useMemo(() => mounted ? getPlayerStats() : null, [mounted, getPlayerStats])
  const allGames = useMemo(() => player?.gameHistory ?? [], [player])

  const filteredGames = useMemo(() => {
    let games = [...allGames]
    if (filterScenario !== 'all') {
      games = games.filter(g => g.scenario === filterScenario || (g.scenarioTitle ?? '').toLowerCase().includes(filterScenario))
    }
    if (sortKey === 'score_desc') games.sort((a, b) => b.score - a.score)
    else if (sortKey === 'score_asc') games.sort((a, b) => a.score - b.score)
    return games
  }, [allGames, filterScenario, sortKey])

  if (!mounted || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-base)' }}>
        <p className="label-caps" style={{ color: 'var(--text-tertiary)' }}>Chargement…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-base)' }}>

      {/* ── NAV ──────────────────────────────────────────────────────── */}
      <nav
        className="flex items-center justify-between px-6"
        style={{ height: '52px', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-base)', position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(8px)' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1.5 label-caps"
            style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <ArrowLeft size={12} />
            Dashboard
          </button>
          <span style={{ color: 'var(--border-default)' }}>·</span>
          <Trophy size={13} style={{ color: 'var(--accent-warm)' }} />
          <span className="label-caps" style={{ color: 'var(--text-secondary)' }}>
            Historique — {player?.pseudo}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => router.push('/dashboard')}
            className="label-caps px-3 py-1.5 rounded-md"
            style={{ backgroundColor: 'var(--accent-primary)', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            Jouer
          </button>
        </div>
      </nav>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-editorial text-3xl mb-1" style={{ color: 'var(--text-primary)' }}>
            Mon historique
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            {allGames.length} partie{allGames.length > 1 ? 's' : ''} jouée{allGames.length > 1 ? 's' : ''} · {player?.pseudo}
          </p>
        </motion.div>

        {allGames.length === 0 ? (
          /* Empty state */
          <motion.div
            className="rounded-lg p-16 text-center"
            style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-default)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Trophy size={40} style={{ color: 'var(--text-tertiary)', margin: '0 auto 16px' }} />
            <h2 className="font-editorial-roman text-2xl mb-3" style={{ color: 'var(--text-primary)' }}>Aucune partie enregistrée</h2>
            <p className="text-sm mb-8" style={{ color: 'var(--text-tertiary)' }}>
              Lancez votre première simulation pour voir votre historique ici.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-8 py-3 rounded-lg font-semibold text-sm flex items-center gap-2 mx-auto"
              style={{ background: 'linear-gradient(135deg, #C41923 0%, #8B131B 100%)', color: '#fff', border: 'none', cursor: 'pointer' }}
            >
              Lancer une partie
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── LEFT column: Stats + Chart ───────────────────────── */}
            <div className="lg:col-span-1 flex flex-col gap-4">

              {/* Global stats */}
              {stats && (
                <motion.div
                  className="rounded-lg p-5"
                  style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-default)' }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <span className="label-caps block mb-4" style={{ color: 'var(--accent-warm)' }}>Statistiques globales</span>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: Trophy,    label: 'Parties',       value: String(stats.totalGames),       color: 'var(--accent-primary)' },
                      { icon: Target,    label: 'Score moyen',   value: `${stats.avgScore}/100`,         color: 'var(--accent-cool)' },
                      { icon: Star,      label: 'Meilleur',      value: `${stats.bestScore}/100`,         color: 'var(--accent-warm)' },
                      { icon: Award,     label: 'Meilleur grade', value: stats.bestGrade,                color: GRADE_COLORS[stats.bestGrade] ?? 'var(--text-primary)' },
                      { icon: TrendingUp,label: 'Taux réussite', value: `${stats.winRate} %`,            color: '#4A9D7C' },
                      { icon: Flame,     label: 'Favori',        value: stats.favoriteScenario.length > 10 ? stats.favoriteScenario.slice(0, 10) + '…' : stats.favoriteScenario, color: 'var(--text-secondary)' },
                    ].map(card => {
                      const Icon = card.icon
                      return (
                        <div key={card.label} className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <Icon size={10} style={{ color: card.color }} />
                            <span className="label-caps" style={{ fontSize: '7px', color: 'var(--text-tertiary)' }}>{card.label}</span>
                          </div>
                          <span className="font-editorial-roman text-lg" style={{ color: card.color, lineHeight: 1 }}>
                            {card.value}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </motion.div>
              )}

              {/* Score progression chart */}
              {allGames.length >= 2 && (
                <motion.div
                  className="rounded-lg p-5"
                  style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-default)' }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="label-caps" style={{ color: 'var(--accent-primary)' }}>Progression des scores</span>
                    <BarChart3 size={12} style={{ color: 'var(--text-tertiary)' }} />
                  </div>
                  <ScoreProgressChart games={allGames} />
                  <div className="flex items-center gap-3 mt-3 justify-end">
                    {[{ label: 'A ≥ 90', color: '#4A9D7C' }, { label: 'B ≥ 75', color: '#5C7E92' }, { label: 'C ≥ 60', color: '#C9A86A' }].map(t => (
                      <div key={t.label} className="flex items-center gap-1">
                        <span style={{ width: 8, height: 2, backgroundColor: t.color, display: 'inline-block', opacity: 0.5 }} />
                        <span style={{ fontSize: '8px', fontFamily: 'monospace', color: 'var(--text-tertiary)' }}>{t.label}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Grade distribution */}
              <motion.div
                className="rounded-lg p-5"
                style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-default)' }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="label-caps" style={{ color: 'var(--accent-cool)' }}>Distribution des grades</span>
                  <GraduationCap size={12} style={{ color: 'var(--text-tertiary)' }} />
                </div>
                <GradeDistribution games={allGames} />
              </motion.div>

            </div>

            {/* ── RIGHT column: Game list ──────────────────────────── */}
            <div className="lg:col-span-2">

              {/* Filter + sort bar */}
              <motion.div
                className="flex flex-col sm:flex-row gap-3 mb-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                {/* Scenario filter */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Filter size={11} style={{ color: 'var(--text-tertiary)' }} />
                  {SCENARIO_FILTERS.map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFilterScenario(f.id)}
                      className="label-caps px-2.5 py-1 rounded-full transition-all"
                      style={{
                        backgroundColor: filterScenario === f.id ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                        color: filterScenario === f.id ? '#fff' : 'var(--text-secondary)',
                        border: filterScenario === f.id ? '1px solid transparent' : '1px solid var(--border-default)',
                        cursor: 'pointer',
                        fontSize: '9px',
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Sort */}
                <div className="ml-auto">
                  <select
                    value={sortKey}
                    onChange={e => setSortKey(e.target.value as SortKey)}
                    className="label-caps px-3 py-1.5 rounded-md text-xs"
                    style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)', cursor: 'pointer' }}
                  >
                    {SORT_OPTIONS.map(o => (
                      <option key={o.id} value={o.id}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </motion.div>

              {/* Count */}
              <p className="label-caps mb-3" style={{ color: 'var(--text-tertiary)', fontSize: '9px' }}>
                {filteredGames.length} partie{filteredGames.length > 1 ? 's' : ''} affichée{filteredGames.length > 1 ? 's' : ''}
              </p>

              {/* Game cards */}
              <AnimatePresence mode="popLayout">
                {filteredGames.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="rounded-lg p-8 text-center"
                    style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-subtle)' }}
                  >
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Aucune partie pour ce scénario.</p>
                  </motion.div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {filteredGames.map((game, i) => (
                      <GameCard key={game.id} game={game} index={i} />
                    ))}
                  </div>
                )}
              </AnimatePresence>

            </div>
          </div>
        )}

      </main>

      <footer className="px-6 py-5 text-center" style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '32px' }}>
        <p className="label-caps" style={{ color: 'var(--text-tertiary)' }}>CBS · Historique de vos parties · Banque centrale</p>
      </footer>
    </div>
  )
}
