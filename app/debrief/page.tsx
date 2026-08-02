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
import { stepV5 } from '@/engine/v5'
import {
  isHistoricalScenario,
  historicalQuartersCount,
  historicalShocks,
  historicalDate,
  historicalGapLag4,
  historicalPotentialGrowth,
  historicalInitialState,
} from '@/engine/v5/historicalScenarios'
import { computeTaylorRate } from '@/engine/models/taylorRule'
import { DEFAULT_POLICY_ACTION } from '@/engine/state'
import type { ScenarioId, EconomicState, PolicyAction, Shock, DifficultyLevel } from '@/engine/state'
import { getLevelConfig } from '@/engine/difficulty'
import { getDebriefMessage } from '@/engine/botMessages'
import { AssistantBot } from '@/components/ui/AssistantBot'
import { GovernorCertificate } from '@/components/ui/GovernorCertificate'
import { sound } from '@/lib/audio'

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

function computeTaylorOptimal(scenario: ScenarioId, seed: number, difficultyLevel: DifficultyLevel): number {
  const scenarioData = SCENARIOS[scenario]
  const historical = isHistoricalScenario(scenario)
  let state: EconomicState = historical
    ? historicalInitialState(scenario, { ...scenarioData.initialState })
    : { ...scenarioData.initialState }
  let activeShocks: Shock[] = historical ? [] : [...scenarioData.initialShocks]
  const allStates: EconomicState[] = [state]
  const actions: PolicyAction[] = []
  const levelConfig = getLevelConfig(difficultyLevel)
  const maxQuarters = historical ? historicalQuartersCount(scenario) : levelConfig.quarters

  for (let q = 0; q < maxQuarters - 1; q++) {
    const taylorRate = computeTaylorRate(state.inflation, state.outputGap)
    const rateChange = Math.round((taylorRate - state.policyRate) * 100 / 25) * 25
    const clampedChange = Math.max(-100, Math.min(100, rateChange))
    const action: PolicyAction = { ...DEFAULT_POLICY_ACTION, policyRateChangeBp: clampedChange }
    actions.push(action)
    const historyGaps = allStates.slice(1).map(h => h.outputGap)
    const result = historical
      ? stepV5({ ...state, date: historicalDate(scenario, state.quarter) }, action, activeShocks, seed + q * 100, {
          scenarioId: scenario,
          realShocks: historicalShocks(scenario, q) ?? undefined,
          outputGapLag4: historicalGapLag4(scenario, q, [...historyGaps, state.outputGap]),
          potentialGrowth: historicalPotentialGrowth(scenario, q),
        })
      : step(state, action, activeShocks, seed + q * 100, { scenarioId: scenario })
    if (historical) {
      result.newState.date = historicalDate(scenario, result.newState.quarter)
    }
    state = result.newState
    activeShocks = [
      ...activeShocks.map(s => ({ ...s, remainingQuarters: s.remainingQuarters - 1 })).filter(s => s.remainingQuarters > 0),
      ...result.triggeredShocks,
    ]
    allStates.push(state)
  }
  return computeScore(allStates, difficultyLevel, { scenario, actionHistory: actions }).total
}

export default function DebriefPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isCertificateOpen, setIsCertificateOpen] = useState(false)
  const [isReplaying, setIsReplaying] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const savedRef = useRef(false)


  const { history, currentState, actionHistory, scenario, status, seed, reset, startGame, difficultyLevel } = useGameStore(
    useShallow(s => ({
      history:      s.history,
      currentState: s.currentState,
      actionHistory: s.actionHistory,
      scenario:     s.scenario,
      status:       s.status,
      seed:         s.seed,
      reset:        s.reset,
      startGame:    s.startGame,
      freeMode:     s.freeMode,
      difficultyLevel: s.difficultyLevel,
    }))
  )
  const freeMode = useGameStore(s => s.freeMode)
  const currentUser = useAuthStore(s => s.currentUser)
  const addGameRecord = useAuthStore(s => s.addGameRecord)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis?.speaking) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const levelConfig = useMemo(() => getLevelConfig(difficultyLevel), [difficultyLevel])
  const allStates = useMemo(() => [...history, currentState], [history, currentState])
  const score = useMemo(
    () => computeScore(allStates, difficultyLevel, { scenario: scenario as ScenarioId | null, actionHistory }),
    [allStates, difficultyLevel, scenario, actionHistory],
  )
  const maxTotal = useMemo(() => {
    if (score?.scoringMode === 'historical-benchmark') return 100
    const w = levelConfig.scoringWeights
    return w.inflation + w.growth + w.stability + w.credibility
  }, [levelConfig, score?.scoringMode])

  const report = useMemo(() => generateGovernorReport(allStates), [allStates])
  const taylorScore = useMemo(
    () => scenario ? computeTaylorOptimal(scenario as ScenarioId, seed, difficultyLevel) : 0,
    [scenario, seed, difficultyLevel],
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
      difficultyLevel,
    })
  }, [mounted, currentUser, scenario, allStates, score, addGameRecord, freeMode, difficultyLevel])

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

  const handleReplay = async () => {
    if (!scenario || isReplaying) return
    setIsReplaying(true)
    await startGame(scenario as ScenarioId)
    router.push('/play')
  }
  const handleNewGame = () => { reset(); router.push('/dashboard') }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-base)' }}>
      <Header variant="debrief" />

      <main className="flex-1 w-full max-w-container mx-auto container-padding py-12">

        {/* ── Hero grade ── */}
        <div className="text-center mb-12">
          <div className="flex flex-col items-center justify-center gap-2 mb-4">
            <p className="label-caps" style={{ color: 'var(--text-tertiary)', margin: 0 }}>
              Bilan de mandat — {SCENARIOS[scenario as ScenarioId]?.title}
            </p>
            <span
              className="label-caps px-3 py-1 rounded-full text-[10px] flex items-center gap-1.5"
              style={{
                backgroundColor: levelConfig.bgColor,
                color: levelConfig.color,
                border: `1px solid ${levelConfig.color}40`,
                fontWeight: 600,
              }}
            >
              {levelConfig.emoji} Niveau {levelConfig.labelFr}
            </span>
          </div>
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
                {score.total} / {maxTotal}
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

        {/* ── Bandeau de diplôme premium (Grade A/B) ── */}
        {['A', 'B'].includes(score.grade) && (
          <div
            className="rounded-lg p-5 mb-10 flex flex-col sm:flex-row items-center justify-between gap-4 border border-[#C9A86A]/40 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(201, 168, 106, 0.08) 0%, rgba(180, 25, 35, 0.04) 100%)',
              cursor: 'pointer',
              boxShadow: '0 8px 30px rgba(201, 168, 106, 0.08)',
              transition: 'transform 0.2s ease, border-color 0.2s ease'
            }}
            onClick={() => {
              setIsCertificateOpen(true)
              sound.playSuccess()
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.borderColor = 'var(--accent-warm)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = ''
              e.currentTarget.style.borderColor = 'rgba(201, 168, 106, 0.4)'
            }}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#C9A86A]/10 to-transparent blur-xl pointer-events-none rounded-full" />
            
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎓</span>
              <div className="text-left">
                <p className="font-editorial text-lg text-[var(--text-primary)] m-0">Félicitations, vous êtes diplômé !</p>
                <p className="text-xs text-[var(--text-secondary)] m-0">Votre excellent score de {score.total} pts vous qualifie pour recevoir votre Certificat d&apos;Honneur CBS.</p>
              </div>
            </div>
            <button
              type="button"
              className="px-4 py-2 rounded text-xs font-semibold uppercase tracking-wider transition-all"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(180, 25, 35, 0.3)'
              }}
            >
              📜 Réclamer mon Diplôme
            </button>
          </div>
        )}

        {/* ── Modale d&apos;affichage du Certificat ── */}
        {isCertificateOpen && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in no-print"
            onClick={() => setIsCertificateOpen(false)}
          >
            <div
              className="bg-zinc-950 border border-[#C9A86A]/40 rounded-xl p-6 flex flex-col items-center gap-4 relative max-h-[95vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
              style={{
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              }}
            >
              <button
                type="button"
                onClick={() => setIsCertificateOpen(false)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white text-lg font-bold border border-zinc-800 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                style={{ cursor: 'pointer', backgroundColor: 'transparent' }}
              >
                ✕
              </button>
              <h3 className="font-editorial text-xl text-center text-white m-0 tracking-wider">Votre Certificat d&apos;Honneur</h3>
              <GovernorCertificate
                playerName={currentUser || 'Gouverneur'}
                score={score.total}
                grade={score.grade}
                scenarioName={SCENARIOS[scenario as ScenarioId]?.title || ''}
                difficulty={levelConfig.labelFr}
                avgInflation={allStates.reduce((a, s) => a + s.inflation, 0) / allStates.length}
                avgGrowth={allStates.reduce((a, s) => a + s.gdpGrowth, 0) / allStates.length}
              />
            </div>
          </div>
        )}


        {/* ── Score détaillé ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {(score.scoringMode === 'historical-benchmark'
            ? [
                { label: 'Taux directeur BAM', score: score.inflation, max: 50, detail: `Écart moyen : ${(score.details.avgRateDeviationBp ?? 0).toFixed(0)} pb` },
                { label: 'Réserve BAM', score: score.growth, max: 15, detail: `Écart moyen : ${(score.details.avgReserveDeviationBp ?? 0).toFixed(0)} pb` },
                { label: 'Trajectoire HCP', score: score.stability, max: 20, detail: `Écart macro moyen : ${(score.details.avgHistoricalTrajectoryDeviation ?? 0).toFixed(2)} pt` },
                { label: 'Cohérence historique', score: score.credibility, max: 15, detail: 'Même repère appliqué trimestre par trimestre' },
              ]
            : [
                { label: 'Stabilité des prix', score: score.inflation, max: levelConfig.scoringWeights.inflation, detail: `Déviation moy. : ${score.details.avgInflationDeviation.toFixed(2)} pt` },
                { label: 'Croissance', score: score.growth, max: levelConfig.scoringWeights.growth, detail: `Croissance moy. : ${fmtPct(score.details.avgGdpGrowth)}` },
                { label: 'Stabilité trajectoire', score: score.stability, max: levelConfig.scoringWeights.stability, detail: `Variance inflation : ${score.details.inflationVariance.toFixed(2)}` },
                { label: 'Crédibilité', score: score.credibility, max: levelConfig.scoringWeights.credibility, detail: `Crédibilité moy. : ${score.details.avgCredibility.toFixed(0)}` },
              ]).map(item => (
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

        {/* ── Rapports side-by-side ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* ── Rapport de Gouverneur ── */}
          <div className="rounded p-6" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderLeft: '3px solid var(--accent-primary)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="label-caps" style={{ margin: 0 }}>Rapport de Gouverneur</p>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window === 'undefined') return
                    const synth = window.speechSynthesis
                    if (!synth) return

                    if (synth.speaking) {
                      synth.cancel()
                      setIsSpeaking(false)
                      return
                    }

                    const text = `Rapport de Gouverneur. Plus grande erreur : ${report.biggestMistake}. Meilleure décision : ${report.bestDecision}. Trajectoire finale : ${report.finalTrajectory}. Débriefing de l'Assistant CBS : ${getDebriefMessage(score.grade, score.total, difficultyLevel)}`
                    const utterance = new SpeechSynthesisUtterance(text)
                    utterance.lang = 'fr-FR'
                    
                    const voices = synth.getVoices()
                    const frVoice = voices.find(v => v.lang.includes('fr'))
                    if (frVoice) utterance.voice = frVoice

                    utterance.onstart = () => setIsSpeaking(true)
                    utterance.onend = () => setIsSpeaking(false)
                    utterance.onerror = () => setIsSpeaking(false)

                    synth.speak(utterance)
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-all font-semibold uppercase tracking-wider"
                  style={{
                    backgroundColor: isSpeaking ? 'rgba(180,25,35,0.12)' : 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    color: isSpeaking ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  {isSpeaking ? 'Arrêter' : 'Écouter'}
                </button>
              </div>
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
          </div>

          {/* ── Assistant CBS Débriefing (Glassmorphism) ── */}
          <div className="rounded p-6 relative overflow-hidden" style={{
            backgroundColor: 'rgba(var(--bg-panel-rgb, 30, 32, 38), 0.65)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--border-subtle)',
            borderLeft: '3px solid var(--accent-warm)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500/10 to-amber-500/10 blur-2xl pointer-events-none rounded-full" />
            
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">🤖</span>
                <p className="label-caps" style={{ color: 'var(--accent-warm)', margin: 0 }}>Debriefing de l'Assistant CBS</p>
              </div>
              <p className="text-sm leading-relaxed font-sans" style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                "{getDebriefMessage(score.grade, score.total, difficultyLevel)}"
              </p>
            </div>
            
            <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
              <span className="text-[10px] label-caps" style={{ color: 'var(--text-tertiary)' }}>
                Niveau : {levelConfig.labelFr}
              </span>
              <span className="text-[10px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
                Score : {score.total} pts
              </span>
            </div>
          </div>
        </div>

        {/* ── Comparaison Taylor & Fiche Historique ── */}
        <div className="rounded p-6 mb-12" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-subtle)' }}>
          <p className="label-caps mb-6">Comparaison — Règle de Taylor optimale</p>
          <div className="grid grid-cols-2 gap-6 mb-6">
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
          <div className="text-center mb-6">
            {score.total >= taylorScore ? (
              <p className="text-sm font-semibold" style={{ color: 'var(--data-positive)', margin: 0 }}>Vous avez fait mieux que la règle de Taylor ! 🎉</p>
            ) : (
              <p className="text-sm" style={{ color: 'var(--text-tertiary)', margin: 0 }}>
                La règle de Taylor aurait obtenu {taylorScore - score.total} points de plus.
              </p>
            )}
          </div>

          <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '1.5rem 0' }} />

          {/* Fiche Pédagogique Historique */}
          <div>
            <p className="label-caps mb-3" style={{ color: 'var(--accent-primary)', fontSize: '11px' }}>
              📚 Que s&apos;est-il réellement passé historiquement ?
            </p>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)', margin: 0 }}>
              {(() => {
                const sId = scenario as string
                if (sId === 'inflation2022') {
                  return "En 2022, face à un choc inflationniste d'offre lié aux prix énergétiques et alimentaires importés, la Banque Centrale a relevé son taux directeur à trois reprises (passant de 1,50 % à 2,00 %, puis 2,50 % et enfin 3,00 % en mars 2023). Le gouverneur a privilégié un resserrement progressif et mesuré afin de juguler l'inflation tout en préservant le financement bancaire de l'économie marocaine."
                } else if (sId === 'covid2020') {
                  return "Au cours de la crise de la COVID-19 en 2020, la Banque Centrale a réagi de manière vigoureuse en baissant son taux directeur par deux fois de suite, le ramenant à 1,50 %, son niveau le plus bas historique. Parallèlement, elle a triplé son refinancement en injectant massivement de la liquidité aux banques commerciales et a libéré intégralement le compte de réserve obligatoire afin de parer tout risque systémique."
                } else if (sId === 'flexibilite') {
                  return "Le processus de transition vers le change flexible au Maroc a débuté en janvier 2018 avec l'élargissement de la bande de fluctuation du dirham à ±2,5 %, puis à ±5,0 % en mars 2020. La Banque Centrale a géré cette transition de manière ordonnée et progressive, maintenant la stabilité de l'ancrage nominal grâce à des interventions régulées et un ancrage efficace des anticipations des agents financiers."
                } else if (sId === 'volcker1979') {
                  return "En 1979, le président de la Réserve Fédérale américaine, Paul Volcker, a brisé la spirale de l'hyperinflation (qui culminait à plus de 14 %) par un resserrement monétaire d'une brutalité historique, propulsant le taux interbancaire à un pic de 20 % en 1980. Cette thérapie de choc, bien qu'ayant plongé les États-Unis dans une récession sévère, a permis de restaurer de façon définitive la crédibilité de la banque centrale."
                } else if (sId === 'crisis2008') {
                  return "En 2008, suite à la faillite de Lehman Brothers, la panique systémique mondiale a provoqué un gel du crédit. Les banques centrales du monde entier ont réduit leurs taux à près de 0 % et ont lancé l'Assouplissement Quantitatif (QE). Au Maroc, la Banque Centrale a agi de manière contracyclique en baissant son taux directeur et en injectant des liquidités pour parer au risque d'une hausse brutale des créances en souffrance (NPL)."
                } else {
                  return "Dans un contexte de croissance standard et d'inflation maîtrisée proche de 2 %, la Banque Centrale calibre son taux directeur autour d'un taux d'intérêt neutre réel estimé à environ 1,5 %, tout en ajustant ses réserves pour s'aligner sur les besoins quotidiens de liquidité bancaire."
                }
              })()}
            </p>
          </div>
        </div>

        {/* ── Graphe ── */}
        <div className="rounded p-6 mb-12" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-subtle)' }}>
          <p className="label-caps mb-4">Trajectoire complète — {levelConfig.quarters / 4} ans</p>
          <DebriefChart />
        </div>

        {/* ── Actions ── */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            type="button"
            onClick={handleReplay}
            disabled={isReplaying}
            className="px-8 py-3 rounded font-medium text-sm transition-all duration-200"
            style={{ backgroundColor: 'var(--accent-primary)', color: '#fff', border: 'none', cursor: isReplaying ? 'wait' : 'pointer', opacity: isReplaying ? 0.8 : 1 }}
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

        {/* ── Mascot Assistant ── */}
        <AssistantBot messages={[getDebriefMessage(score.grade, score.total, difficultyLevel)]} context="debrief" />

      </main>
    </div>
  )
}
