'use client'

import { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Trophy, TrendingUp, Target, BarChart3, LogOut,
  Clock, Star, ChevronRight, Award, History, GraduationCap, Users,
  Sliders, ShieldAlert, LayoutDashboard, Swords, Compass,
  Bot, Crosshair, Radio, Flame, PlayCircle,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useGameStore } from '@/store/gameStore'
import { SCENARIOS } from '@/engine/scenarios'
import { ThemeToggle } from '@/components/shell/ThemeToggle'
import { PerformanceRadar } from '@/components/ui/PerformanceRadar'
import { fmtPct } from '@/lib/format'
import type { ScenarioId, DifficultyLevel } from '@/engine/state'
import { AssistantBot } from '@/components/ui/AssistantBot'
import { DASHBOARD_MESSAGES } from '@/engine/botMessages'
import { sound } from '@/lib/audio'

const ScoreProgressChart = dynamic(
  () => import('@/components/ui/ScoreProgressChart').then(m => ({ default: m.ScoreProgressChart })),
  { ssr: false }
)

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
  const [activeView, setActiveView] = useState<'scenarios' | 'leaderboard'>('scenarios')
  const [isStarting, setIsStarting] = useState(false)

  const currentUser = useAuthStore(s => s.currentUser)
  const getCurrentPlayer = useAuthStore(s => s.getCurrentPlayer)
  const getPlayerStats = useAuthStore(s => s.getPlayerStats)
  const logout = useAuthStore(s => s.logout)
  const startGame = useGameStore(s => s.startGame)
  const freeMode = useGameStore(s => s.freeMode)
  const setFreeMode = useGameStore(s => s.setFreeMode)
  const difficultyLevel = useGameStore(s => s.difficultyLevel)
  const setDifficultyLevel = useGameStore(s => s.setDifficultyLevel)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (mounted && !currentUser) {
      router.push('/login')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, currentUser])

  const player = useMemo(() => mounted ? getCurrentPlayer() : null, [mounted, getCurrentPlayer])
  const stats = useMemo(() => mounted ? getPlayerStats() : null, [mounted, getPlayerStats])

  const leaderboard = useMemo(() => {
    const userBest = stats ? stats.bestScore : 0
    const competitors = [
      { name: 'Abdellatif Jouahri', score: 96, title: "Gouverneur de Légende", avatar: "🇲🇦" },
      { name: 'Taylor Rule Bot', score: 91, title: "Gouverneur d'Or", avatar: "🤖" },
      { name: 'Ilyass E.', score: 87, title: "Gouverneur d'Or", avatar: "👨‍💻" },
      { name: 'Prof. Alami', score: 82, title: "Gouverneur d'Argent", avatar: "👨‍🏫" },
      { name: 'Claude Sonnet', score: 78, title: "Gouverneur d'Argent", avatar: "🦾" },
      { name: 'Simulation Rookie', score: 52, title: "Stagiaire au guichet", avatar: "👶" },
    ]
    
    if (userBest > 0) {
      let userTitle = "Stagiaire au guichet"
      if (userBest >= 90) userTitle = "Gouverneur de Platine"
      else if (userBest >= 80) userTitle = "Gouverneur d'Or"
      else if (userBest >= 70) userTitle = "Gouverneur d'Argent"
      else if (userBest >= 50) userTitle = "Gouverneur de Bronze"

      competitors.push({
        name: `${player?.pseudo} (Vous)`,
        score: userBest,
        title: userTitle,
        avatar: "👑"
      })
    }
    
    return competitors.sort((a, b) => b.score - a.score)
  }, [stats, player])


  if (!mounted || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-base)' }}>
        <p className="label-caps" style={{ color: 'var(--text-tertiary)' }}>Chargement…</p>
      </div>
    )
  }

  const handleStart = async () => {
    if (isStarting) return
    setIsStarting(true)
    await startGame(selected, difficultyLevel)
    router.push('/play')
  }

  const scenarios = Object.values(SCENARIOS)
  const selectedScenario = SCENARIOS[selected]
  const selectedMeta = DIFFICULTY_META[selectedScenario.difficulty]
  const initialState = selectedScenario.initialState
  const gameHistory = player?.gameHistory ?? []
  const riskScore = Math.min(100, Math.round(
    Math.abs(initialState.inflation - 2) * 10 +
    Math.abs(initialState.outputGap) * 7 +
    Math.max(0, initialState.nplRatio - 5) * 5 +
    selectedScenario.initialShocks.length * 12 +
    (selectedScenario.difficulty === 'crisis' ? 22 : selectedScenario.difficulty === 'hard' ? 12 : 4) +
    (100 - initialState.centralBankCredibility) * 0.18
  ))
  const riskColor = riskScore >= 70 ? '#C25450' : riskScore >= 45 ? '#C9A86A' : '#4A9D7C'
  const riskLabel = riskScore >= 70 ? 'Crise ouverte' : riskScore >= 45 ? 'Tension elevee' : 'Mandat stable'
  const mandateVitals = [
    { label: 'Inflation', value: `${initialState.inflation.toFixed(2)} %`, color: initialState.inflation > 4 ? '#C25450' : initialState.inflation < 1 ? '#C9A86A' : '#4A9D7C' },
    { label: 'Output gap', value: `${initialState.outputGap.toFixed(2)} %`, color: Math.abs(initialState.outputGap) > 2 ? '#C25450' : '#5C7E92' },
    { label: 'NPL', value: `${initialState.nplRatio.toFixed(1)} %`, color: initialState.nplRatio > 8 ? '#C25450' : '#4A9D7C' },
    { label: 'Credibilite', value: `${initialState.centralBankCredibility}/100`, color: initialState.centralBankCredibility < 55 ? '#C25450' : '#C9A86A' },
  ]
  const missionObjectives = [
    'Ramener l inflation vers la cible sans casser l activite.',
    'Preserver la credibilite de la banque centrale.',
    'Surveiller les risques bancaires et les chocs initiaux.',
  ]

  const askScenarioCoach = () => {
    sound.playTick()
    window.dispatchEvent(new CustomEvent('open-cbs-assistant', {
      detail: {
        query: `Explique-moi le scenario "${selectedScenario.title}" en niveau ${difficultyLevel}. Donne-moi les risques, les objectifs et une strategie initiale claire.`,
      },
    }))
  }

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
          <a href="/decouverte" className="label-caps flex items-center gap-1" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '11px' }}>
            <Compass size={12} style={{ color: 'var(--accent-warm)' }} /> Découverte
          </a>
          <span style={{ color: 'var(--border-default)' }}>·</span>
          <a href="/courses" className="label-caps flex items-center gap-1" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '11px' }}>
            <GraduationCap size={12} /> Cours
          </a>
          <span style={{ color: 'var(--border-default)' }}>·</span>
          <a href="/training" className="label-caps flex items-center gap-1" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '11px' }}>
            <Sliders size={12} style={{ color: 'var(--accent-cool)' }} /> Entraînement
          </a>
          <span style={{ color: 'var(--border-default)' }}>·</span>
          <a href="/dashboard" className="label-caps flex items-center gap-1 font-bold text-[var(--text-primary)]" style={{ textDecoration: 'none', fontSize: '11px' }}>
            <LayoutDashboard size={12} style={{ color: 'var(--accent-warm)' }} /> Simulation
          </a>
          <span style={{ color: 'var(--border-default)' }}>·</span>
          <a href="/players" className="label-caps flex items-center gap-1" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '11px' }}>
            <Users size={12} /> Joueurs
          </a>
          <span style={{ color: 'var(--border-default)' }}>·</span>
          <a href="/multiplayer" className="label-caps flex items-center gap-1" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '11px' }}>
            <Swords size={12} style={{ color: '#C25450' }} /> Multijoueur
          </a>
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

          {/* ══════ LEFT: SCENARIO PICKER & LEADERBOARD ══════ */}
          <motion.div
            className="lg:col-span-2"
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.15 }}
          >
            {/* TAB SELECTORS */}
            <div className="flex items-center gap-6 mb-6 border-b border-[var(--border-subtle)] pb-1.5 text-left">
              <button
                type="button"
                onClick={() => { setActiveView('scenarios'); sound.playTick(); }}
                className="label-caps pb-2.5 px-1 transition-all"
                style={{
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  borderBottom: activeView === 'scenarios' ? '2.5px solid var(--accent-primary)' : '2.5px solid transparent',
                  color: activeView === 'scenarios' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  fontWeight: activeView === 'scenarios' ? 700 : 500,
                  background: 'none', cursor: 'pointer', fontSize: '11px', letterSpacing: '0.12em'
                }}
              >
                🎮 Scénarios de Mandat
              </button>
              <button
                type="button"
                onClick={() => { setActiveView('leaderboard'); sound.playTick(); }}
                className="label-caps pb-2.5 px-1 transition-all"
                style={{
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  borderBottom: activeView === 'leaderboard' ? '2.5px solid var(--accent-primary)' : '2.5px solid transparent',
                  color: activeView === 'leaderboard' ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  fontWeight: activeView === 'leaderboard' ? 700 : 500,
                  background: 'none', cursor: 'pointer', fontSize: '11px', letterSpacing: '0.12em'
                }}
              >
                🏆 Classement Général
              </button>
            </div>

            {activeView === 'scenarios' ? (
              <>
                <motion.div
                  className="rounded-lg p-4 mb-4 overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${riskColor}16 0%, rgba(255,255,255,0.02) 48%, rgba(92,126,146,0.10) 100%)`,
                    border: `1px solid ${riskColor}44`,
                  }}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-5 items-stretch">
                    <div className="flex flex-col justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Radio size={14} style={{ color: riskColor }} />
                          <span className="label-caps" style={{ color: riskColor }}>Briefing de mission</span>
                        </div>
                        <h2 className="font-editorial-roman text-2xl mb-2" style={{ color: 'var(--text-primary)' }}>
                          {selectedScenario.title}
                        </h2>
                        <p className="text-xs leading-relaxed max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
                          {selectedScenario.descriptionByLevel[difficultyLevel] || selectedScenario.description}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {missionObjectives.map((objective, index) => (
                          <span
                            key={objective}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px]"
                            style={{ backgroundColor: 'var(--bg-panel)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
                          >
                            <Crosshair size={11} style={{ color: index === 0 ? '#B41923' : index === 1 ? '#C9A86A' : '#5C7E92' }} />
                            {objective}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-[140px_minmax(0,1fr)] gap-4">
                      <div className="rounded-lg p-3 flex flex-col items-center justify-center" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-default)' }}>
                        <div
                          className="w-24 h-24 rounded-full flex items-center justify-center"
                          style={{ background: `conic-gradient(${riskColor} ${riskScore}%, rgba(255,255,255,0.10) 0)` }}
                        >
                          <div className="w-[72px] h-[72px] rounded-full flex flex-col items-center justify-center" style={{ backgroundColor: 'var(--bg-base)' }}>
                            <Flame size={18} style={{ color: riskColor }} />
                            <span className="font-mono text-lg tabular" style={{ color: 'var(--text-primary)' }}>{riskScore}</span>
                          </div>
                        </div>
                        <span className="label-caps mt-2 text-center" style={{ color: riskColor }}>{riskLabel}</span>
                      </div>

                      <div className="min-w-0 flex flex-col gap-3">
                        <div className="grid grid-cols-2 gap-2">
                          {mandateVitals.map(vital => (
                            <div key={vital.label} className="rounded-lg p-2.5 min-w-0 overflow-hidden" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-subtle)' }}>
                              <span className="label-caps block mb-1 truncate" style={{ fontSize: '8px', color: 'var(--text-tertiary)' }}>{vital.label}</span>
                              <span className="font-mono text-xs sm:text-sm font-bold tabular block truncate" style={{ color: vital.color }}>{vital.value}</span>
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={askScenarioCoach}
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-bold"
                            style={{ backgroundColor: 'var(--bg-panel)', color: 'var(--text-primary)', border: '1px solid var(--border-default)', cursor: 'pointer' }}
                          >
                            <Bot size={14} />
                            Expliquer
                          </button>
                          <button
                            type="button"
                            onClick={handleStart}
                            disabled={isStarting}
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-bold"
                            style={{ backgroundColor: riskColor, color: '#fff', border: 'none', cursor: isStarting ? 'wait' : 'pointer', opacity: isStarting ? 0.8 : 1 }}
                          >
                            <PlayCircle size={14} />
                            Lancer
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {scenarios.map(sc => {
                    const isSelected = sc.id === selected
                    const meta = DIFFICULTY_META[sc.difficulty]
                    return (
                      <button
                        key={sc.id}
                        type="button"
                        onClick={() => { setSelected(sc.id); sound.playTick(); }}
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

                {/* Difficulty Level Selector */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-subtle)' }}>
                  <div className="flex items-center gap-2">
                    <Target size={16} style={{ color: 'var(--accent-primary)' }} />
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                      Difficulté de la Simulation :
                    </span>
                  </div>
                  <div className="flex rounded-lg overflow-hidden p-0.5" style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-default)' }}>
                    {(['beginner', 'intermediate', 'expert'] as DifficultyLevel[]).map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setDifficultyLevel(lvl)}
                        className="px-4 py-1.5 rounded-md text-xs font-semibold transition-all"
                        style={{
                          backgroundColor: difficultyLevel === lvl ? 'var(--accent-primary)' : 'transparent',
                          color: difficultyLevel === lvl ? '#fff' : 'var(--text-secondary)',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        {lvl === 'beginner' ? '🌱 Débutant' : lvl === 'intermediate' ? '📈 Intermédiaire' : '🎯 Expert'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fiche de Conjoncture Initiale */}
                <div
                  className="rounded-xl p-5 mb-5 transition-all duration-300"
                  style={{
                    backgroundColor: 'var(--bg-panel)',
                    border: '1px solid var(--border-default)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                  }}
                >
                  {/* Header de la Fiche */}
                  <div className="flex items-center justify-between border-b pb-3 mb-4 text-left" style={{ borderColor: 'var(--border-subtle)' }}>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full animate-pulse-soft" style={{ backgroundColor: selectedMeta.color }} />
                      <span className="label-caps font-semibold tracking-wider text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                        FICHE DE CONJONCTURE INITIALE
                      </span>
                    </div>
                    <span className="font-mono text-[9px] px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-tertiary)', border: '1px solid var(--border-subtle)' }}>
                      Scénario : {SCENARIOS[selected].title}
                    </span>
                  </div>

                  {/* Contenu principal en grille */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                    {/* 1. Mètres de conjoncture (MD: 5) */}
                    <div className="md:col-span-5 flex flex-col gap-2 justify-center border-b md:border-b-0 md:border-r pb-4 md:pb-0 md:pr-4" style={{ borderColor: 'var(--border-subtle)' }}>
                      <span className="label-caps font-semibold text-[8px] mb-2 text-left" style={{ color: 'var(--text-tertiary)' }}>
                        INDICATEURS MACRO DE DÉPART
                      </span>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 rounded bg-[var(--bg-base)] border border-[var(--border-subtle)] text-left">
                          <span className="block text-[8px] label-caps" style={{ color: 'var(--text-tertiary)' }}>Inflation</span>
                          <span className="font-mono text-sm font-semibold" style={{ color: SCENARIOS[selected].initialState.inflation > 4 ? 'var(--data-negative)' : SCENARIOS[selected].initialState.inflation < 1.5 ? 'var(--data-neutral)' : 'var(--data-positive)' }}>
                            {SCENARIOS[selected].initialState.inflation.toFixed(2)} %
                          </span>
                        </div>

                        <div className="p-2 rounded bg-[var(--bg-base)] border border-[var(--border-subtle)] text-left">
                          <span className="block text-[8px] label-caps" style={{ color: 'var(--text-tertiary)' }}>Croissance PIB</span>
                          <span className="font-mono text-sm font-semibold" style={{ color: SCENARIOS[selected].initialState.gdpGrowth > 0 ? 'var(--data-positive)' : 'var(--data-negative)' }}>
                            {SCENARIOS[selected].initialState.gdpGrowth.toFixed(2)} %
                          </span>
                        </div>

                        <div className="p-2 rounded bg-[var(--bg-base)] border border-[var(--border-subtle)] text-left">
                          <span className="block text-[8px] label-caps" style={{ color: 'var(--text-tertiary)' }}>Taux Directeur</span>
                          <span className="font-mono text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {SCENARIOS[selected].initialState.policyRate.toFixed(2)} %
                          </span>
                        </div>

                        <div className="p-2 rounded bg-[var(--bg-base)] border border-[var(--border-subtle)] text-left">
                          <span className="block text-[8px] label-caps" style={{ color: 'var(--text-tertiary)' }}>Crédibilité</span>
                          <span className="font-mono text-sm font-semibold" style={{ color: 'var(--accent-warm)' }}>
                            {SCENARIOS[selected].initialState.centralBankCredibility} / 100
                          </span>
                        </div>
                      </div>

                      <div className="p-2 rounded bg-[var(--bg-base)] border border-[var(--border-subtle)] text-left mt-1">
                        <div className="flex justify-between items-center text-[8px] label-caps mb-1" style={{ color: 'var(--text-tertiary)' }}>
                          <span>Impact des chocs initiaux</span>
                          <span className="font-mono font-bold" style={{ color: SCENARIOS[selected].initialShocks.length > 0 ? 'var(--data-negative)' : 'var(--data-positive)' }}>
                            {SCENARIOS[selected].initialShocks.length > 0 ? 'ACTIF' : 'AUCUN'}
                          </span>
                        </div>
                        <p className="text-[10px] leading-tight" style={{ color: 'var(--text-secondary)' }}>
                          {SCENARIOS[selected].initialShocks.length > 0 
                            ? SCENARIOS[selected].initialShocks[0].label + ' : ' + SCENARIOS[selected].initialShocks[0].description
                            : 'Aucun choc majeur en cours.'}
                        </p>
                      </div>
                    </div>

                    {/* 2. Analyse éditoriale & Conseils (MD: 7) */}
                    <div className="md:col-span-7 flex flex-col justify-between gap-3 text-left">
                      <div>
                        <span className="label-caps font-semibold text-[8px] block mb-1" style={{ color: 'var(--text-tertiary)' }}>
                          ANALYSE DE CONJONCTURE ({difficultyLevel === 'beginner' ? 'DÉBUTANT' : difficultyLevel === 'intermediate' ? 'INTERMÉDIAIRE' : 'EXPERT'})
                        </span>
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-primary)', fontStyle: 'italic' }}>
                          &ldquo;{SCENARIOS[selected].descriptionByLevel[difficultyLevel] || SCENARIOS[selected].description}&rdquo;
                        </p>
                      </div>

                      {/* Règle de scoring & Spécificités du niveau */}
                      <div className="p-3 rounded-lg border text-[11px] leading-relaxed" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'var(--border-subtle)' }}>
                        <span className="font-semibold block mb-1" style={{ color: 'var(--text-primary)' }}>Règles du niveau {difficultyLevel === 'beginner' ? 'Débutant' : difficultyLevel === 'intermediate' ? 'Intermédiaire' : 'Expert'} :</span>
                        <ul className="list-disc list-inside space-y-0.5 text-xs text-[var(--text-secondary)]" style={{ color: 'var(--text-secondary)' }}>
                          {difficultyLevel === 'beginner' ? (
                            <>
                              <li><span style={{ color: 'var(--data-positive)', fontWeight: 600 }}>Scoring indulgent :</span> Écarts mineurs tolérés.</li>
                              <li><span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Instruments simplifiés :</span> Taux directeur uniquement.</li>
                              <li><span style={{ color: 'var(--accent-cool)', fontWeight: 600 }}>Chocs modérés :</span> 16 trimestres de simulation.</li>
                            </>
                          ) : difficultyLevel === 'intermediate' ? (
                            <>
                              <li><span style={{ color: 'var(--accent-warm)', fontWeight: 600 }}>Scoring standard :</span> Pondération stricte de la crédibilité.</li>
                              <li><span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Instruments avancés :</span> Forward guidance, réserves, CCyB.</li>
                              <li><span style={{ color: 'var(--accent-cool)', fontWeight: 600 }}>Chocs stochastiques :</span> 20 trimestres de simulation.</li>
                            </>
                          ) : (
                            <>
                              <li><span style={{ color: 'var(--data-negative)', fontWeight: 600 }}>Scoring institutionnel :</span> Zéro marge d'erreur, pass-through accentué.</li>
                              <li><span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Arsenal complet :</span> Tous les leviers de politique monétaire activés.</li>
                              <li><span style={{ color: 'var(--accent-cool)', fontWeight: 600 }}>Chocs sévères :</span> 25 trimestres. Pas de conseils en cours de jeu.</li>
                            </>
                          )}
                        </ul>
                      </div>

                      {/* Conseils de l'Assistant CBS */}
                      {SCENARIOS[selected].hintsByLevel[difficultyLevel] && SCENARIOS[selected].hintsByLevel[difficultyLevel].length > 0 && (
                        <div className="rounded-lg p-2.5 text-xs" style={{ backgroundColor: 'rgba(201, 168, 106, 0.06)', border: '1px solid rgba(201, 168, 106, 0.15)', color: 'var(--text-secondary)' }}>
                          <span className="font-semibold block mb-1" style={{ color: 'var(--accent-warm)' }}>Recommandations stratégiques de l'Assistant CBS :</span>
                          <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                            {SCENARIOS[selected].hintsByLevel[difficultyLevel].map((hint, i) => (
                              <li key={i}>{hint}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
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
                  disabled={isStarting}
                  className="w-full py-4 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200"
                  style={{
                    background: 'linear-gradient(135deg, #C41923 0%, #8B131B 100%)',
                    color: '#fff', border: 'none', cursor: isStarting ? 'wait' : 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2), 0 4px 20px rgba(180,25,35,0.3)',
                    opacity: isStarting ? 0.8 : 1,
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
                  {isStarting ? 'Synchronisation BKAM...' : 'Commencer la partie'}
                  <ChevronRight size={16} />
                </button>
              </>
            ) : (
              <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-default)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
                <div className="flex items-center justify-between border-b pb-3 mb-4 text-left" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="flex items-center gap-2">
                    <Trophy size={14} style={{ color: 'var(--accent-warm)' }} />
                    <span className="label-caps font-semibold tracking-wider text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                      PALMARÈS DES GOUVERNEURS CBS
                    </span>
                  </div>
                  <span className="font-mono text-[9px] px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-tertiary)', border: '1px solid var(--border-subtle)' }}>
                    Mode Compétitif Actif
                  </span>
                </div>

                <div className="flex flex-col gap-2.5">
                  {leaderboard.map((item, idx) => {
                    const isUser = item.name.includes('(Vous)')
                    const rank = idx + 1
                    const isTop3 = rank <= 3
                    const rankColor = rank === 1 ? '#D4AF37' : rank === 2 ? '#C0C0C0' : rank === 3 ? '#CD7F32' : 'var(--text-tertiary)'
                    const bgGradient = isUser 
                      ? 'linear-gradient(135deg, rgba(180, 25, 35, 0.08) 0%, rgba(201, 168, 106, 0.04) 100%)' 
                      : 'var(--bg-elevated)'

                    return (
                      <motion.div
                        key={item.name}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05, duration: 0.3 }}
                        className="rounded-lg p-3.5 flex items-center justify-between transition-all"
                        style={{
                          background: bgGradient,
                          border: isUser ? '1px solid var(--accent-warm)' : '1px solid var(--border-subtle)',
                          boxShadow: isUser ? '0 4px 16px rgba(180,25,35,0.08)' : 'none'
                        }}
                      >
                        <div className="flex items-center gap-3.5 text-left">
                          {/* Rank Badge */}
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center font-editorial font-bold shadow-sm"
                            style={{
                              backgroundColor: isTop3 ? rankColor + '20' : 'var(--bg-base)',
                              border: `1px solid ${isTop3 ? rankColor : 'var(--border-subtle)'}`,
                              color: isTop3 ? rankColor : 'var(--text-secondary)',
                              fontSize: '13px'
                            }}
                          >
                            {rank}
                          </div>
                          {/* Avatar */}
                          <span className="text-xl">{item.avatar}</span>
                          <div>
                            <p className={`text-sm font-semibold m-0 ${isUser ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}`}>
                              {item.name}
                            </p>
                            <p className="text-[10px] label-caps tracking-wider text-[var(--text-tertiary)] m-0">
                              {item.title}
                            </p>
                          </div>
                        </div>

                        {/* Score */}
                        <div className="text-right">
                          <span className="font-editorial-roman text-xl font-bold block" style={{ color: isUser ? 'var(--accent-primary)' : 'var(--text-secondary)', lineHeight: 1 }}>
                            {item.score}
                          </span>
                          <span className="text-[9px] font-mono uppercase text-[var(--text-tertiary)]">points</span>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>

                {/* Message de motivation */}
                <div className="mt-5 p-3 rounded-lg border text-[11px] leading-relaxed text-left" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'var(--border-subtle)' }}>
                  <span className="font-semibold block mb-1 text-[var(--text-primary)]">🚀 Améliorez votre classement :</span>
                  <p className="text-[11px] text-[var(--text-secondary)] m-0">
                    Chaque partie terminée avec un score élevé met immédiatement à jour votre classement. Battez le score de 96 points du gouverneur <strong>Abdellatif Jouahri</strong> pour inscrire votre nom tout en haut de la Légende CBS !
                  </p>
                </div>
              </div>
            )}
          </motion.div>


          {/* ══════ RIGHT: GAME HISTORY ══════ */}
          <motion.div
            className="lg:col-span-1"
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="label-caps" style={{ color: 'var(--accent-warm)' }}>Historique des parties</h2>
              {gameHistory.length > 0 && (
                <a
                  href="/history"
                  className="label-caps flex items-center gap-1 px-2 py-1 rounded"
                  style={{ color: 'var(--accent-warm)', backgroundColor: 'rgba(201,168,106,0.08)', border: '1px solid rgba(201,168,106,0.2)', textDecoration: 'none', fontSize: '8px', transition: 'all 0.15s ease' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'rgba(201,168,106,0.16)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'rgba(201,168,106,0.08)' }}
                >
                  <History size={9} /> Voir tout
                </a>
              )}
            </div>

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

        {/* ══════ ANALYTICS ══════ */}
        {gameHistory.length > 0 && (
          <motion.div
            className="mt-10"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center gap-3 mb-4">
              <h2 className="label-caps" style={{ color: 'var(--accent-cool)' }}>Analyse de progression</h2>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle)' }} />
            </div>

            <div className={`grid gap-4 ${gameHistory.length >= 2 ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 lg:grid-cols-1 max-w-sm'}`}>

              {/* Score progress chart */}
              {gameHistory.length >= 2 && (
                <div
                  className="lg:col-span-2 rounded-lg p-4"
                  style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-subtle)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '9px', color: 'var(--text-tertiary)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      Évolution du score
                    </span>
                    {stats && (
                      <span style={{ fontFamily: 'monospace', fontSize: '10px', color: 'var(--text-secondary)' }}>
                        Moy.&nbsp;
                        <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>{stats.avgScore}</span>
                        &nbsp;/ 100
                      </span>
                    )}
                  </div>
                  <ScoreProgressChart games={gameHistory} />
                </div>
              )}

              {/* Performance radar */}
              <div className={gameHistory.length >= 2 ? 'lg:col-span-1' : ''}>
                <PerformanceRadar games={gameHistory} />
              </div>
            </div>

            {/* Grade distribution */}
            {gameHistory.length >= 3 && (() => {
              const grades = ['A', 'B', 'C', 'D', 'F']
              const counts = Object.fromEntries(
                grades.map(g => [g, gameHistory.filter(h => h.grade === g).length])
              )
              const max = Math.max(...Object.values(counts))
              const gradeColors: Record<string, string> = {
                A: '#4A9D7C', B: '#5C7E92', C: '#C9A86A', D: '#E8914A', F: '#C25450',
              }
              return (
                <div
                  className="rounded-lg p-4 mt-4"
                  style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-subtle)' }}
                >
                  <span style={{ fontFamily: 'monospace', fontSize: '9px', color: 'var(--text-tertiary)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    Distribution des grades
                  </span>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', marginTop: '16px', height: '72px' }}>
                    {grades.map(g => {
                      const count = counts[g]
                      const pct = max > 0 ? count / max : 0
                      return (
                        <div key={g} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flex: 1 }}>
                          <span style={{ fontFamily: 'monospace', fontSize: '9px', color: gradeColors[g] }}>
                            {count > 0 ? count : ''}
                          </span>
                          <div style={{
                            width: '100%', borderRadius: '3px 3px 0 0',
                            backgroundColor: `${gradeColors[g]}${count > 0 ? '30' : '10'}`,
                            border: count > 0 ? `1px solid ${gradeColors[g]}40` : '1px solid transparent',
                            height: `${Math.max(pct * 52, count > 0 ? 8 : 2)}px`,
                            transition: 'height 0.7s cubic-bezier(0.16,1,0.3,1)',
                          }} />
                          <span style={{
                            fontFamily: 'monospace', fontSize: '11px', fontWeight: 700,
                            color: count > 0 ? gradeColors[g] : 'var(--text-tertiary)',
                          }}>{g}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })()}
          </motion.div>
        )}

      </main>

      {/* Mascot Bot */}
      <AssistantBot messages={DASHBOARD_MESSAGES[difficultyLevel]?.map(m => m.text) ?? []} context="dashboard" />
    </div>
  )
}
