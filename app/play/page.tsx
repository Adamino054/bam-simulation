'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Flame } from 'lucide-react'
import { Header } from '@/components/shell/Header'
import { Timeline } from '@/components/game/Timeline'
import { Dashboard } from '@/components/game/Dashboard'
import { DecisionPanel } from '@/components/game/DecisionPanel'
import { LeftPanel } from '@/components/game/LeftPanel'
import { BloombergTicker } from '@/components/game/BloombergTicker'
import { useGameStore } from '@/store/gameStore'
import { useAuthStore } from '@/store/authStore'
import { SCENARIOS } from '@/engine/scenarios'
import { fmtQuarter } from '@/lib/format'
import { FREE_MODE_QUARTERS, INFLATION_TARGET } from '@/lib/constants'
import { AssistantBot } from '@/components/ui/AssistantBot'
import { getSimulationTips } from '@/engine/botMessages'
import type { ScenarioId } from '@/engine/state'
import { historicalQuartersCount, isHistoricalScenario } from '@/engine/v5/historicalScenarios'
import { OnboardingTour } from '@/components/game/OnboardingTour'
import { PressConferenceModal } from '@/components/game/PressConferenceModal'

function computeYearDots(history: Array<{ inflation: number; quarter: number }>, currentQuarter: number, maxQuarters: number) {
  const dots: Array<{ year: number; status: 'pending' | 'green' | 'amber' | 'red' }> = []
  const maxYears = Math.ceil(maxQuarters / 4)
  for (let y = 0; y < maxYears; y++) {
    const startQ = y * 4
    const endQ = startQ + 3
    if (startQ > currentQuarter) {
      dots.push({ year: y + 1, status: 'pending' })
      continue
    }
    const yearStates = history.filter(s => s.quarter >= startQ && s.quarter <= endQ)
    if (yearStates.length === 0) {
      dots.push({ year: y + 1, status: 'pending' })
      continue
    }
    const avgDeviation = yearStates.reduce((acc, s) => acc + Math.abs(s.inflation - INFLATION_TARGET), 0) / yearStates.length
    if (avgDeviation <= 0.5) dots.push({ year: y + 1, status: 'green' })
    else if (avgDeviation <= 1.0) dots.push({ year: y + 1, status: 'amber' })
    else dots.push({ year: y + 1, status: 'red' })
  }
  return dots
}

const dotColors: Record<string, string> = {
  pending: 'var(--bg-hover)',
  green: 'var(--data-positive)',
  amber: 'var(--data-warning)',
  red: 'var(--data-negative)',
}

export default function PlayPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isTourOpen, setIsTourOpen] = useState(false)
  const [initialPolicySynced, setInitialPolicySynced] = useState(false)

  const status   = useGameStore(s => s.status)
  const scenario = useGameStore(s => s.scenario)
  const currentState = useGameStore(s => s.currentState)
  const history = useGameStore(s => s.history)
  const freeMode = useGameStore(s => s.freeMode)
  const difficultyLevel = useGameStore(s => s.difficultyLevel)
  const syncInitialCentralBankPolicy = useGameStore(s => s.syncInitialCentralBankPolicy)
  const currentUser = useAuthStore(s => s.currentUser)
  const pendingPressConference = useGameStore(s => s.pendingPressConference)

  useEffect(() => {
    setMounted(true)
    const completed = localStorage.getItem('cbs_onboarding_completed')
    if (completed !== 'true') {
      setIsTourOpen(true)
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    if (!currentUser) {
      router.push('/login')
      return
    }
    if (status === 'finished') {
      router.push('/debrief')
    } else if (status === 'menu' || !scenario) {
      router.push('/dashboard')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, status, scenario])

  useEffect(() => {
    if (!mounted || status !== 'playing' || !scenario) {
      setInitialPolicySynced(true)
      return
    }

    let cancelled = false
    setInitialPolicySynced(false)
    syncInitialCentralBankPolicy().finally(() => {
      if (!cancelled) setInitialPolicySynced(true)
    })

    return () => {
      cancelled = true
    }
  }, [mounted, status, scenario, syncInitialCentralBankPolicy])

  const maxQuarters = scenario && isHistoricalScenario(scenario as ScenarioId)
    ? historicalQuartersCount(scenario as ScenarioId)
    : freeMode ? FREE_MODE_QUARTERS : (difficultyLevel === 'beginner' ? 16 : difficultyLevel === 'intermediate' ? 20 : 25)

  const allStates = useMemo(
    () => [...history.map(s => ({ inflation: s.inflation, quarter: s.quarter })), { inflation: currentState.inflation, quarter: currentState.quarter }],
    [history, currentState],
  )

  const yearDots = useMemo(
    () => computeYearDots(allStates, currentState.quarter, maxQuarters),
    [allStates, currentState.quarter, maxQuarters],
  )

  const scenarioMeta = scenario ? SCENARIOS[scenario as ScenarioId] : null

  if (!mounted || !initialPolicySynced) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-base)' }}
      >
        <p className="label-caps" style={{ color: 'var(--text-tertiary)' }}>
          Chargement…
        </p>
      </div>
    )
  }

  if (status !== 'playing') return null

  const justCompletedYear = currentState.quarter > 0 && currentState.quarter % 4 === 0

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--bg-base)' }}
    >
      <Header variant="game" />

      {/* Status bar — Bloomberg style */}
      <div
        className="flex items-center justify-between px-4"
        style={{
          height: '32px',
          backgroundColor: 'var(--bg-elevated)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        {/* LEFT: Quarter + scenario */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            T{currentState.quarter + 1} · {fmtQuarter(currentState.date.year, currentState.date.q)}
          </span>
          {scenarioMeta && (
            <span
              className="px-1.5 py-0.5 rounded text-[8px] font-semibold uppercase tracking-wider"
              style={{
                backgroundColor: 'rgba(180, 25, 35, 0.12)',
                color: 'var(--accent-primary)',
              }}
            >
              {scenarioMeta.title}
            </span>
          )}
          {difficultyLevel && (
            <span
              className="px-1.5 py-0.5 rounded text-[8px] font-semibold uppercase tracking-wider"
              style={{
                backgroundColor: difficultyLevel === 'beginner' ? 'rgba(74, 157, 124, 0.12)'
                  : difficultyLevel === 'intermediate' ? 'rgba(201, 168, 106, 0.12)'
                  : 'rgba(194, 84, 80, 0.12)',
                color: difficultyLevel === 'beginner' ? '#4A9D7C'
                  : difficultyLevel === 'intermediate' ? '#C9A86A'
                  : '#C25450',
              }}
            >
              {difficultyLevel === 'beginner' ? '🌱 DÉBUTANT' : difficultyLevel === 'intermediate' ? '📈 INTERMÉDIAIRE' : '🎯 EXPERT'}
            </span>
          )}
          {freeMode && (
            <span
              className="px-1.5 py-0.5 rounded text-[8px] font-semibold uppercase tracking-wider"
              style={{
                backgroundColor: 'rgba(201, 168, 106, 0.15)',
                color: 'var(--accent-warm)',
              }}
            >
              MODE LIBRE — {FREE_MODE_QUARTERS}T
            </span>
          )}
        </div>

        {/* CENTER: Year dots */}
        <div className="flex items-center gap-1.5">
          {yearDots.map((dot, i) => (
            <motion.div
              key={i}
              animate={justCompletedYear && i === Math.floor((currentState.quarter - 1) / 4)
                ? { scale: [1, 1.3, 1] }
                : {}
              }
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <div
                className="w-2 h-2 rounded-full transition-colors duration-300"
                style={{ backgroundColor: dotColors[dot.status] }}
                title={`Année ${dot.year}`}
              />
            </motion.div>
          ))}
        </div>

        {/* RIGHT: Credibility badge + Tutoriel button */}
        <div className="flex items-center gap-2">
          <span
            className="font-mono text-[10px] font-semibold"
            style={{
              color: currentState.centralBankCredibility > 70 ? 'var(--data-positive)'
                : currentState.centralBankCredibility > 40 ? 'var(--data-warning)'
                : 'var(--data-negative)',
            }}
          >
            Créd. {Math.round(currentState.centralBankCredibility)}
          </span>
          {currentState.centralBankCredibility < 40 && (
            <Flame size={10} style={{ color: 'var(--data-negative)' }} />
          )}

          <div className="h-4 w-[1px] bg-[var(--border-subtle)] mx-1" />

          <button
            onClick={() => setIsTourOpen(true)}
            className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-[var(--bg-panel)] border border-[var(--border-default)] hover:border-[var(--accent-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all flex items-center gap-1 cursor-pointer"
          >
            💡 Tutoriel
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div
        className="flex items-center justify-center py-2.5 px-4"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <Timeline />
      </div>

      {/* Layout 12 colonnes */}
      <main className="flex-1 w-full max-w-container mx-auto container-padding py-4">
        <div className="grid grid-cols-12 gap-3 items-start">

          {/* Sidebar gauche — contexte + chocs (3 col) */}
          <aside id="play-left-panel" className="col-span-3 hidden lg:flex flex-col gap-3 scroll-mt-20">
            <LeftPanel />
          </aside>

          {/* Zone centrale — dashboard + graphes (6 col) */}
          <section id="play-center-panel" className="col-span-12 lg:col-span-6 flex flex-col gap-3 scroll-mt-20">
            <Dashboard />
            <BloombergTicker />
          </section>

          {/* Sidebar droite — décision (3 col) */}
          <aside id="play-right-panel" className="col-span-12 lg:col-span-3 scroll-mt-20">
            <DecisionPanel />
          </aside>

        </div>

        {/* Mobile : LeftPanel en bas */}
        <div className="lg:hidden mt-3">
          <LeftPanel />
        </div>
      </main>

      {/* Mascot Bot */}
      <div id="play-assistant-bot">
        <AssistantBot messages={getSimulationTips(currentState, difficultyLevel)} context="simulation" />
      </div>

      {/* Onboarding Tour */}
      <OnboardingTour isOpen={isTourOpen} onClose={() => setIsTourOpen(false)} />

      {/* Press Conference Modal */}
      {pendingPressConference && (
        <PressConferenceModal pendingPressConference={pendingPressConference} />
      )}
    </div>
  )
}
