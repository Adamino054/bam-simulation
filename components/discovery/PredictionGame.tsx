'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PREDICTION_CARDS } from '@/engine/discovery'
import type { PredictionCard } from '@/engine/discovery'
import { useDiscoveryStore } from '@/store/discoveryStore'
import { Confetti } from './Confetti'
import { XpPop, Burst, StreakFlame, SegmentedProgress, ScoreRing, StarRow, NewRecordBanner, useCountUp } from './GameFx'
import type { SegmentResult } from './GameFx'
import { CoachBar, CoachFinale, COACH_PHRASES, pickPhrase } from './Coach'
import type { CoachLine } from './Coach'
import { sound } from '@/lib/audio'

const COACH_INTRO: CoachLine = { mood: 'idle', text: 'Une situation, deux futurs possibles... Devine lequel est le vrai !' }

const XP_PER_CORRECT = 8
const XP_STREAK_BONUS = 20 // si toutes les cartes d'affilée

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

interface PredictionGameProps {
  onExit: () => void
}

/* ── Écran de fin ─────────────────────────────────────────────── */

function PredictionEndScreen({
  correctCount, total, bestStreak, isRecord, onReplay, onExit,
}: {
  correctCount: number
  total: number
  bestStreak: number
  isRecord: boolean
  onReplay: () => void
  onExit: () => void
}) {
  const perfect = correctCount === total
  const pct = Math.round((correctCount / total) * 100)
  const stars = perfect ? 3 : pct >= 75 ? 2 : pct >= 50 ? 1 : 0
  const xp = correctCount * XP_PER_CORRECT + (perfect ? XP_STREAK_BONUS : 0)
  const displayedXp = useCountUp(xp, 1000)
  const color = perfect ? '#C9A86A' : pct >= 50 ? '#5C7E92' : '#C25450'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-2xl p-8 text-center overflow-hidden"
      style={{ backgroundColor: 'var(--bg-panel)', border: `1px solid ${color}44`, boxShadow: `0 12px 48px ${color}14` }}
    >
      {(bestStreak >= 8 || stars >= 2) && <Confetti count={32} />}

      <NewRecordBanner show={isRecord} />

      <div className="mb-4 flex items-center justify-center gap-4 sm:gap-6">
        <CoachFinale stars={stars} />
        <ScoreRing pct={pct} color={color} subLabel="de bonnes prédictions" />
      </div>

      <StarRow stars={stars} />

      <h2 className="font-editorial-roman text-2xl mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>
        {perfect ? 'Tu lis l’avenir de l’économie !' : bestStreak >= 5 ? 'Belle série !' : 'Tu progresses !'}
      </h2>
      <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
        {correctCount} / {total} bonnes prédictions · Meilleure série : {bestStreak} 🔥
      </p>
      <p className="font-mono text-sm mb-6 tabular" style={{ color: 'var(--accent-warm)', textShadow: '0 0 12px rgba(201,168,106,0.4)' }}>
        ✨ +{displayedXp} XP {bestStreak >= 8 ? '· Badge « En feu ! » 🔥' : ''}
      </p>

      <div className="flex gap-3 justify-center flex-wrap">
        <button
          onClick={onReplay}
          className="px-6 py-3 rounded-xl text-xs font-bold"
          style={{ background: 'linear-gradient(135deg, #C41923 0%, #8B131B 100%)', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 18px rgba(180,25,35,0.35)' }}
        >
          🔄 Rejouer
        </button>
        <button
          onClick={onExit}
          className="px-6 py-3 rounded-xl text-xs font-bold"
          style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)', cursor: 'pointer' }}
        >
          ← Autres jeux
        </button>
      </div>
    </motion.div>
  )
}

/** 🔮 Devine la suite ! — cause → conséquence, façon jeu de cartes. */
export function PredictionGame({ onExit }: PredictionGameProps) {
  const addXp = useDiscoveryStore(s => s.addXp)
  const recordPrediction = useDiscoveryStore(s => s.recordPrediction)

  const [deck, setDeck] = useState<PredictionCard[]>(() => shuffle(PREDICTION_CARDS))
  const [index, setIndex] = useState(0)
  const [answered, setAnswered] = useState<'A' | 'B' | null>(null)
  const [results, setResults] = useState<('correct' | 'wrong')[]>([])
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [finished, setFinished] = useState(false)
  const [isRecord, setIsRecord] = useState(false)
  const [burstTrigger, setBurstTrigger] = useState(0)
  const [xpTrigger, setXpTrigger] = useState(0)
  const [coach, setCoach] = useState<CoachLine>(COACH_INTRO)

  const card = deck[index]
  const correctCount = results.filter(r => r === 'correct').length
  const remaining = deck.length - index

  const segments: SegmentResult[] = deck.map((_, i) =>
    i < results.length ? results[i] : i === index ? 'current' : 'pending',
  )

  const answer = (choice: 'A' | 'B') => {
    if (answered !== null) return
    setAnswered(choice)
    const isCorrect = choice === card.correct
    setResults(prev => [...prev, isCorrect ? 'correct' : 'wrong'])
    if (isCorrect) {
      sound.playSuccess()
      setBurstTrigger(t => t + 1)
      setXpTrigger(t => t + 1)
      const newStreak = streak + 1
      setCoach({ mood: 'excited', text: newStreak >= 3 ? pickPhrase(COACH_PHRASES.streak) : pickPhrase(COACH_PHRASES.correct) })
      setStreak(newStreak)
      setBestStreak(b => Math.max(b, newStreak))
    } else {
      sound.playFailure()
      setStreak(0)
      setCoach({ mood: 'sad', text: pickPhrase(COACH_PHRASES.wrong) })
    }
  }

  const next = () => {
    sound.playTick()
    if (index + 1 >= deck.length) {
      const finalCorrect = results.filter(r => r === 'correct').length
      const isPerfect = finalCorrect === deck.length
      const prevBest = useDiscoveryStore.getState().getProfile().predictionBestStreak
      setIsRecord(bestStreak > prevBest && bestStreak > 0)
      recordPrediction(bestStreak)
      addXp(finalCorrect * XP_PER_CORRECT + (isPerfect ? XP_STREAK_BONUS : 0))
      setFinished(true)
    } else {
      setIndex(i => i + 1)
      setAnswered(null)
      setCoach({ mood: 'thinking', text: pickPhrase(COACH_PHRASES.thinking) })
    }
  }

  const restart = () => {
    sound.playTick()
    setDeck(shuffle(PREDICTION_CARDS))
    setIndex(0)
    setAnswered(null)
    setResults([])
    setStreak(0)
    setBestStreak(0)
    setFinished(false)
    setIsRecord(false)
    setCoach(COACH_INTRO)
  }

  if (finished) {
    return (
      <PredictionEndScreen
        correctCount={correctCount}
        total={deck.length}
        bestStreak={bestStreak}
        isRecord={isRecord}
        onReplay={restart}
        onExit={onExit}
      />
    )
  }

  const isCorrectAnswer = answered !== null && answered === card.correct

  return (
    <div
      className="relative rounded-2xl p-5 sm:p-7 overflow-hidden"
      style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-default)' }}
    >
      {/* Effets */}
      <XpPop trigger={xpTrigger} amount={XP_PER_CORRECT} emoji="🔮" />
      <Burst trigger={burstTrigger} emojis={['🔮', '✨', '⭐']} />

      {/* Barre du haut : progression + série */}
      <div className="flex items-center justify-between mb-3">
        <span className="label-caps" style={{ fontSize: '9px' }}>
          Carte {index + 1} / {deck.length}
        </span>
        <StreakFlame streak={streak} />
      </div>

      <div className="mb-4">
        <SegmentedProgress results={segments} />
      </div>

      {/* Prof. Floussi commente la partie */}
      <div className="mb-5">
        <CoachBar line={coach} />
      </div>

      {/* Zone deck : cartes derrière + carte active */}
      <div className="relative" style={{ perspective: '1200px' }}>
        {/* Cartes du dessous (le paquet) */}
        {remaining > 2 && (
          <div
            aria-hidden="true"
            className="absolute inset-x-4 rounded-xl"
            style={{
              top: '14px', height: '120px',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              transform: 'rotate(2.2deg)',
              opacity: 0.5,
            }}
          />
        )}
        {remaining > 1 && (
          <div
            aria-hidden="true"
            className="absolute inset-x-2 rounded-xl"
            style={{
              top: '8px', height: '130px',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              transform: 'rotate(-1.6deg)',
              opacity: 0.75,
            }}
          />
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={card.id}
            initial={{ opacity: 0, rotateY: 65, scale: 0.9 }}
            animate={{ opacity: 1, rotateY: 0, scale: 1 }}
            exit={{ opacity: 0, x: -110, rotate: -7 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* La situation */}
            <div
              className="relative rounded-xl p-5 text-center mb-4 overflow-hidden"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                boxShadow: '0 10px 32px rgba(0,0,0,0.25)',
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
                  background: 'linear-gradient(90deg, #5C7E92 0%, #C9A86A 50%, #C25450 100%)',
                }}
              />
              <motion.div
                className="text-5xl mb-2 inline-block"
                initial={{ scale: 0.4 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 11, delay: 0.15 }}
              >
                {card.emoji}
              </motion.div>
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{card.situation}</p>
              <p className="text-xs m-0" style={{ color: 'var(--text-tertiary)' }}>{card.question}</p>
            </div>

            {/* Les deux futurs possibles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {(['A', 'B'] as const).map((side, sideIdx) => {
                const opt = side === 'A' ? card.optionA : card.optionB
                const isPicked = answered === side
                const isTheCorrect = card.correct === side
                const revealCorrect = answered !== null && isTheCorrect
                const revealWrong = isPicked && !isTheCorrect
                return (
                  <motion.button
                    key={side}
                    onClick={() => answer(side)}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{
                      opacity: answered !== null && !revealCorrect && !revealWrong ? 0.4 : 1,
                      y: 0,
                      x: revealWrong ? [0, -8, 8, -5, 5, 0] : 0,
                      scale: revealCorrect ? [1, 1.05, 1] : 1,
                    }}
                    transition={{ delay: answered === null ? 0.2 + sideIdx * 0.08 : 0 }}
                    whileHover={answered === null ? { scale: 1.04, y: -3 } : {}}
                    whileTap={answered === null ? { scale: 0.96 } : {}}
                    className="rounded-xl p-4 text-center transition-colors"
                    style={{
                      backgroundColor: revealCorrect ? 'rgba(74,157,124,0.15)' : revealWrong ? 'rgba(194,84,80,0.12)' : 'var(--bg-base)',
                      border: `2px solid ${revealCorrect ? '#4A9D7C' : revealWrong ? '#C25450' : 'var(--border-default)'}`,
                      cursor: answered === null ? 'pointer' : 'default',
                      boxShadow: revealCorrect ? '0 0 22px rgba(74,157,124,0.25)' : 'none',
                    }}
                  >
                    <div className="text-3xl mb-1.5">{opt.emoji}</div>
                    <span className="text-xs font-semibold block" style={{ color: revealCorrect ? '#4A9D7C' : revealWrong ? '#C25450' : 'var(--text-primary)' }}>
                      {opt.text}
                    </span>
                    {revealCorrect && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', damping: 9 }}
                        className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: '#4A9D7C', color: '#fff' }}
                      >
                        ✓ Le bon futur !
                      </motion.span>
                    )}
                  </motion.button>
                )
              })}
            </div>

            {/* Feedback */}
            <AnimatePresence>
              {answered !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl p-4"
                  style={{
                    backgroundColor: 'var(--bg-base)',
                    border: `1px solid ${isCorrectAnswer ? 'rgba(74,157,124,0.35)' : 'rgba(194,84,80,0.35)'}`,
                  }}
                >
                  <p className="text-xs font-bold mb-1" style={{ color: isCorrectAnswer ? '#4A9D7C' : '#C25450' }}>
                    {isCorrectAnswer ? '✅ Bien vu !' : '❌ Pas cette fois...'}
                  </p>
                  <p className="text-xs leading-relaxed m-0" style={{ color: 'var(--text-secondary)' }}>
                    {card.explanation}
                  </p>
                  <motion.button
                    onClick={next}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    className="mt-3 w-full py-3 rounded-xl text-xs font-bold"
                    style={{ background: 'linear-gradient(135deg, #C41923 0%, #8B131B 100%)', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(180,25,35,0.3)' }}
                  >
                    {index + 1 >= deck.length ? 'Voir mon résultat 🏁' : `Carte suivante (${remaining - 1} restante${remaining - 1 > 1 ? 's' : ''}) →`}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
