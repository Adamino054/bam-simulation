'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Swords, Handshake, Users, ArrowLeft, ChevronRight, Trophy, Target,
  Landmark, TrendingUp, Shield, Zap, Lock, Unlock, BarChart3,
  Award, Star, Crown, Loader2, ArrowRight, RotateCcw,
  GraduationCap, Sliders, LayoutDashboard, LogOut, Percent,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { useMultiplayerStore, type MultiplayerMode, type ActivePlayer } from '@/store/multiplayerStore'
import { useAuthStore } from '@/store/authStore'
import { SCENARIOS } from '@/engine/scenarios'
import { ThemeToggle } from '@/components/shell/ThemeToggle'
import { Stepper } from '@/components/ui/Stepper'
import { AssistantBot } from '@/components/ui/AssistantBot'
import { fmtPct, fmtBp } from '@/lib/format'
import { computeTaylorRate } from '@/engine/models/taylorRule'
import { sound } from '@/lib/audio'
import { getLevelConfig, isInstrumentVisible } from '@/engine/difficulty'
import type { ScenarioId, DifficultyLevel, CommunicationStance, EconomicState } from '@/engine/state'
import {
  POLICY_RATE_BOUNDS, FX_INTERVENTION_OPTIONS, EMERGENCY_LENDING_OPTIONS,
  MARKET_OPS_OPTIONS, CCYB_OPTIONS, INFLATION_TARGET,
} from '@/lib/constants'

// ── Constants ────────────────────────────────────────────────────────────────

const RATE_OPTIONS = [
  { value: -100, label: '−100' }, { value: -50, label: '−50' }, { value: -25, label: '−25' },
  { value: 0, label: '0' }, { value: 25, label: '+25' }, { value: 50, label: '+50' }, { value: 100, label: '+100' },
]
const RO_OPTIONS = [
  { value: -100, label: '−100' }, { value: -50, label: '−50' },
  { value: 0, label: '0' }, { value: 50, label: '+50' }, { value: 100, label: '+100' },
]

const MARKET_OPS_LABELS: Record<number, string> = { [-20]: '−20 mds', [-10]: '−10 mds', [0]: 'Neutre', [10]: '+10 mds', [20]: '+20 mds' }
const FX_LABELS: Record<number, string> = { [-10]: '−10 mds', [0]: 'Neutre', [10]: '+10 mds', [20]: '+20 mds', [30]: '+30 mds' }
const EMERGENCY_LABELS: Record<number, string> = { [0]: 'Inactif', [5]: '5 mds', [10]: '10 mds', [20]: '20 mds' }
const CCYB_LABELS: Record<number, string> = { [0]: 'Désactivé', [0.5]: '0,5 %', [1.0]: '1,0 %', [1.5]: '1,5 %', [2.0]: '2,0 %', [2.5]: '2,5 %' }

const GUIDANCE_OPTS: { value: CommunicationStance; label: string; color: string }[] = [
  { value: 'dovish', label: '🕊️ Accommodant', color: 'var(--data-positive)' },
  { value: 'neutral', label: '⚖️ Neutre', color: 'var(--text-secondary)' },
  { value: 'hawkish', label: '🦅 Restrictif', color: 'var(--data-negative)' },
]

const DIFFICULTY_META: Record<string, { label: string; emoji: string; color: string; bg: string }> = {
  beginner:     { label: 'Débutant',      emoji: '🌱', color: '#4A9D7C', bg: 'rgba(74, 157, 124, 0.12)' },
  intermediate: { label: 'Intermédiaire', emoji: '📈', color: '#C9A86A', bg: 'rgba(201, 168, 106, 0.12)' },
  expert:       { label: 'Expert',        emoji: '🎯', color: '#C25450', bg: 'rgba(194, 84, 80, 0.12)' },
}

const SCENARIO_DIFFICULTY: Record<string, { label: string; color: string; bg: string }> = {
  normal: { label: 'Standard',  color: '#4A9D7C', bg: 'rgba(74, 157, 124, 0.12)' },
  hard:   { label: 'Difficile', color: '#C9A86A', bg: 'rgba(201, 168, 106, 0.12)' },
  crisis: { label: 'Crise',     color: '#C25450', bg: 'rgba(194, 84, 80, 0.12)' },
}

const GRADE_COLORS: Record<string, string> = { A: '#4A9D7C', B: '#5C7E92', C: '#C9A86A', D: '#E8914A', F: '#C25450' }

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export default function MultiplayerPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  const currentUser = useAuthStore(s => s.currentUser)
  const logout = useAuthStore(s => s.logout)
  const phase = useMultiplayerStore(s => s.phase)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (mounted && !currentUser) router.push('/login')
  }, [mounted, currentUser, router])

  if (!mounted || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-base)' }}>
        <p className="label-caps" style={{ color: 'var(--text-tertiary)' }}>Chargement…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-base)' }}>
      {/* ══ NAV ══ */}
      <nav className="flex items-center justify-between px-6" style={{ height: '52px', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-base)' }}>
        <div className="flex items-center gap-3">
          <a href="/" className="font-editorial text-sm" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>CBS</a>
          <span style={{ color: 'var(--border-default)' }}>·</span>
          <a href="/dashboard" className="label-caps flex items-center gap-1" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '11px' }}>
            <LayoutDashboard size={12} style={{ color: 'var(--accent-warm)' }} /> Simulation
          </a>
          <span style={{ color: 'var(--border-default)' }}>·</span>
          <span className="label-caps flex items-center gap-1 font-bold text-[var(--text-primary)]" style={{ fontSize: '11px' }}>
            <Users size={12} style={{ color: 'var(--accent-primary)' }} /> Multijoueur
          </span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <button
            onClick={() => { logout(); router.push('/') }}
            className="flex items-center gap-1.5 label-caps transition-colors"
            style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <LogOut size={12} /> Déconnexion
          </button>
        </div>
      </nav>

      {/* ══ CONTENT ══ */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {phase === 'setup' && <SetupView key="setup" />}
          {phase === 'playing' && <PlayingView key="playing" />}
          {phase === 'turnTransition' && <TransitionView key="transition" />}
          {phase === 'quarterReview' && <QuarterReviewView key="review" />}
          {phase === 'finished' && <FinishedView key="finished" />}
        </AnimatePresence>
      </main>

      <AssistantBot
        messages={["Je peux expliquer les regles du duel, la co-gouvernance et les indicateurs de chaque joueur."]}
        context="multiplayer"
      />
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. SETUP VIEW
// ══════════════════════════════════════════════════════════════════════════════

function SetupView() {
  const router = useRouter()
  const store = useMultiplayerStore()
  const { mode, player1, player2, scenario, difficultyLevel } = store

  const canStart = player1.name.trim().length >= 2 && player2.name.trim().length >= 2

  const scenarios = Object.values(SCENARIOS)

  return (
    <motion.div {...fadeUp} exit={{ opacity: 0, y: -20 }}>
      {/* Back button */}
      <button
        onClick={() => router.push('/dashboard')}
        className="flex items-center gap-1.5 label-caps mb-6 transition-colors hover:text-[var(--text-primary)]"
        style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        <ArrowLeft size={12} /> Retour au dashboard
      </button>

      {/* Title */}
      <div className="text-center mb-10">
        <h1 className="font-editorial text-3xl sm:text-4xl mb-2" style={{ color: 'var(--text-primary)' }}>
          Mode Multijoueur
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          Affrontez-vous ou coopérez pour piloter l&apos;économie marocaine.
        </p>
      </div>

      {/* ── Mode Selector ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {([
          { id: 'duel' as MultiplayerMode, icon: Swords, title: 'Duel de Gouverneurs', subtitle: 'Compétitif — Deux banques centrales rivales', desc: 'Chacun pilote sa propre économie sur le même scénario. Mêmes chocs, décisions différentes. Le meilleur gouverneur l\'emporte.', accentColor: '#C25450' },
          { id: 'coop' as MultiplayerMode, icon: Handshake, title: 'Co-Gouvernance', subtitle: 'Coopératif — Une seule banque centrale', desc: 'Partagez les instruments de la même banque centrale. L\'un contrôle les taux, l\'autre la stabilité. Communiquez ou sombrez.', accentColor: '#4A9D7C' },
        ]).map(m => {
          const isSelected = mode === m.id
          const Icon = m.icon
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => { store.setMode(m.id); sound.playTick() }}
              className="text-left rounded-xl p-6 transition-all duration-200 relative overflow-hidden"
              style={{
                backgroundColor: isSelected ? 'var(--bg-elevated)' : 'var(--bg-panel)',
                border: `2px solid ${isSelected ? m.accentColor + '60' : 'var(--border-default)'}`,
                boxShadow: isSelected ? `0 0 0 1px ${m.accentColor}22, 0 8px 32px rgba(0,0,0,0.2)` : 'none',
                transform: isSelected ? 'translateY(-2px)' : 'translateY(0)',
                cursor: 'pointer',
              }}
            >
              {isSelected && (
                <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-3xl pointer-events-none" style={{ background: `${m.accentColor}15` }} />
              )}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${m.accentColor}15` }}>
                  <Icon size={20} style={{ color: m.accentColor }} />
                </div>
                <div>
                  <span className="block font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{m.title}</span>
                  <span className="block text-[10px] label-caps" style={{ color: m.accentColor }}>{m.subtitle}</span>
                </div>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{m.desc}</p>
              {isSelected && (
                <span className="absolute top-3 right-3 flex items-center justify-center w-5 h-5 rounded-full" style={{ backgroundColor: m.accentColor }}>
                  <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Player Names ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {[
          { key: 'p1' as const, config: player1, set: store.setPlayer1, label: mode === 'coop' ? 'Gouverneur Monétaire' : 'Joueur 1', sublabel: mode === 'coop' ? 'Taux directeur · Réserves · Open Market' : 'Premier gouverneur', color: '#5C7E92' },
          { key: 'p2' as const, config: player2, set: store.setPlayer2, label: mode === 'coop' ? 'Directeur Prudentiel' : 'Joueur 2', sublabel: mode === 'coop' ? 'CCyB · Change · Prêt d\'urgence' : 'Deuxième gouverneur', color: '#C9A86A' },
        ].map(p => (
          <div key={p.key} className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-default)' }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
              <span className="label-caps font-semibold" style={{ color: p.color, fontSize: '10px' }}>{p.label}</span>
            </div>
            <p className="text-[10px] mb-3" style={{ color: 'var(--text-tertiary)' }}>{p.sublabel}</p>
            <input
              type="text"
              value={p.config.name}
              onChange={e => p.set({ name: e.target.value })}
              placeholder="Entrez un pseudo…"
              maxLength={20}
              className="w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-all"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = `${p.color}80` }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-default)' }}
            />
          </div>
        ))}
      </div>

      {/* ── Scenario Picker ── */}
      <div className="mb-6">
        <span className="label-caps block mb-3" style={{ color: 'var(--accent-primary)' }}>Scénario de départ</span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {scenarios.filter(sc => sc.id !== 'volcker1979' && sc.id !== 'crisis2008').map(sc => {
            const isSelected = scenario === sc.id
            const meta = SCENARIO_DIFFICULTY[sc.difficulty]
            return (
              <button
                key={sc.id}
                type="button"
                onClick={() => { store.setScenario(sc.id); sound.playTick() }}
                className="text-left rounded-lg p-4 transition-all duration-150"
                style={{
                  backgroundColor: isSelected ? 'var(--bg-elevated)' : 'var(--bg-panel)',
                  border: `1px solid ${isSelected ? meta.color + '55' : 'var(--border-default)'}`,
                  boxShadow: isSelected ? `0 4px 16px rgba(0,0,0,0.15)` : 'none',
                  cursor: 'pointer',
                }}
              >
                <span className="inline-flex items-center gap-1 mb-2 px-1.5 py-0.5 rounded-full" style={{ backgroundColor: meta.bg, color: meta.color, fontSize: '8px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  <span style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: meta.color, display: 'inline-block' }} />
                  {meta.label}
                </span>
                <span className="block font-medium text-xs mb-1" style={{ color: 'var(--text-primary)' }}>{sc.title}</span>
                <span className="block text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{sc.subtitle}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Difficulty ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center gap-2">
          <Target size={16} style={{ color: 'var(--accent-primary)' }} />
          <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Difficulté :</span>
        </div>
        <div className="flex rounded-lg overflow-hidden p-0.5" style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-default)' }}>
          {(['beginner', 'intermediate', 'expert'] as DifficultyLevel[]).map(lvl => {
            const meta = DIFFICULTY_META[lvl]
            return (
              <button
                key={lvl}
                onClick={() => { store.setDifficultyLevel(lvl); sound.playTick() }}
                className="px-4 py-1.5 rounded-md text-xs font-semibold transition-all"
                style={{
                  backgroundColor: difficultyLevel === lvl ? 'var(--accent-primary)' : 'transparent',
                  color: difficultyLevel === lvl ? '#fff' : 'var(--text-secondary)',
                  border: 'none', cursor: 'pointer',
                }}
              >
                {meta.emoji} {meta.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Start Button ── */}
      <motion.button
        onClick={() => { if (canStart) { store.startGame(); sound.playSuccess() } }}
        disabled={!canStart}
        whileHover={canStart ? { scale: 1.02, y: -2 } : {}}
        whileTap={canStart ? { scale: 0.98 } : {}}
        className="w-full py-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all premium-shimmer-sweep"
        style={{
          background: canStart
            ? (mode === 'duel' ? 'linear-gradient(135deg, #C41923 0%, #8B131B 100%)' : 'linear-gradient(135deg, #4A9D7C 0%, #357A5E 100%)')
            : 'var(--bg-elevated)',
          color: canStart ? '#fff' : 'var(--text-tertiary)',
          border: 'none', cursor: canStart ? 'pointer' : 'not-allowed',
          boxShadow: canStart ? '0 4px 24px rgba(180,25,35,0.3)' : 'none',
          letterSpacing: '0.04em',
        }}
      >
        {mode === 'duel' ? <Swords size={16} /> : <Handshake size={16} />}
        {canStart
          ? (mode === 'duel' ? 'Lancer le Duel' : 'Lancer la Co-Gouvernance')
          : 'Remplissez les pseudos pour commencer'
        }
        {canStart && <ChevronRight size={16} />}
      </motion.button>
    </motion.div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// 2. PLAYING VIEW
// ══════════════════════════════════════════════════════════════════════════════

function PlayingView() {
  const store = useMultiplayerStore()
  const { mode } = store

  return (
    <motion.div {...fadeUp} exit={{ opacity: 0, y: -20 }}>
      {mode === 'duel' ? <DuelPlayView /> : <CoopPlayView />}
    </motion.div>
  )
}

// ── Duel Play View ───────────────────────────────────────────────────────────

function DuelPlayView() {
  const store = useMultiplayerStore()
  const { duel, player1, player2, difficultyLevel, currentQuarterIndex, scenario } = store
  const levelConfig = getLevelConfig(difficultyLevel)
  const maxQ = levelConfig.quarters
  const ap = duel.activePlayer
  const playerConfig = ap === 'p1' ? player1 : player2
  const playerColor = ap === 'p1' ? '#5C7E92' : '#C9A86A'
  const currentState = ap === 'p1' ? duel.p1State : duel.p2State
  const pendingAction = ap === 'p1' ? duel.p1PendingAction : duel.p2PendingAction

  const [submitting, setSubmitting] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const taylor = useMemo(
    () => computeTaylorRate(currentState.inflation, currentState.outputGap),
    [currentState.inflation, currentState.outputGap],
  )
  const newPolicyRate = Math.max(POLICY_RATE_BOUNDS.min, currentState.policyRate + pendingAction.policyRateChangeBp / 100)

  const handleSubmit = async () => {
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 500))
    store.submitDuelTurn()
    setSubmitting(false)
  }

  return (
    <div>
      {/* Player banner */}
      <div className="rounded-xl p-4 mb-6 flex items-center justify-between" style={{ background: `linear-gradient(135deg, ${playerColor}15, transparent)`, border: `1px solid ${playerColor}30` }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-editorial text-lg" style={{ backgroundColor: `${playerColor}20`, color: playerColor, border: `2px solid ${playerColor}` }}>
            {ap === 'p1' ? '1' : '2'}
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{playerConfig.name}</p>
            <p className="label-caps text-[9px]" style={{ color: playerColor }}>
              {ap === 'p1' ? 'Joueur 1' : 'Joueur 2'} · Trimestre {(ap === 'p1' ? currentQuarterIndex : currentQuarterIndex) + 1} / {maxQ}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="font-mono text-xs" style={{ color: currentState.centralBankCredibility > 60 ? 'var(--data-positive)' : 'var(--data-warning)' }}>
            Créd. {Math.round(currentState.centralBankCredibility)}
          </span>
        </div>
      </div>

      {/* Economy snapshot */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
        {[
          { l: 'Inflation', v: fmtPct(currentState.inflation, 2), c: Math.abs(currentState.inflation - 2) < 0.5 ? 'var(--data-positive)' : Math.abs(currentState.inflation - 2) < 1.5 ? 'var(--data-warning)' : 'var(--data-negative)' },
          { l: 'PIB', v: fmtPct(currentState.gdpGrowth, 2), c: currentState.gdpGrowth > 2 ? 'var(--data-positive)' : currentState.gdpGrowth > 0 ? 'var(--data-warning)' : 'var(--data-negative)' },
          { l: 'Output gap', v: fmtPct(currentState.outputGap, 2), c: 'var(--text-primary)' },
          { l: 'Chômage', v: fmtPct(currentState.unemployment, 2), c: currentState.unemployment > 12 ? 'var(--data-negative)' : 'var(--text-primary)' },
          { l: 'Taux dir.', v: fmtPct(currentState.policyRate, 2), c: 'var(--text-primary)' },
          { l: 'NPL', v: fmtPct(currentState.nplRatio), c: currentState.nplRatio > 10 ? 'var(--data-negative)' : 'var(--text-primary)' },
        ].map(m => (
          <div key={m.l} className="rounded-lg p-3 text-center" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-subtle)' }}>
            <span className="block label-caps" style={{ fontSize: '7px' }}>{m.l}</span>
            <span className="font-mono text-sm font-bold tabular" style={{ color: m.c }}>{m.v}</span>
          </div>
        ))}
      </div>

      {/* Toggle History Chart */}
      {(ap === 'p1' ? duel.p1History : duel.p2History).length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => { setShowHistory(!showHistory); sound.playTick() }}
            className="w-full py-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
            style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            <BarChart3 size={13} style={{ color: playerColor }} />
            {showHistory ? "Masquer les graphiques historiques" : "Afficher les graphiques historiques"}
          </button>
          {showHistory && (
            <div className="mt-3">
              <MultiplayerChart
                p1History={ap === 'p1' ? duel.p1History : duel.p2History}
                p1Current={currentState}
                p2History={[]}
                p2Current={null}
                p1Name={playerConfig.name}
                p2Name=""
                mode="coop"
              />
            </div>
          )}
        </div>
      )}

      {/* Decision instruments */}
      <div className="rounded-xl overflow-hidden mb-6" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-default)' }}>
        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)', background: `linear-gradient(to right, ${playerColor}10, transparent)` }}>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse-soft" style={{ backgroundColor: playerColor }} />
            <span className="label-caps" style={{ color: playerColor }}>Décisions de politique monétaire</span>
          </div>
        </div>

        <div className="px-4 py-5 flex flex-col gap-5">
          {/* Taux directeur */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="label-caps" style={{ color: 'var(--text-tertiary)' }}>Taux directeur</span>
              <span className="font-editorial tabular" style={{ fontSize: '1.3rem', color: 'var(--text-primary)' }}>{fmtPct(newPolicyRate, 2)}</span>
            </div>
            <Stepper value={pendingAction.policyRateChangeBp} options={RATE_OPTIONS} onChange={v => store.setDuelAction(ap, { policyRateChangeBp: v })} label="bp" />
            {/* Taylor hint */}
            <div className="mt-2 flex items-center justify-between px-2 py-1.5 rounded text-[10px]" style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-tertiary)' }}>Règle de Taylor</span>
              <span className="font-mono font-bold" style={{ color: 'var(--text-secondary)' }}>{fmtPct(taylor, 2)}</span>
            </div>
          </div>

          <div style={{ height: 1, backgroundColor: 'var(--border-subtle)' }} />

          {/* Réserves obligatoires */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="label-caps" style={{ color: 'var(--text-tertiary)' }}>Réserve obligatoire</span>
              <span className="font-mono text-sm tabular" style={{ color: 'var(--text-primary)' }}>{fmtPct(currentState.reserveRequirement, 1)}</span>
            </div>
            <Stepper value={pendingAction.reserveRequirementChangeBp} options={RO_OPTIONS} onChange={v => store.setDuelAction(ap, { reserveRequirementChangeBp: v })} label="bp" />
          </div>

          <div style={{ height: 1, backgroundColor: 'var(--border-subtle)' }} />

          {/* Opérations de marché */}
          <div>
            <span className="label-caps block mb-2" style={{ color: 'var(--text-tertiary)' }}>Opérations de marché</span>
            <Stepper
              value={pendingAction.marketOperationsBnMad}
              options={MARKET_OPS_OPTIONS.map(v => ({ value: v, label: MARKET_OPS_LABELS[v] ?? String(v) }))}
              onChange={v => store.setDuelAction(ap, { marketOperationsBnMad: v })}
              label="mds MAD"
            />
          </div>

          {/* Forward guidance */}
          {isInstrumentVisible('communicationStance', difficultyLevel) && (
            <>
              <div style={{ height: 1, backgroundColor: 'var(--border-subtle)' }} />
              <div>
                <span className="label-caps block mb-2" style={{ color: 'var(--text-tertiary)' }}>Forward guidance</span>
                <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                  {GUIDANCE_OPTS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => store.setDuelAction(ap, { communicationStance: opt.value })}
                      className="flex-1 py-2 rounded text-xs font-semibold transition-all"
                      style={{
                        backgroundColor: pendingAction.communicationStance === opt.value ? `${opt.color}18` : 'transparent',
                        border: pendingAction.communicationStance === opt.value ? `1px solid ${opt.color}40` : '1px solid transparent',
                        color: pendingAction.communicationStance === opt.value ? opt.color : 'var(--text-tertiary)',
                        cursor: 'pointer',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Submit button */}
      <motion.button
        onClick={handleSubmit}
        disabled={submitting}
        whileHover={submitting ? {} : { scale: 1.02, y: -1 }}
        whileTap={submitting ? {} : { scale: 0.98 }}
        className="w-full py-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 animate-turn-btn-glow premium-shimmer-sweep"
        style={{
          background: 'linear-gradient(135deg, #C41923 0%, #8B131B 100%)',
          color: '#fff', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
          opacity: submitting ? 0.7 : 1,
        }}
      >
        {submitting ? <><Loader2 size={14} className="animate-spin" /> Calcul…</> : <>Valider mes décisions <ChevronRight size={16} /></>}
      </motion.button>
    </div>
  )
}

// ── Coop Play View ───────────────────────────────────────────────────────────

function CoopPlayView() {
  const store = useMultiplayerStore()
  const { coop, player1, player2, difficultyLevel, currentQuarterIndex } = store
  const levelConfig = getLevelConfig(difficultyLevel)
  const maxQ = levelConfig.quarters
  const { sharedState, sharedPendingAction, p1Locked, p2Locked } = coop
  const bothLocked = p1Locked && p2Locked

  const [submitting, setSubmitting] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const newPolicyRate = Math.max(POLICY_RATE_BOUNDS.min, sharedState.policyRate + sharedPendingAction.policyRateChangeBp / 100)

  const handleSubmit = async () => {
    if (!bothLocked) return
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 500))
    store.submitCoopTurn()
    setSubmitting(false)
  }

  return (
    <div>
      {/* Coop banner */}
      <div className="rounded-xl p-4 mb-6 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, rgba(74,157,124,0.08), transparent)', border: '1px solid rgba(74,157,124,0.2)' }}>
        <div className="flex items-center gap-3">
          <Handshake size={20} style={{ color: '#4A9D7C' }} />
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Co-Gouvernance — Trimestre {currentQuarterIndex + 1} / {maxQ}</p>
            <p className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{player1.name} & {player2.name}</p>
          </div>
        </div>
        <span className="font-mono text-xs" style={{ color: sharedState.centralBankCredibility > 60 ? 'var(--data-positive)' : 'var(--data-warning)' }}>
          Créd. {Math.round(sharedState.centralBankCredibility)}
        </span>
      </div>

      {/* Economy metrics */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
        {[
          { l: 'Inflation', v: fmtPct(sharedState.inflation, 2), c: Math.abs(sharedState.inflation - 2) < 0.5 ? 'var(--data-positive)' : 'var(--data-negative)' },
          { l: 'PIB', v: fmtPct(sharedState.gdpGrowth, 2), c: sharedState.gdpGrowth > 2 ? 'var(--data-positive)' : 'var(--data-negative)' },
          { l: 'Output gap', v: fmtPct(sharedState.outputGap, 2), c: 'var(--text-primary)' },
          { l: 'Chômage', v: fmtPct(sharedState.unemployment, 2), c: 'var(--text-primary)' },
          { l: 'Taux dir.', v: fmtPct(sharedState.policyRate, 2), c: 'var(--text-primary)' },
          { l: 'NPL', v: fmtPct(sharedState.nplRatio), c: sharedState.nplRatio > 10 ? 'var(--data-negative)' : 'var(--text-primary)' },
        ].map(m => (
          <div key={m.l} className="rounded-lg p-3 text-center" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-subtle)' }}>
            <span className="block label-caps" style={{ fontSize: '7px' }}>{m.l}</span>
            <span className="font-mono text-sm font-bold tabular" style={{ color: m.c }}>{m.v}</span>
          </div>
        ))}
      </div>

      {/* Toggle History Chart */}
      {coop.sharedHistory.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => { setShowHistory(!showHistory); sound.playTick() }}
            className="w-full py-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
            style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            <BarChart3 size={13} style={{ color: '#4A9D7C' }} />
            {showHistory ? "Masquer les graphiques historiques" : "Afficher les graphiques historiques"}
          </button>
          {showHistory && (
            <div className="mt-3">
              <MultiplayerChart
                p1History={coop.sharedHistory}
                p1Current={sharedState}
                p2History={[]}
                p2Current={null}
                p1Name={player1.name}
                p2Name={player2.name}
                mode="coop"
              />
            </div>
          )}
        </div>
      )}

      {/* Two-column instrument panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* P1 — Gouverneur Monétaire */}
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-panel)', border: p1Locked ? '2px solid #5C7E92' : '1px solid var(--border-default)' }}>
          <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'linear-gradient(to right, rgba(92,126,146,0.08), transparent)' }}>
            <span className="label-caps text-[10px]" style={{ color: '#5C7E92' }}>🏛️ {player1.name} — Monétaire</span>
            <button
              onClick={() => p1Locked ? store.unlockPlayer('p1') : store.lockPlayer('p1')}
              className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-bold uppercase transition-all"
              style={{
                backgroundColor: p1Locked ? 'rgba(74,157,124,0.12)' : 'var(--bg-elevated)',
                color: p1Locked ? 'var(--data-positive)' : 'var(--text-tertiary)',
                border: p1Locked ? '1px solid rgba(74,157,124,0.3)' : '1px solid var(--border-default)',
                cursor: 'pointer',
              }}
            >
              {p1Locked ? <><Lock size={9} /> Verrouillé</> : <><Unlock size={9} /> Verrouiller</>}
            </button>
          </div>
          <div className={`px-4 py-4 flex flex-col gap-4 transition-opacity ${p1Locked ? 'opacity-50 pointer-events-none' : ''}`}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="label-caps" style={{ color: 'var(--text-tertiary)', fontSize: '9px' }}>Taux directeur</span>
                <span className="font-mono text-sm font-bold tabular" style={{ color: 'var(--text-primary)' }}>{fmtPct(newPolicyRate, 2)}</span>
              </div>
              <Stepper value={sharedPendingAction.policyRateChangeBp} options={RATE_OPTIONS} onChange={v => store.setCoopAction({ policyRateChangeBp: v })} label="bp" />
            </div>
            <div>
              <span className="label-caps block mb-2" style={{ color: 'var(--text-tertiary)', fontSize: '9px' }}>Réserve obligatoire</span>
              <Stepper value={sharedPendingAction.reserveRequirementChangeBp} options={RO_OPTIONS} onChange={v => store.setCoopAction({ reserveRequirementChangeBp: v })} label="bp" />
            </div>
            <div>
              <span className="label-caps block mb-2" style={{ color: 'var(--text-tertiary)', fontSize: '9px' }}>Opérations de marché</span>
              <Stepper value={sharedPendingAction.marketOperationsBnMad} options={MARKET_OPS_OPTIONS.map(v => ({ value: v, label: MARKET_OPS_LABELS[v] ?? String(v) }))} onChange={v => store.setCoopAction({ marketOperationsBnMad: v })} label="" />
            </div>
          </div>
        </div>

        {/* P2 — Directeur Prudentiel */}
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--bg-panel)', border: p2Locked ? '2px solid #C9A86A' : '1px solid var(--border-default)' }}>
          <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'linear-gradient(to right, rgba(201,168,106,0.08), transparent)' }}>
            <span className="label-caps text-[10px]" style={{ color: '#C9A86A' }}>🛡️ {player2.name} — Prudentiel</span>
            <button
              onClick={() => p2Locked ? store.unlockPlayer('p2') : store.lockPlayer('p2')}
              className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-bold uppercase transition-all"
              style={{
                backgroundColor: p2Locked ? 'rgba(74,157,124,0.12)' : 'var(--bg-elevated)',
                color: p2Locked ? 'var(--data-positive)' : 'var(--text-tertiary)',
                border: p2Locked ? '1px solid rgba(74,157,124,0.3)' : '1px solid var(--border-default)',
                cursor: 'pointer',
              }}
            >
              {p2Locked ? <><Lock size={9} /> Verrouillé</> : <><Unlock size={9} /> Verrouiller</>}
            </button>
          </div>
          <div className={`px-4 py-4 flex flex-col gap-4 transition-opacity ${p2Locked ? 'opacity-50 pointer-events-none' : ''}`}>
            <div>
              <span className="label-caps block mb-2" style={{ color: 'var(--text-tertiary)', fontSize: '9px' }}>Coussin prudentiel (CCyB)</span>
              <Stepper value={sharedPendingAction.ccybRate ?? 0} options={CCYB_OPTIONS.map(v => ({ value: v, label: CCYB_LABELS[v] ?? String(v) }))} onChange={v => store.setCoopAction({ ccybRate: v })} label="%" compact />
            </div>
            <div>
              <span className="label-caps block mb-2" style={{ color: 'var(--text-tertiary)', fontSize: '9px' }}>Intervention change</span>
              <Stepper value={sharedPendingAction.fxInterventionBnMad} options={FX_INTERVENTION_OPTIONS.map(v => ({ value: v, label: FX_LABELS[v] ?? String(v) }))} onChange={v => store.setCoopAction({ fxInterventionBnMad: v })} label="" />
            </div>
            <div>
              <span className="label-caps block mb-2" style={{ color: 'var(--text-tertiary)', fontSize: '9px' }}>Facilité prêt d&apos;urgence</span>
              <Stepper value={sharedPendingAction.emergencyLendingBnMad} options={EMERGENCY_LENDING_OPTIONS.map(v => ({ value: v, label: EMERGENCY_LABELS[v] ?? String(v) }))} onChange={v => store.setCoopAction({ emergencyLendingBnMad: v })} label="" />
            </div>
          </div>
        </div>
      </div>

      {/* Forward guidance — shared decision */}
      <div className="rounded-xl p-4 mb-6" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-default)' }}>
        <span className="label-caps block mb-2" style={{ color: 'var(--text-tertiary)' }}>Forward guidance (décision conjointe)</span>
        <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
          {GUIDANCE_OPTS.map(opt => (
            <button
              key={opt.value}
              onClick={() => store.setCoopAction({ communicationStance: opt.value })}
              className="flex-1 py-2 rounded text-xs font-semibold transition-all"
              style={{
                backgroundColor: sharedPendingAction.communicationStance === opt.value ? `${opt.color}18` : 'transparent',
                border: sharedPendingAction.communicationStance === opt.value ? `1px solid ${opt.color}40` : '1px solid transparent',
                color: sharedPendingAction.communicationStance === opt.value ? opt.color : 'var(--text-tertiary)',
                cursor: 'pointer',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lock status + Submit */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <span className="flex items-center gap-1 text-xs" style={{ color: p1Locked ? 'var(--data-positive)' : 'var(--text-tertiary)' }}>
          {p1Locked ? <Lock size={11} /> : <Unlock size={11} />} {player1.name}
        </span>
        <span style={{ color: 'var(--border-default)' }}>·</span>
        <span className="flex items-center gap-1 text-xs" style={{ color: p2Locked ? 'var(--data-positive)' : 'var(--text-tertiary)' }}>
          {p2Locked ? <Lock size={11} /> : <Unlock size={11} />} {player2.name}
        </span>
      </div>

      <motion.button
        onClick={handleSubmit}
        disabled={!bothLocked || submitting}
        whileHover={bothLocked && !submitting ? { scale: 1.02, y: -1 } : {}}
        className="w-full py-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
        style={{
          background: bothLocked ? 'linear-gradient(135deg, #4A9D7C 0%, #357A5E 100%)' : 'var(--bg-elevated)',
          color: bothLocked ? '#fff' : 'var(--text-tertiary)',
          border: 'none', cursor: bothLocked ? 'pointer' : 'not-allowed',
          boxShadow: bothLocked ? '0 4px 20px rgba(74,157,124,0.3)' : 'none',
        }}
      >
        {submitting ? <><Loader2 size={14} className="animate-spin" /> Calcul…</> : bothLocked ? <>Avancer le trimestre <ChevronRight size={16} /></> : <>Les deux joueurs doivent verrouiller</>}
      </motion.button>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// 3. TURN TRANSITION VIEW (Duel only)
// ══════════════════════════════════════════════════════════════════════════════

function TransitionView() {
  const store = useMultiplayerStore()
  const { player2 } = store

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col items-center justify-center text-center py-24"
    >
      <motion.div
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        className="mb-8"
      >
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'rgba(201,168,106,0.12)', border: '2px solid rgba(201,168,106,0.3)' }}>
          <Swords size={36} style={{ color: '#C9A86A' }} />
        </div>
      </motion.div>

      <h2 className="font-editorial text-3xl mb-3" style={{ color: 'var(--text-primary)' }}>Passage de relais</h2>
      <p className="text-base mb-2" style={{ color: 'var(--text-secondary)' }}>
        C&apos;est au tour de <strong style={{ color: '#C9A86A' }}>{player2.name}</strong>
      </p>
      <p className="text-sm mb-10 max-w-md" style={{ color: 'var(--text-tertiary)' }}>
        Passez l&apos;écran à votre adversaire. L&apos;état économique de {player2.name} lui sera présenté — aucun risque de triche.
      </p>

      <motion.button
        onClick={() => { store.proceedToNextPlayer(); sound.playTick() }}
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.97 }}
        className="px-12 py-4 rounded-xl font-semibold text-sm flex items-center gap-2 premium-shimmer-sweep"
        style={{
          background: 'linear-gradient(135deg, #C9A86A 0%, #A68A4F 100%)',
          color: '#fff', border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 24px rgba(201,168,106,0.35)',
        }}
      >
        {player2.name} est prêt(e)
        <ArrowRight size={16} />
      </motion.button>
    </motion.div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// CHARTS & TRAJECTORIES FOR MULTIPLAYER
// ══════════════════════════════════════════════════════════════════════════════

function ChartTooltip({ active, payload, label, p1Name, p2Name, mode, activeTab }: any) {
  if (!active || !payload?.length) return null
  const p1Val = payload.find((p: any) => p.dataKey === 'p1Value')?.value
  const p2Val = payload.find((p: any) => p.dataKey === 'p2Value')?.value

  const formatVal = (v: number | undefined | null) => {
    if (v === undefined || v === null) return '-'
    return activeTab === 'credibility' ? `${Math.round(v)}` : `${v.toFixed(2)} %`
  }

  return (
    <div className="rounded-lg p-3 text-xs shadow-2xl" style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
      <p className="font-mono mb-2" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
      {mode === 'duel' ? (
        <div className="flex flex-col gap-1.5 font-mono">
          <p style={{ color: '#5C7E92' }}>
            {p1Name} : <span className="font-bold">{formatVal(p1Val)}</span>
          </p>
          <p style={{ color: '#C9A86A' }}>
            {p2Name} : <span className="font-bold">{formatVal(p2Val)}</span>
          </p>
        </div>
      ) : (
        <p className="font-mono" style={{ color: '#4A9D7C' }}>
          Banque Commune : <span className="font-bold">{formatVal(p1Val)}</span>
        </p>
      )}
    </div>
  )
}

interface MultiplayerChartProps {
  p1History: EconomicState[]
  p1Current: EconomicState
  p2History: EconomicState[]
  p2Current: EconomicState | null
  p1Name: string
  p2Name: string
  mode: 'duel' | 'coop'
}

function MultiplayerChart({
  p1History,
  p1Current,
  p2History,
  p2Current,
  p1Name,
  p2Name,
  mode,
}: MultiplayerChartProps) {
  const [activeTab, setActiveTab] = useState<'inflation' | 'rate' | 'gdp' | 'credibility'>('inflation')

  const chartData = useMemo(() => {
    const data = []
    const p1All = [...p1History, p1Current]
    const p2All = mode === 'duel' && p2Current ? [...p2History, p2Current] : []
    const length = Math.max(p1All.length, p2All.length)

    for (let i = 0; i < length; i++) {
      const s1 = p1All[i]
      const s2 = p2All[i]
      data.push({
        name: `T${i}`,
        p1Value: s1 ? (
          activeTab === 'inflation' ? s1.inflation :
          activeTab === 'rate' ? s1.policyRate :
          activeTab === 'gdp' ? s1.gdpGrowth :
          s1.centralBankCredibility
        ) : null,
        p2Value: s2 ? (
          activeTab === 'inflation' ? s2.inflation :
          activeTab === 'rate' ? s2.policyRate :
          activeTab === 'gdp' ? s2.gdpGrowth :
          s2.centralBankCredibility
        ) : null,
      })
    }
    return data
  }, [p1History, p1Current, p2History, p2Current, activeTab, mode])

  const targetLine = useMemo(() => {
    if (activeTab === 'inflation') return 2.0
    if (activeTab === 'gdp') return 3.0
    return null
  }, [activeTab])

  const yDomain = useMemo(() => {
    if (activeTab === 'credibility') return [0, 100]
    return ['auto', 'auto']
  }, [activeTab])

  const tabs: { id: typeof activeTab; label: string; icon: any }[] = [
    { id: 'inflation', label: 'Inflation', icon: TrendingUp },
    { id: 'rate', label: 'Taux Directeur', icon: Percent },
    { id: 'gdp', label: 'Croissance PIB', icon: BarChart3 },
    { id: 'credibility', label: 'Crédibilité', icon: Shield },
  ]

  return (
    <div className="rounded-xl p-5 mb-6" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-default)' }}>
      {/* Selector Tabs */}
      <div className="flex flex-wrap gap-2 mb-4 justify-center">
        {tabs.map(t => {
          const Icon = t.icon
          const isActive = activeTab === t.id
          return (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id); sound.playTick() }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                backgroundColor: isActive ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                color: isActive ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                boxShadow: isActive ? '0 2px 8px rgba(180,25,35,0.2)' : 'none',
              }}
            >
              <Icon size={12} />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Chart container */}
      <div style={{ height: '220px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 9, fill: 'var(--text-tertiary)', fontFamily: 'monospace' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={yDomain}
              tick={{ fontSize: 9, fill: 'var(--text-tertiary)', fontFamily: 'monospace' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => activeTab === 'credibility' ? `${v}` : `${v}%`}
            />
            <Tooltip content={<ChartTooltip p1Name={p1Name} p2Name={p2Name} mode={mode} activeTab={activeTab} />} />
            {targetLine !== null && (
              <ReferenceLine y={targetLine} stroke="var(--accent-warm)" strokeDasharray="4 4" label={{ value: 'Cible', fill: 'var(--accent-warm)', fontSize: 9, position: 'insideTopRight' }} />
            )}
            <Line
              type="monotone"
              dataKey="p1Value"
              stroke={mode === 'duel' ? '#5C7E92' : '#4A9D7C'}
              strokeWidth={2.5}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              name={mode === 'duel' ? p1Name : 'Banque Commune'}
            />
            {mode === 'duel' && (
              <Line
                type="monotone"
                dataKey="p2Value"
                stroke="#C9A86A"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                name={p2Name}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center gap-6 mt-2 text-[10px] label-caps" style={{ color: 'var(--text-tertiary)' }}>
        {mode === 'duel' ? (
          <>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#5C7E92' }} />
              {p1Name}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#C9A86A' }} />
              {p2Name}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#4A9D7C' }} />
            Banque Commune ({p1Name} & {p2Name})
          </div>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// 4. QUARTER REVIEW VIEW (Duel only)
// ══════════════════════════════════════════════════════════════════════════════

function QuarterReviewView() {
  const store = useMultiplayerStore()
  const { duel, player1, player2, currentQuarterIndex } = store

  const p1 = duel.p1State
  const p2 = duel.p2State

  const comparisons = [
    { label: 'Inflation', p1: fmtPct(p1.inflation, 2), p2: fmtPct(p2.inflation, 2), p1v: p1.inflation, p2v: p2.inflation, target: INFLATION_TARGET, lowerBetter: true },
    { label: 'Croissance PIB', p1: fmtPct(p1.gdpGrowth, 2), p2: fmtPct(p2.gdpGrowth, 2), p1v: p1.gdpGrowth, p2v: p2.gdpGrowth, target: 3, lowerBetter: false },
    { label: 'Chômage', p1: fmtPct(p1.unemployment, 2), p2: fmtPct(p2.unemployment, 2), p1v: p1.unemployment, p2v: p2.unemployment, target: 10, lowerBetter: true },
    { label: 'Crédibilité', p1: `${Math.round(p1.centralBankCredibility)}`, p2: `${Math.round(p2.centralBankCredibility)}`, p1v: p1.centralBankCredibility, p2v: p2.centralBankCredibility, target: 80, lowerBetter: false },
    { label: 'Taux directeur', p1: fmtPct(p1.policyRate, 2), p2: fmtPct(p2.policyRate, 2), p1v: p1.policyRate, p2v: p2.policyRate, target: 2.5, lowerBetter: false },
    { label: 'Crédit', p1: fmtPct(p1.creditGrowth), p2: fmtPct(p2.creditGrowth), p1v: p1.creditGrowth, p2v: p2.creditGrowth, target: 5, lowerBetter: false },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center mb-8">
        <span className="label-caps block mb-2" style={{ color: 'var(--accent-warm)' }}>Bilan trimestriel</span>
        <h2 className="font-editorial text-2xl sm:text-3xl mb-2" style={{ color: 'var(--text-primary)' }}>
          Trimestre {currentQuarterIndex} — Comparaison
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          Voici comment vos deux économies divergent face aux mêmes chocs.
        </p>
      </div>

      <MultiplayerChart
        p1History={duel.p1History}
        p1Current={duel.p1State}
        p2History={duel.p2History}
        p2Current={duel.p2State}
        p1Name={player1.name}
        p2Name={player2.name}
        mode="duel"
      />

      {/* Comparison cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {comparisons.map((c, i) => {
          const p1Better = c.lowerBetter
            ? Math.abs(c.p1v - c.target) < Math.abs(c.p2v - c.target)
            : c.p1v > c.p2v
          const p2Better = !p1Better
          return (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-xl p-4"
              style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-default)' }}
            >
              <span className="label-caps block mb-3 text-center" style={{ color: 'var(--text-tertiary)', fontSize: '9px' }}>{c.label}</span>
              <div className="flex items-center justify-between">
                <div className="text-center flex-1">
                  <div className="w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center text-xs font-bold" style={{ backgroundColor: p1Better ? 'rgba(74,157,124,0.15)' : 'var(--bg-elevated)', color: p1Better ? 'var(--data-positive)' : 'var(--text-tertiary)', border: p1Better ? '1px solid rgba(74,157,124,0.3)' : '1px solid var(--border-subtle)' }}>
                    {p1Better && '✓'}
                  </div>
                  <span className="font-mono text-sm font-bold tabular block" style={{ color: p1Better ? 'var(--data-positive)' : 'var(--text-primary)' }}>{c.p1}</span>
                  <span className="text-[9px]" style={{ color: '#5C7E92' }}>{player1.name}</span>
                </div>
                <span className="text-xs font-bold" style={{ color: 'var(--text-tertiary)' }}>vs</span>
                <div className="text-center flex-1">
                  <div className="w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center text-xs font-bold" style={{ backgroundColor: p2Better ? 'rgba(74,157,124,0.15)' : 'var(--bg-elevated)', color: p2Better ? 'var(--data-positive)' : 'var(--text-tertiary)', border: p2Better ? '1px solid rgba(74,157,124,0.3)' : '1px solid var(--border-subtle)' }}>
                    {p2Better && '✓'}
                  </div>
                  <span className="font-mono text-sm font-bold tabular block" style={{ color: p2Better ? 'var(--data-positive)' : 'var(--text-primary)' }}>{c.p2}</span>
                  <span className="text-[9px]" style={{ color: '#C9A86A' }}>{player2.name}</span>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      <motion.button
        onClick={() => { store.proceedFromReview(); sound.playTick() }}
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 premium-shimmer-sweep"
        style={{
          background: 'linear-gradient(135deg, #C41923 0%, #8B131B 100%)',
          color: '#fff', border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 24px rgba(180,25,35,0.3)',
        }}
      >
        Trimestre suivant <ChevronRight size={16} />
      </motion.button>
    </motion.div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// 5. FINISHED VIEW
// ══════════════════════════════════════════════════════════════════════════════

function FinishedView() {
  const router = useRouter()
  const store = useMultiplayerStore()
  const { mode, player1, player2, duel, coop } = store

  const scores = mode === 'duel' ? store.getScores() : null
  const coopScore = mode === 'coop' ? store.getCoopScore() : null
  const badges = store.getBadges()

  useEffect(() => { sound.playSuccess() }, [])

  if (mode === 'duel' && scores) {
    const winner = scores.p1.total > scores.p2.total ? 'p1' : scores.p2.total > scores.p1.total ? 'p2' : 'tie'
    const winnerName = winner === 'p1' ? player1.name : winner === 'p2' ? player2.name : 'Égalité'
    const winnerColor = winner === 'p1' ? '#5C7E92' : winner === 'p2' ? '#C9A86A' : 'var(--text-primary)'

    return (
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
        {/* Winner announcement */}
        <div className="text-center mb-10">
          <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 2, repeat: Infinity }} className="mb-4">
            <Crown size={48} style={{ color: '#C9A86A', margin: '0 auto' }} />
          </motion.div>
          <span className="label-caps block mb-2" style={{ color: 'var(--accent-warm)' }}>Résultat du Duel</span>
          <h1 className="font-editorial text-4xl sm:text-5xl mb-3" style={{ color: winnerColor }}>
            {winner === 'tie' ? 'Égalité parfaite !' : `${winnerName} l'emporte !`}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            {winner === 'tie' ? 'Les deux gouverneurs ont obtenu un score identique.' : `Avec un score de ${winner === 'p1' ? scores.p1.total : scores.p2.total} contre ${winner === 'p1' ? scores.p2.total : scores.p1.total} points.`}
          </p>
        </div>

        {/* Score comparison */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {[
            { name: player1.name, score: scores.p1, color: '#5C7E92', isWinner: winner === 'p1' },
            { name: player2.name, score: scores.p2, color: '#C9A86A', isWinner: winner === 'p2' },
          ].map(p => (
            <div
              key={p.name}
              className="rounded-xl p-6 text-center relative overflow-hidden"
              style={{
                backgroundColor: 'var(--bg-panel)',
                border: p.isWinner ? `2px solid ${p.color}` : '1px solid var(--border-default)',
                boxShadow: p.isWinner ? `0 8px 32px ${p.color}20` : 'none',
              }}
            >
              {p.isWinner && (
                <div className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, ${p.color}, transparent)` }} />
              )}
              <span className="label-caps block mb-2" style={{ color: p.color }}>{p.name}</span>
              <span className="font-editorial block" style={{ fontSize: 'clamp(3rem, 8vw, 5rem)', color: GRADE_COLORS[p.score.grade] ?? 'var(--text-primary)', lineHeight: 1 }}>
                {p.score.grade}
              </span>
              <span className="font-editorial-roman block text-2xl mt-1" style={{ color: 'var(--text-primary)' }}>
                {p.score.total} / 100
              </span>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {[
                  { l: 'Prix', v: p.score.inflation },
                  { l: 'Crois.', v: p.score.growth },
                  { l: 'Stab.', v: p.score.stability },
                  { l: 'Créd.', v: p.score.credibility },
                ].map(s => (
                  <div key={s.l} className="rounded p-2" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                    <span className="label-caps block" style={{ fontSize: '7px' }}>{s.l}</span>
                    <span className="font-mono text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{s.v}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Final Trajectory Chart */}
        <div className="mb-8">
          <span className="label-caps block mb-4 text-center" style={{ color: 'var(--accent-warm)' }}>📈 Analyse des Trajectoires Historiques</span>
          <MultiplayerChart
            p1History={duel.p1History}
            p1Current={duel.p1State}
            p2History={duel.p2History}
            p2Current={duel.p2State}
            p1Name={player1.name}
            p2Name={player2.name}
            mode="duel"
          />
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <div className="mb-8">
            <span className="label-caps block mb-4 text-center" style={{ color: 'var(--accent-warm)' }}>🏅 Distinctions du Duel</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {badges.map((b, i) => (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="rounded-lg p-4 flex items-start gap-3"
                  style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-subtle)' }}
                >
                  <span className="text-2xl">{b.emoji}</span>
                  <div>
                    <span className="block font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>{b.label}</span>
                    <span className="block text-[10px] mb-1" style={{ color: b.player === 'p1' ? '#5C7E92' : '#C9A86A' }}>
                      {b.player === 'p1' ? player1.name : player2.name}
                    </span>
                    <span className="block text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{b.description}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => { store.reset() }}
            className="px-8 py-3 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all"
            style={{ background: 'linear-gradient(135deg, #C41923 0%, #8B131B 100%)', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(180,25,35,0.25)' }}
          >
            <RotateCcw size={14} /> Rejouer
          </button>
          <button
            onClick={() => { store.reset(); router.push('/dashboard') }}
            className="px-8 py-3 rounded-lg font-semibold text-sm transition-all"
            style={{ backgroundColor: 'var(--bg-panel)', color: 'var(--text-primary)', border: '1px solid var(--border-default)', cursor: 'pointer' }}
          >
            Retour au dashboard
          </button>
        </div>
      </motion.div>
    )
  }

  // ── Coop finished ──
  if (mode === 'coop' && coopScore) {
    return (
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
        <div className="text-center mb-10">
          <Handshake size={48} style={{ color: '#4A9D7C', margin: '0 auto 16px' }} />
          <span className="label-caps block mb-2" style={{ color: '#4A9D7C' }}>Résultat de la Co-Gouvernance</span>
          <h1 className="font-editorial text-4xl sm:text-5xl mb-2" style={{ color: GRADE_COLORS[coopScore.grade] ?? 'var(--text-primary)' }}>
            {coopScore.grade}
          </h1>
          <p className="font-editorial-roman text-2xl" style={{ color: 'var(--text-primary)' }}>{coopScore.total} / 100</p>
          <p className="text-sm mt-4 max-w-lg mx-auto" style={{ color: 'var(--text-secondary)' }}>{coopScore.commentary}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 max-w-2xl mx-auto">
          {[
            { l: 'Stabilité prix', v: coopScore.inflation, max: 35 },
            { l: 'Croissance', v: coopScore.growth, max: 25 },
            { l: 'Stabilité', v: coopScore.stability, max: 20 },
            { l: 'Crédibilité', v: coopScore.credibility, max: 20 },
          ].map(s => (
            <div key={s.l} className="rounded-lg p-4 text-center" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-subtle)' }}>
              <span className="label-caps block mb-2" style={{ fontSize: '8px' }}>{s.l}</span>
              <span className="font-editorial-roman text-xl block" style={{ color: 'var(--text-primary)' }}>{s.v}</span>
              <span className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>/ {s.max}</span>
            </div>
          ))}
        </div>

        {/* Final Trajectory Chart (Coop) */}
        <div className="mb-8 max-w-2xl mx-auto">
          <span className="label-caps block mb-4 text-center" style={{ color: '#4A9D7C' }}>📈 Évolution des Indicateurs de Co-Gouvernance</span>
          <MultiplayerChart
            p1History={coop.sharedHistory}
            p1Current={coop.sharedState}
            p2History={[]}
            p2Current={null}
            p1Name={player1.name}
            p2Name={player2.name}
            mode="coop"
          />
        </div>

        {badges.length > 0 && (
          <div className="mb-8 max-w-2xl mx-auto">
            <span className="label-caps block mb-3 text-center" style={{ color: '#4A9D7C' }}>🏅 Distinctions de l&apos;équipe</span>
            <div className="flex flex-wrap gap-3 justify-center">
              {badges.map((b, i) => (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="rounded-lg px-4 py-3 flex items-center gap-2"
                  style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-subtle)' }}
                >
                  <span className="text-xl">{b.emoji}</span>
                  <div>
                    <span className="block font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>{b.label}</span>
                    <span className="block text-[9px]" style={{ color: 'var(--text-tertiary)' }}>{b.description}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => { store.reset() }}
            className="px-8 py-3 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all"
            style={{ background: 'linear-gradient(135deg, #4A9D7C 0%, #357A5E 100%)', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(74,157,124,0.25)' }}
          >
            <RotateCcw size={14} /> Rejouer
          </button>
          <button
            onClick={() => { store.reset(); router.push('/dashboard') }}
            className="px-8 py-3 rounded-lg font-semibold text-sm transition-all"
            style={{ backgroundColor: 'var(--bg-panel)', color: 'var(--text-primary)', border: '1px solid var(--border-default)', cursor: 'pointer' }}
          >
            Retour au dashboard
          </button>
        </div>
      </motion.div>
    )
  }

  return null
}
