'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Glasses } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useDiscoveryStore } from '@/store/discoveryStore'
import { step } from '@/engine/simulator'
import { DEFAULT_POLICY_ACTION } from '@/engine/state'
import type { EconomicState, Shock } from '@/engine/state'
import {
  MISSION_INITIAL_STATE, MISSION_QUARTERS, MISSION_CHOICES, MISSION_EVENTS,
  plainShockNews, pricesMood, jobsMood, trustMood, growthMood,
  missionSeasonLabel, computeMissionVerdict, missionAdvice,
  MASCOT_TIPS_MISSION,
} from '@/engine/discovery'
import type { MissionChoice, MissionChoiceId, MissionVerdict } from '@/engine/discovery'
import { DiscoveryHeader } from '@/components/discovery/DiscoveryHeader'
import { Mascot } from '@/components/discovery/Mascot'
import { BigGauge } from '@/components/discovery/BigGauge'
import { Confetti } from '@/components/discovery/Confetti'
import { sound } from '@/lib/audio'

type Phase = 'intro' | 'playing' | 'debrief'

interface NewsItem {
  id: string
  emoji: string
  text: string
}

interface TurnFeedback {
  emoji: string
  text: string
}

const XP_BASE = 50
const XP_PER_STAR = 25

/** Résume en une phrase simple ce qui vient de changer */
function summarizeTurn(prev: EconomicState, next: EconomicState): TurnFeedback[] {
  const feedback: TurnFeedback[] = []
  const dInf = next.inflation - prev.inflation
  if (dInf > 0.25) feedback.push({ emoji: '🎈', text: 'Les prix montent...' })
  else if (dInf < -0.25) feedback.push({ emoji: '😮‍💨', text: 'Les prix se calment.' })
  else feedback.push({ emoji: '⚖️', text: 'Les prix restent stables.' })

  const dU = next.unemployment - prev.unemployment
  if (dU > 0.15) feedback.push({ emoji: '💼', text: 'Le travail se fait plus rare.' })
  else if (dU < -0.15) feedback.push({ emoji: '🎉', text: 'Des emplois se créent !' })

  const dCred = next.centralBankCredibility - prev.centralBankCredibility
  if (dCred < -3) feedback.push({ emoji: '💔', text: 'Ta cote de confiance baisse.' })
  else if (dCred > 3) feedback.push({ emoji: '🤝', text: 'On te fait de plus en plus confiance !' })

  return feedback
}

/** ⛵ Mission Capitaine — le vrai moteur macro, sans les chiffres qui piquent. */
export default function MissionPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const currentUser = useAuthStore(s => s.currentUser)
  const addXp = useDiscoveryStore(s => s.addXp)
  const recordMission = useDiscoveryStore(s => s.recordMission)

  const [phase, setPhase] = useState<Phase>('intro')
  const [state, setState] = useState<EconomicState>({ ...MISSION_INITIAL_STATE })
  const [history, setHistory] = useState<EconomicState[]>([])
  const [actions, setActions] = useState<MissionChoiceId[]>([])
  const [activeShocks, setActiveShocks] = useState<Shock[]>([])
  const [injectedEvents, setInjectedEvents] = useState<number[]>([])
  const [news, setNews] = useState<NewsItem[]>([])
  const [feedback, setFeedback] = useState<TurnFeedback[]>([])
  const [seed, setSeed] = useState(0)
  const [prevRateChange, setPrevRateChange] = useState(0)
  const [expertMode, setExpertMode] = useState(false)
  const [verdict, setVerdict] = useState<MissionVerdict | null>(null)
  const [deciding, setDeciding] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (mounted && !currentUser) {
      router.push('/login')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, currentUser])

  /* Injecte les événements scénarisés au début du tour concerné */
  useEffect(() => {
    if (phase !== 'playing') return
    const event = MISSION_EVENTS.find(e => e.atQuarter === state.quarter)
    if (event && !injectedEvents.includes(event.atQuarter)) {
      setInjectedEvents(prev => [...prev, event.atQuarter])
      setActiveShocks(prev => [...prev, { ...event.shock }])
      setNews(prev => [{ id: `event-${event.atQuarter}`, emoji: event.emoji, text: event.news }, ...prev].slice(0, 3))
      sound.playAlert()
    }
  }, [phase, state.quarter, injectedEvents])

  const startMission = () => {
    sound.playTick()
    setState({ ...MISSION_INITIAL_STATE })
    setHistory([])
    setActions([])
    setActiveShocks([])
    setInjectedEvents([])
    setNews([{ id: 'start', emoji: '⛵', text: 'Tu prends la barre ! Les prix commencent déjà à s’agiter... le pays compte sur toi.' }])
    setFeedback([])
    setSeed(Math.floor(Math.random() * 1_000_000))
    setPrevRateChange(0)
    setVerdict(null)
    setPhase('playing')
  }

  const decide = useCallback((choice: MissionChoice) => {
    if (deciding) return
    setDeciding(true)
    sound.playTick()

    const action = { ...DEFAULT_POLICY_ACTION, policyRateChangeBp: choice.policyRateChangeBp }
    const result = step(state, action, activeShocks, seed, {
      previousPolicyRateChangeBp: prevRateChange,
    })

    const newActiveShocks = [
      ...activeShocks
        .map(s => ({ ...s, remainingQuarters: s.remainingQuarters - 1 }))
        .filter(s => s.remainingQuarters > 0),
      ...result.triggeredShocks,
    ]

    // Traduit les chocs aléatoires en flash infos simples
    const randomNews: NewsItem[] = result.triggeredShocks.map(shock => {
      const plain = plainShockNews(shock)
      return { id: shock.id, emoji: plain.emoji, text: plain.text }
    })
    if (randomNews.length > 0) sound.playAlert()

    const newHistory = [...history, state]
    const newActions = [...actions, choice.id]

    // Petit délai pour laisser respirer l'animation des jauges
    setTimeout(() => {
      setState(result.newState)
      setHistory(newHistory)
      setActions(newActions)
      setActiveShocks(newActiveShocks)
      setPrevRateChange(choice.policyRateChangeBp)
      setNews(prev => [...randomNews, ...prev].slice(0, 3))
      setFeedback(summarizeTurn(state, result.newState))

      if (result.newState.quarter >= MISSION_QUARTERS) {
        const fullHistory = [...newHistory, result.newState] // état initial inclus
        const v = computeMissionVerdict(fullHistory, newActions)
        setVerdict(v)
        recordMission(v.stars, v.score)
        addXp(XP_BASE + v.stars * XP_PER_STAR)
        if (v.stars >= 2) sound.playSuccess()
        setTimeout(() => setPhase('debrief'), 900)
      }
      setDeciding(false)
    }, 450)
  }, [deciding, state, activeShocks, seed, prevRateChange, history, actions, addXp, recordMission])

  if (!mounted || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-base)' }}>
        <p className="label-caps" style={{ color: 'var(--text-tertiary)' }}>Chargement…</p>
      </div>
    )
  }

  /* ══════ INTRO ══════ */
  if (phase === 'intro') {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-base)' }}>
        <DiscoveryHeader />
        <main className="flex-1 w-full max-w-xl mx-auto px-5 py-10 flex items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full rounded-2xl p-8 text-center"
            style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-default)' }}
          >
            <motion.div
              className="text-6xl mb-4 inline-block"
              animate={{ rotate: [0, -4, 4, 0], y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              ⛵
            </motion.div>
            <h1 className="font-editorial text-3xl mb-3" style={{ color: 'var(--text-primary)' }}>
              Mission Capitaine
            </h1>
            <p className="text-sm leading-relaxed mb-5 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Le pays te confie la barre de son économie pendant <strong>2 ans (8 saisons)</strong>.
              À chaque saison, une seule décision : freiner, patienter ou réchauffer.
              Garde les prix calmes 🎈, les emplois nombreux 💼 et la confiance haute 🤝 !
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-6">
              {MISSION_CHOICES.map(choice => (
                <div key={choice.id} className="rounded-xl p-3" style={{ backgroundColor: 'var(--bg-elevated)', border: `1px solid ${choice.color}44` }}>
                  <div className="text-2xl mb-1">{choice.emoji}</div>
                  <span className="text-[11px] font-bold block" style={{ color: 'var(--text-primary)' }}>{choice.label}</span>
                </div>
              ))}
            </div>

            <div className="rounded-xl p-3.5 mb-6 text-left" style={{ backgroundColor: 'rgba(92,126,146,0.08)', border: '1px dashed rgba(92,126,146,0.35)' }}>
              <p className="text-[11px] m-0 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                🤓 <strong>Secret de fabrication :</strong> cette mission tourne sur le VRAI moteur
                économique du mode expert. Les mêmes équations, cachées derrière des émojis.
                Active les lunettes d&apos;expert en jeu pour voir les vrais chiffres !
              </p>
            </div>

            <div className="flex gap-3 justify-center flex-wrap">
              <button
                onClick={startMission}
                className="px-7 py-3.5 rounded-lg text-sm font-bold"
                style={{
                  background: 'linear-gradient(135deg, #C41923 0%, #8B131B 100%)',
                  color: '#fff', border: 'none', cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(180,25,35,0.35)',
                }}
              >
                ⚓ Prendre la barre !
              </button>
              <button
                onClick={() => router.push('/decouverte')}
                className="px-5 py-3.5 rounded-lg text-xs font-bold"
                style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)', cursor: 'pointer' }}
              >
                ← Plus tard
              </button>
            </div>
          </motion.div>
        </main>
      </div>
    )
  }

  /* ══════ DEBRIEF ══════ */
  if (phase === 'debrief' && verdict) {
    const missionStates = history.length > 0 ? [...history.slice(1), state] : [state]
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-base)' }}>
        <DiscoveryHeader />
        <main className="flex-1 w-full max-w-xl mx-auto px-5 py-8">
          <div className="relative rounded-2xl p-8 text-center overflow-hidden mb-4" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-default)' }}>
            {verdict.stars >= 2 && <Confetti count={34} />}

            {/* Étoiles */}
            <div className="flex justify-center gap-2 mb-4">
              {[0, 1, 2].map(i => (
                <motion.span
                  key={i}
                  initial={{ scale: 0, rotate: -40 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3 + i * 0.25, type: 'spring', damping: 10 }}
                  className="text-4xl"
                  style={{ opacity: i < verdict.stars ? 1 : 0.18, filter: i < verdict.stars ? 'none' : 'grayscale(1)' }}
                >
                  ⭐
                </motion.span>
              ))}
            </div>

            <h1 className="font-editorial text-2xl mb-2" style={{ color: 'var(--text-primary)' }}>{verdict.title}</h1>
            <p className="text-sm leading-relaxed mb-3 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
              {verdict.comment}
            </p>
            <p className="font-mono text-xs mb-1" style={{ color: 'var(--accent-warm)' }}>
              Score de mission : {verdict.score}/100 · +{XP_BASE + verdict.stars * XP_PER_STAR} XP
            </p>
            <p className="font-mono text-[10px] mb-0" style={{ color: 'var(--accent-cool)' }}>
              🧭 {verdict.goodMoves} manœuvres de manuel sur {verdict.totalMoves}
            </p>
          </div>

          {/* Mini-graphe du voyage des prix */}
          <div className="rounded-2xl p-5 mb-4" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-subtle)' }}>
            <span className="label-caps block mb-3" style={{ fontSize: '9px', color: 'var(--text-tertiary)' }}>
              🎈 Le voyage des prix pendant ton mandat
            </span>
            <div className="relative flex items-end gap-1.5" style={{ height: '90px' }}>
              {/* Zone verte (1 à 3 %) sur une échelle de -1 à 7 */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute', left: 0, right: 0,
                  bottom: `${((1 + 1) / 8) * 100}%`, height: `${(2 / 8) * 100}%`,
                  backgroundColor: 'rgba(74,157,124,0.12)',
                  borderTop: '1px dashed rgba(74,157,124,0.4)',
                  borderBottom: '1px dashed rgba(74,157,124,0.4)',
                }}
              />
              {missionStates.map((s, i) => {
                const h = Math.max(4, Math.min(100, ((s.inflation + 1) / 8) * 100))
                const inZone = s.inflation >= 1 && s.inflation <= 3
                return (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ delay: 0.2 + i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="flex-1 rounded-t"
                    style={{ backgroundColor: inZone ? 'rgba(74,157,124,0.65)' : 'rgba(194,84,80,0.6)' }}
                    title={`Saison ${i + 1} : ${s.inflation.toFixed(1)} %`}
                  />
                )
              })}
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>Début</span>
              <span className="text-[9px]" style={{ color: 'var(--data-positive)' }}>■ dans la zone idéale</span>
              <span className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>Fin</span>
            </div>
          </div>

          {/* Conseils */}
          <div className="rounded-2xl p-5 mb-6" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-subtle)' }}>
            <span className="label-caps block mb-3" style={{ fontSize: '9px', color: 'var(--accent-warm)' }}>
              🪙 Le débrief de Floussi
            </span>
            <ul className="m-0 p-0 flex flex-col gap-2" style={{ listStyle: 'none' }}>
              {verdict.tips.map((tip, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.15 }}
                  className="text-xs leading-relaxed"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {tip}
                </motion.li>
              ))}
            </ul>
          </div>

          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={startMission}
              className="px-5 py-2.5 rounded-lg text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #C41923 0%, #8B131B 100%)', color: '#fff', border: 'none', cursor: 'pointer' }}
            >
              🔄 Nouvelle mission
            </button>
            <button
              onClick={() => router.push('/decouverte')}
              className="px-5 py-2.5 rounded-lg text-xs font-bold"
              style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)', cursor: 'pointer' }}
            >
              🧭 Camp de base
            </button>
            {verdict.stars >= 2 && (
              <button
                onClick={() => router.push('/dashboard')}
                className="px-5 py-2.5 rounded-lg text-xs font-bold"
                style={{ backgroundColor: 'rgba(92,126,146,0.14)', color: 'var(--accent-cool)', border: '1px solid rgba(92,126,146,0.4)', cursor: 'pointer' }}
              >
                🏛️ Je suis prêt pour le mode expert !
              </button>
            )}
          </div>
        </main>
      </div>
    )
  }

  /* ══════ EN JEU ══════ */
  const advice = missionAdvice(state)
  const turnNumber = Math.min(state.quarter + 1, MISSION_QUARTERS)

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-base)' }}>
      <DiscoveryHeader />
      <main className="flex-1 w-full max-w-2xl mx-auto px-5 sm:px-6 py-6 pb-28">

        {/* Barre de saison */}
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <span className="text-sm font-bold block" style={{ color: 'var(--text-primary)' }}>
              {missionSeasonLabel(state.quarter)}
            </span>
            <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
              Saison {turnNumber} sur {MISSION_QUARTERS}
            </span>
          </div>
          {/* Lunettes d'expert */}
          <button
            onClick={() => { sound.playTick(); setExpertMode(!expertMode) }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold transition-all"
            style={{
              backgroundColor: expertMode ? 'rgba(92,126,146,0.16)' : 'var(--bg-panel)',
              color: expertMode ? 'var(--accent-cool)' : 'var(--text-tertiary)',
              border: `1px solid ${expertMode ? 'rgba(92,126,146,0.5)' : 'var(--border-default)'}`,
              cursor: 'pointer',
            }}
            title="Afficher les vrais chiffres du mode expert"
          >
            <Glasses size={13} />
            Lunettes d&apos;expert {expertMode ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Frise des saisons */}
        <div className="flex gap-1 mb-5">
          {Array.from({ length: MISSION_QUARTERS }, (_, i) => (
            <div
              key={i}
              className="flex-1 rounded-full"
              style={{
                height: '6px',
                backgroundColor: i < state.quarter ? 'var(--accent-warm)' : i === state.quarter ? 'var(--accent-primary)' : 'var(--bg-hover)',
                transition: 'background-color 0.3s ease',
              }}
            />
          ))}
        </div>

        {/* Flash infos */}
        <div className="mb-4 flex flex-col gap-1.5">
          <AnimatePresence initial={false}>
            {news.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: i === 0 ? 1 : 0.55, y: 0, scale: 1 }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl"
                style={{
                  backgroundColor: i === 0 ? 'rgba(201,168,106,0.09)' : 'var(--bg-panel)',
                  border: `1px solid ${i === 0 ? 'rgba(201,168,106,0.3)' : 'var(--border-subtle)'}`,
                }}
              >
                <span className="text-lg leading-none mt-0.5">{item.emoji}</span>
                <p className="text-[11px] leading-snug m-0" style={{ color: i === 0 ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                  <span className="label-caps mr-1.5" style={{ fontSize: '7px', color: 'var(--accent-warm)' }}>Flash info</span>
                  {item.text}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Jauges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <BigGauge title="Les prix" titleEmoji="🎈" mood={pricesMood(state.inflation)} expertMode={expertMode} greenZone={[30, 50]} />
          <BigGauge title="Les emplois" titleEmoji="💼" mood={jobsMood(state.unemployment)} expertMode={expertMode} />
          <BigGauge title="La confiance" titleEmoji="🤝" mood={trustMood(state.centralBankCredibility)} expertMode={expertMode} />
          <BigGauge title="Le gâteau du pays" titleEmoji="🎂" mood={growthMood(state.gdpGrowth)} expertMode={expertMode} />
        </div>

        {/* Résumé du tour précédent */}
        <AnimatePresence>
          {feedback.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-wrap gap-2 justify-center mb-4"
            >
              {feedback.map((f, i) => (
                <span
                  key={i}
                  className="text-[11px] px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
                >
                  {f.emoji} {f.text}
                </span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Conseil de Floussi */}
        <div
          className="flex items-start gap-2.5 rounded-xl px-4 py-3 mb-5"
          style={{ backgroundColor: 'rgba(201,168,106,0.07)', border: '1px solid rgba(201,168,106,0.22)' }}
        >
          <span className="text-xl leading-none">🪙</span>
          <p className="text-[11px] leading-snug m-0" style={{ color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--accent-warm)' }}>Floussi :</strong> {advice.emoji} {advice.text}
          </p>
        </div>

        {/* Taux directeur actuel (visible en mode expert) */}
        {expertMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="text-center mb-4"
          >
            <span className="font-mono text-[11px] px-3 py-1.5 rounded-lg" style={{ backgroundColor: 'var(--bg-panel)', border: '1px dashed var(--border-default)', color: 'var(--accent-cool)' }}>
              🤓 Taux directeur actuel : {state.policyRate.toFixed(2)} % · C&apos;est LE levier que tu bouges avec tes 3 boutons
            </span>
          </motion.div>
        )}

        {/* Décision */}
        <div className="text-center mb-3">
          <span className="label-caps" style={{ fontSize: '9px', color: 'var(--text-tertiary)' }}>
            ⚓ Ta décision pour cette saison, Capitaine ?
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {MISSION_CHOICES.map(choice => (
            <motion.button
              key={choice.id}
              onClick={() => decide(choice)}
              disabled={deciding}
              whileHover={!deciding ? { y: -4, scale: 1.02 } : {}}
              whileTap={!deciding ? { scale: 0.96 } : {}}
              className="rounded-2xl p-4 text-center transition-opacity"
              style={{
                backgroundColor: 'var(--bg-panel)',
                border: `2px solid ${choice.color}55`,
                boxShadow: `0 4px 18px ${choice.color}14`,
                cursor: deciding ? 'wait' : 'pointer',
                opacity: deciding ? 0.55 : 1,
              }}
            >
              <div className="text-3xl mb-1.5">{choice.emoji}</div>
              <span className="text-xs font-bold block mb-1" style={{ color: 'var(--text-primary)' }}>{choice.label}</span>
              <span className="text-[10px] block leading-snug" style={{ color: 'var(--text-tertiary)' }}>{choice.description}</span>
              {expertMode && (
                <span className="font-mono text-[9px] block mt-2 px-1.5 py-1 rounded" style={{ color: choice.color, backgroundColor: 'var(--bg-base)', border: `1px dashed ${choice.color}44` }}>
                  🤓 {choice.expertNote}
                </span>
              )}
            </motion.button>
          ))}
        </div>
      </main>

      <Mascot tips={MASCOT_TIPS_MISSION} autoOpen={false} />
    </div>
  )
}
