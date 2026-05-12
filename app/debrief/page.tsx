'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useGameStore } from '@/store/gameStore'
import { useAuthStore } from '@/store/authStore'
import { computeScore, generateGovernorReport } from '@/engine/scoring'
import { Header } from '@/components/shell/Header'
import { fmtPct } from '@/lib/format'
import { SCENARIOS } from '@/engine/scenarios'
import { step } from '@/engine/simulator'
import { computeTaylorRate } from '@/engine/models/taylorRule'
import { DEFAULT_POLICY_ACTION } from '@/engine/state'
import type { ScenarioId, EconomicState, PolicyAction, Shock } from '@/engine/state'

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

function computeTaylorOptimal(scenario: ScenarioId, seed: number): number {
  const scenarioData = SCENARIOS[scenario]
  let state: EconomicState = { ...scenarioData.initialState }
  let activeShocks: Shock[] = [...scenarioData.initialShocks]
  const allStates: EconomicState[] = [state]

  for (let q = 0; q < 19; q++) {
    const taylorRate = computeTaylorRate(state.inflation, state.outputGap)
    const rateChange = Math.round((taylorRate - state.policyRate) * 100 / 25) * 25
    const clampedChange = Math.max(-100, Math.min(100, rateChange))
    const action: PolicyAction = { ...DEFAULT_POLICY_ACTION, policyRateChangeBp: clampedChange }
    const result = step(state, action, activeShocks, seed + q * 100, { scenarioId: scenario })
    state = result.newState
    activeShocks = [
      ...activeShocks.map(s => ({ ...s, remainingQuarters: s.remainingQuarters - 1 })).filter(s => s.remainingQuarters > 0),
      ...result.triggeredShocks,
    ]
    allStates.push(state)
  }
  return computeScore(allStates).total
}

export default function DebriefPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const savedRef = useRef(false)

  const { history, currentState, scenario, status, seed, reset, startGame } = useGameStore(
    useShallow(s => ({
      history:      s.history,
      currentState: s.currentState,
      scenario:     s.scenario,
      status:       s.status,
      seed:         s.seed,
      reset:        s.reset,
      startGame:    s.startGame,
      freeMode:     s.freeMode,
    }))
  )
  const freeMode = useGameStore(s => s.freeMode)
  const currentUser = useAuthStore(s => s.currentUser)
  const addGameRecord = useAuthStore(s => s.addGameRecord)

  useEffect(() => { setMounted(true) }, [])

  const allStates = useMemo(() => [...history, currentState], [history, currentState])
  const score = useMemo(() => computeScore(allStates), [allStates])
  const report = useMemo(() => generateGovernorReport(allStates), [allStates])
  const taylorScore = useMemo(
    () => scenario ? computeTaylorOptimal(scenario as ScenarioId, seed) : 0,
    [scenario, seed],
  )

  // ── Sauvegarde automatique en historique joueur ──────────────────
  useEffect(() => {
    if (!mounted || savedRef.current) return
    if (!currentUser || !scenario || allStates.length < 2) return

    savedRef.current = true
    const avgInflation = allStates.reduce((a, s) => a + s.inflation, 0) / allStates.length
    const avgGrowth = allStates.reduce((a, s) => a + s.gdpGrowth, 0) / allStates.length
    const avgCredibility = allStates.reduce((a, s) => a + (s.centralBankCredibility ?? 70), 0) / allStates.length

    addGameRecord({
      scenario,
      scenarioTitle: SCENARIOS[scenario as ScenarioId]?.title ?? scenario,
      score: score.total,
      grade: score.grade,
      quarters: allStates.length,
      avgInflation,
      avgGrowth,
      avgCredibility,
      freeMode,
    })
  }, [mounted, currentUser, scenario, allStates, score, addGameRecord, freeMode])

  // ── Guards ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mounted) return
    if (!currentUser) { router.push('/login'); return }
    if (status === 'menu' || !scenario) router.push('/dashboard')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, status, scenario, currentUser])

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-base)' }}>
        <p className="label-caps" style={{ color: 'var(--text-tertiary)' }}>Chargement…</p>
      </div>
    )
  }

  if (!scenario) return null

  const handleReplay = () => { if (scenario) startGame(scenario as ScenarioId); router.push('/play') }
  const handleNewGame = () => { reset(); router.push('/dashboard') }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-base)' }}>
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
              <p className="font-editorial-roman" style={{ fontSize: '2.5rem', color: 'var(--text-primary)' }}>
                {score.total} / 100
              </p>
              <p className="label-caps" style={{ color: 'var(--text-tertiary)' }}>Score final</p>
            </div>
          </div>
          <p className="text-base leading-relaxed max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            {score.commentary}
          </p>
          {/* Saved badge */}
          {currentUser && (
            <div className="inline-flex items-center gap-1.5 mt-4 px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(74,157,124,0.12)', border: '1px solid rgba(74,157,124,0.2)' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--data-positive)', display: 'inline-block' }} />
              <span className="label-caps" style={{ color: 'var(--data-positive)', fontSize: '9px' }}>Partie sauvegardée dans votre historique</span>
            </div>
          )}
        </div>

        {/* ── Score détaillé ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {[
            { label: 'Stabilité des prix',    score: score.inflation,   max: 35, detail: `Déviation moy. : ${score.details.avgInflationDeviation.toFixed(2)} pt` },
            { label: 'Croissance',            score: score.growth,      max: 25, detail: `Croissance moy. : ${fmtPct(score.details.avgGdpGrowth)}` },
            { label: 'Stabilité trajectoire', score: score.stability,   max: 20, detail: `Variance inflation : ${score.details.inflationVariance.toFixed(2)}` },
            { label: 'Crédibilité',           score: score.credibility, max: 20, detail: `Crédibilité moy. : ${score.details.avgCredibility.toFixed(0)}` },
          ].map(item => (
            <div key={item.label} className="rounded p-5" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-subtle)' }}>
              <p className="label-caps mb-3">{item.label}</p>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="font-editorial-roman" style={{ fontSize: '2rem', color: 'var(--text-primary)' }}>{item.score}</span>
                <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>/ {item.max}</span>
              </div>
              <div className="h-1 rounded-full mb-2" style={{ backgroundColor: 'var(--bg-hover)' }}>
                <div className="h-1 rounded-full transition-all duration-700"
                  style={{ width: `${(item.score / item.max) * 100}%`, backgroundColor: 'var(--accent-primary)' }} />
              </div>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{item.detail}</p>
            </div>
          ))}
        </div>

        {/* ── Rapport de Gouverneur ── */}
        <div className="rounded p-6 mb-12" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderLeft: '3px solid var(--accent-primary)' }}>
          <p className="label-caps mb-4">Rapport de Gouverneur</p>
          <div className="space-y-3">
            {[
              { icon: '⚠', color: 'var(--data-negative)', text: report.biggestMistake },
              { icon: '✓', color: 'var(--data-positive)', text: report.bestDecision },
              { icon: '→', color: 'var(--accent-cool)',   text: report.finalTrajectory },
            ].map((row, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-sm flex-shrink-0" style={{ color: row.color }}>{row.icon}</span>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{row.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Comparaison Taylor ── */}
        <div className="rounded p-6 mb-12" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-subtle)' }}>
          <p className="label-caps mb-6">Comparaison — Règle de Taylor optimale</p>
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <p className="label-caps mb-2">Votre score</p>
              <p className="font-editorial-roman" style={{ fontSize: '2.5rem', color: GRADE_COLOR[score.grade] ?? 'var(--text-primary)' }}>
                {score.total}
              </p>
            </div>
            <div className="text-center">
              <p className="label-caps mb-2">Taylor optimal</p>
              <p className="font-editorial-roman" style={{ fontSize: '2.5rem', color: 'var(--text-secondary)' }}>{taylorScore}</p>
            </div>
          </div>
          <div className="mt-4 text-center">
            {score.total >= taylorScore ? (
              <p className="text-sm" style={{ color: 'var(--data-positive)' }}>Vous avez fait mieux que la règle de Taylor ! 🎉</p>
            ) : (
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                La règle de Taylor aurait obtenu {taylorScore - score.total} points de plus.
              </p>
            )}
          </div>
        </div>

        {/* ── Graphe ── */}
        <div className="rounded p-6 mb-12" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-subtle)' }}>
          <p className="label-caps mb-4">Trajectoire complète — 5 ans</p>
          <DebriefChart />
        </div>

        {/* ── Actions ── */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            type="button"
            onClick={handleReplay}
            className="px-8 py-3 rounded font-medium text-sm transition-all duration-200"
            style={{ backgroundColor: 'var(--accent-primary)', color: '#fff', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.9' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
          >
            Rejouer ce scénario
          </button>
          <button
            type="button"
            onClick={handleNewGame}
            className="px-8 py-3 rounded font-medium text-sm transition-colors duration-200"
            style={{ backgroundColor: 'var(--bg-panel)', color: 'var(--text-primary)', border: '1px solid var(--border-default)', cursor: 'pointer' }}
          >
            Nouveau scénario
          </button>
        </div>

      </main>
    </div>
  )
}
