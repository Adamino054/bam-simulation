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
import { useGameStore } from '@/store/gameStore'
import { useAuthStore } from '@/store/authStore'
import { SCENARIOS } from '@/engine/scenarios'
import { fmtQuarter } from '@/lib/format'
import { TOTAL_QUARTERS, FREE_MODE_QUARTERS, INFLATION_TARGET } from '@/lib/constants'
import type { ScenarioId } from '@/engine/state'

function computeYearDots(history: Array<{ inflation: number; quarter: number }>, currentQuarter: number) {
  const dots: Array<{ year: number; status: 'pending' | 'green' | 'amber' | 'red' }> = []
  const maxYears = 5
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

  const status   = useGameStore(s => s.status)
  const scenario = useGameStore(s => s.scenario)
  const currentState = useGameStore(s => s.currentState)
  const history = useGameStore(s => s.history)
  const freeMode = useGameStore(s => s.freeMode)
  const currentUser = useAuthStore(s => s.currentUser)

  useEffect(() => {
    setMounted(true)
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
    // router exclu des deps intentionnellement — l'instance change à chaque render dans Next.js 14
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, status, scenario])

  const allStates = useMemo(
    () => [...history.map(s => ({ inflation: s.inflation, quarter: s.quarter })), { inflation: currentState.inflation, quarter: currentState.quarter }],
    [history, currentState],
  )

  const yearDots = useMemo(
    () => computeYearDots(allStates, currentState.quarter),
    [allStates, currentState.quarter],
  )

  const scenarioMeta = scenario ? SCENARIOS[scenario as ScenarioId] : null

  if (!mounted) {
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

        {/* RIGHT: Credibility badge */}
        <div className="flex items-center gap-1.5">
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
          <aside className="col-span-3 hidden lg:flex flex-col gap-3">
            <LeftPanel />
          </aside>

          {/* Zone centrale — dashboard + graphes (6 col) */}
          <section className="col-span-12 lg:col-span-6 flex flex-col gap-3">
            <Dashboard />
          </section>

          {/* Sidebar droite — décision (3 col) */}
          <aside className="col-span-12 lg:col-span-3">
            <DecisionPanel />
          </aside>

        </div>

        {/* Mobile : LeftPanel en bas */}
        <div className="lg:hidden mt-3">
          <LeftPanel />
        </div>
      </main>
    </div>
  )
}
