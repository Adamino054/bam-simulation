'use client'

import { useState, useMemo, useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useGameStore } from '@/store/gameStore'
import { computeScore } from '@/engine/scoring'
import { Header } from '@/components/shell/Header'
import { fmtPct } from '@/lib/format'
import { SCENARIOS } from '@/engine/scenarios'
import type { ScenarioId } from '@/engine/state'

const DebriefChart = dynamic(
  () => import('@/components/game/DebriefChart').then(m => ({ default: m.DebriefChart })),
  { ssr: false },
)

const GRADE_COLOR: Record<string, string> = {
  A: 'var(--data-positive)',
  B: 'var(--accent-cool)',
  C: 'var(--data-warning)',
  D: 'var(--data-warning)',
  F: 'var(--data-negative)',
}

export default function DebriefPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  const { history, currentState, scenario, status, reset, startGame } = useGameStore(
    useShallow(s => ({
      history:      s.history,
      currentState: s.currentState,
      scenario:     s.scenario,
      status:       s.status,
      reset:        s.reset,
      startGame:    s.startGame,
    }))
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    if (status === 'menu' || !scenario) router.push('/')
    // router exclu des deps intentionnellement
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, status, scenario])

  const allStates = useMemo(
    () => [...history, currentState],
    [history, currentState],
  )

  const score = useMemo(() => computeScore(allStates), [allStates])

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-base)' }}>
        <p className="label-caps" style={{ color: 'var(--text-tertiary)' }}>Chargement…</p>
      </div>
    )
  }

  const handleReplay = () => {
    if (scenario) startGame(scenario)
    router.push('/play')
  }

  const handleNewGame = () => {
    reset()
    router.push('/')
  }

  if (!scenario) return null

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--bg-base)' }}
    >
      <Header variant="debrief" />

      <main className="flex-1 w-full max-w-container mx-auto container-padding py-12">

        {/* ── Hero grade ── */}
        <div className="text-center mb-12">
          <p className="label-caps mb-4" style={{ color: 'var(--text-tertiary)' }}>
            Bilan de mandat — {SCENARIOS[scenario as ScenarioId]?.title}
          </p>
          <div className="flex items-baseline justify-center gap-6 mb-6">
            <span
              className="font-editorial"
              style={{
                fontSize: 'clamp(5rem, 15vw, 10rem)',
                color: GRADE_COLOR[score.grade] ?? 'var(--text-primary)',
                lineHeight: 1,
              }}
            >
              {score.grade}
            </span>
            <div className="text-left">
              <p
                className="font-editorial-roman"
                style={{ fontSize: '2.5rem', color: 'var(--text-primary)' }}
              >
                {score.total} / 100
              </p>
              <p className="label-caps" style={{ color: 'var(--text-tertiary)' }}>
                Score final
              </p>
            </div>
          </div>
          <p
            className="text-base leading-relaxed max-w-2xl mx-auto"
            style={{ color: 'var(--text-secondary)' }}
          >
            {score.commentary}
          </p>
        </div>

        {/* ── Détail du score ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          {[
            {
              label: 'Stabilité des prix',
              score: score.inflation,
              max: 40,
              detail: `Déviation moyenne : ${score.details.avgInflationDeviation.toFixed(2).replace('.', ',')} pt`,
            },
            {
              label: 'Croissance',
              score: score.growth,
              max: 30,
              detail: `Croissance moyenne : ${fmtPct(score.details.avgGdpGrowth)}`,
            },
            {
              label: 'Stabilité trajectoire',
              score: score.stability,
              max: 30,
              detail: `Variance inflation : ${score.details.inflationVariance.toFixed(2).replace('.', ',')}`,
            },
          ].map(item => (
            <div
              key={item.label}
              className="rounded p-5"
              style={{
                backgroundColor: 'var(--bg-panel)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <p className="label-caps mb-3">{item.label}</p>
              <div className="flex items-baseline gap-2 mb-2">
                <span
                  className="font-editorial-roman"
                  style={{ fontSize: '2rem', color: 'var(--text-primary)' }}
                >
                  {item.score}
                </span>
                <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  / {item.max}
                </span>
              </div>
              {/* Barre de progression */}
              <div className="h-1 rounded-full mb-2" style={{ backgroundColor: 'var(--bg-hover)' }}>
                <div
                  className="h-1 rounded-full transition-all duration-700"
                  style={{
                    width: `${(item.score / item.max) * 100}%`,
                    backgroundColor: 'var(--accent-primary)',
                  }}
                />
              </div>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {item.detail}
              </p>
            </div>
          ))}
        </div>

        {/* ── Graphe récapitulatif ── */}
        <div
          className="rounded p-6 mb-12"
          style={{
            backgroundColor: 'var(--bg-panel)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <p className="label-caps mb-4">Trajectoire complète — 5 ans</p>
          <DebriefChart />
        </div>

        {/* ── Actions ── */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            type="button"
            onClick={handleReplay}
            className="px-8 py-3 rounded font-medium text-sm transition-all duration-200"
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: '#fff',
              border: 'none',
            }}
          >
            Rejouer ce scénario
          </button>
          <button
            type="button"
            onClick={handleNewGame}
            className="px-8 py-3 rounded font-medium text-sm transition-colors duration-200"
            style={{
              backgroundColor: 'var(--bg-panel)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-default)',
            }}
          >
            Nouveau scénario
          </button>
        </div>

      </main>
    </div>
  )
}
