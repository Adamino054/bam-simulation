'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DISCOVERY_QUIZ } from '@/engine/discovery'
import type { DiscoveryQuizQuestion } from '@/engine/discovery'
import { useDiscoveryStore } from '@/store/discoveryStore'
import { Confetti } from './Confetti'
import { XpPop, Burst, StreakFlame, SegmentedProgress, ScoreRing, StarRow, NewRecordBanner, useCountUp } from './GameFx'
import type { SegmentResult } from './GameFx'
import { CoachBar, CoachFinale, COACH_PHRASES, pickPhrase } from './Coach'
import type { CoachLine } from './Coach'
import { sound } from '@/lib/audio'

const COACH_INTRO: CoachLine = { mood: 'idle', text: 'Bienvenue au Grand Quiz ! 8 questions, zéro piège de matheux. Prêt ?' }

const QUESTIONS_PER_GAME = 8
const XP_PER_CORRECT = 10
const XP_PERFECT_BONUS = 15

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

interface QuizGameProps {
  onExit: () => void
}

/* ── Écran de fin ─────────────────────────────────────────────── */

function QuizEndScreen({
  score, total, isRecord, onReplay, onExit,
}: {
  score: number
  total: number
  isRecord: boolean
  onReplay: () => void
  onExit: () => void
}) {
  const perfect = score === total
  const pct = Math.round((score / total) * 100)
  const stars = perfect ? 3 : pct >= 75 ? 2 : pct >= 50 ? 1 : 0
  const xp = score * XP_PER_CORRECT + (perfect ? XP_PERFECT_BONUS : 0)
  const displayedXp = useCountUp(xp, 1000)
  const color = perfect ? '#C9A86A' : pct >= 50 ? '#4A9D7C' : '#C25450'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-2xl p-8 text-center overflow-hidden"
      style={{ backgroundColor: 'var(--bg-panel)', border: `1px solid ${color}44`, boxShadow: `0 12px 48px ${color}14` }}
    >
      {stars >= 2 && <Confetti count={32} />}

      <NewRecordBanner show={isRecord} />

      <div className="mb-4 flex items-center justify-center gap-4 sm:gap-6">
        <CoachFinale stars={stars} />
        <ScoreRing pct={pct} color={color} subLabel="de bonnes réponses" />
      </div>

      <StarRow stars={stars} />

      <h2 className="font-editorial-roman text-2xl mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>
        {perfect ? 'SANS FAUTE ! Incroyable !' : pct >= 75 ? 'Presque parfait !' : pct >= 50 ? 'Bien joué !' : 'Bon entraînement !'}
      </h2>
      <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
        {score} bonne{score > 1 ? 's' : ''} réponse{score > 1 ? 's' : ''} sur {total}
        {perfect ? ' — tu parles déjà comme un gouverneur ! 🏛️' : ''}
      </p>
      <p className="font-mono text-sm mb-6 tabular" style={{ color: 'var(--accent-warm)', textShadow: '0 0 12px rgba(201,168,106,0.4)' }}>
        ✨ +{displayedXp} XP {perfect ? '· Badge « Sans faute » 🎯' : ''}
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

/** 🎓 Le Grand Quiz — questions vulgarisées, réponses instantanées, zéro jargon. */
export function QuizGame({ onExit }: QuizGameProps) {
  const addXp = useDiscoveryStore(s => s.addXp)
  const recordQuiz = useDiscoveryStore(s => s.recordQuiz)

  const [gameId, setGameId] = useState(0)
  const [questions, setQuestions] = useState<DiscoveryQuizQuestion[]>(() => shuffle(DISCOVERY_QUIZ).slice(0, QUESTIONS_PER_GAME))
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [results, setResults] = useState<('correct' | 'wrong')[]>([])
  const [streak, setStreak] = useState(0)
  const [finished, setFinished] = useState(false)
  const [isRecord, setIsRecord] = useState(false)
  const [burstTrigger, setBurstTrigger] = useState(0)
  const [xpTrigger, setXpTrigger] = useState(0)
  const [wrongFlash, setWrongFlash] = useState(0)
  const [coach, setCoach] = useState<CoachLine>(COACH_INTRO)

  const score = results.filter(r => r === 'correct').length
  const question = questions[index]
  const options = useMemo(
    () => shuffle(question.options.map((o, i) => ({ ...o, key: i }))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [question, gameId],
  )

  const segments: SegmentResult[] = questions.map((_, i) =>
    i < results.length ? results[i] : i === index ? 'current' : 'pending',
  )

  const pick = (optIndex: number) => {
    if (picked !== null) return
    setPicked(optIndex)
    const isCorrect = options[optIndex].correct
    setResults(prev => [...prev, isCorrect ? 'correct' : 'wrong'])
    if (isCorrect) {
      const newStreak = streak + 1
      setStreak(newStreak)
      setBurstTrigger(t => t + 1)
      setXpTrigger(t => t + 1)
      setCoach({ mood: 'excited', text: newStreak >= 3 ? pickPhrase(COACH_PHRASES.streak) : pickPhrase(COACH_PHRASES.correct) })
      sound.playSuccess()
    } else {
      setStreak(0)
      setWrongFlash(w => w + 1)
      setCoach({ mood: 'sad', text: pickPhrase(COACH_PHRASES.wrong) })
      sound.playFailure()
    }
  }

  const next = () => {
    sound.playTick()
    if (index + 1 >= questions.length) {
      const finalScore = results.filter(r => r === 'correct').length
      const prevBest = useDiscoveryStore.getState().getProfile().quizBestScore
      setIsRecord(finalScore > prevBest && finalScore > 0)
      recordQuiz(finalScore, questions.length)
      addXp(finalScore * XP_PER_CORRECT + (finalScore === questions.length ? XP_PERFECT_BONUS : 0))
      setFinished(true)
    } else {
      setIndex(i => i + 1)
      setPicked(null)
      setCoach({ mood: 'thinking', text: pickPhrase(COACH_PHRASES.thinking) })
    }
  }

  const replay = () => {
    sound.playTick()
    setQuestions(shuffle(DISCOVERY_QUIZ).slice(0, QUESTIONS_PER_GAME))
    setGameId(g => g + 1)
    setIndex(0)
    setPicked(null)
    setResults([])
    setStreak(0)
    setFinished(false)
    setIsRecord(false)
    setCoach(COACH_INTRO)
  }

  if (finished) {
    return <QuizEndScreen score={score} total={questions.length} isRecord={isRecord} onReplay={replay} onExit={onExit} />
  }

  return (
    <div
      className="relative rounded-2xl p-5 sm:p-7 overflow-hidden"
      style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-default)' }}
    >
      {/* Effets */}
      <XpPop trigger={xpTrigger} amount={XP_PER_CORRECT} />
      <Burst trigger={burstTrigger} />

      {/* Flash rouge sur erreur */}
      <AnimatePresence>
        {wrongFlash > 0 && picked !== null && !options[picked]?.correct && (
          <motion.div
            key={wrongFlash}
            initial={{ opacity: 0.35 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="pointer-events-none absolute inset-0"
            style={{ backgroundColor: 'rgba(194,84,80,0.25)', zIndex: 20 }}
          />
        )}
      </AnimatePresence>

      {/* Barre du haut */}
      <div className="flex items-center justify-between mb-3">
        <span className="label-caps" style={{ fontSize: '9px' }}>
          Question {index + 1} / {questions.length}
        </span>
        <div className="flex items-center gap-2">
          <StreakFlame streak={streak} />
          <span
            className="font-mono text-xs font-bold px-2.5 py-1 rounded-full tabular"
            style={{ color: 'var(--accent-warm)', backgroundColor: 'rgba(201,168,106,0.1)', border: '1px solid rgba(201,168,106,0.25)' }}
          >
            ⭐ {score}
          </span>
        </div>
      </div>

      <div className="mb-4">
        <SegmentedProgress results={segments} />
      </div>

      {/* Prof. Floussi commente la partie */}
      <div className="mb-5">
        <CoachBar line={coach} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${gameId}-${question.id}`}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="text-center mb-5">
            <motion.div
              className="text-5xl mb-3 inline-block"
              initial={{ scale: 0.4, rotate: -12 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 11 }}
            >
              {question.emoji}
            </motion.div>
            <h3 className="text-base font-semibold leading-snug m-0" style={{ color: 'var(--text-primary)' }}>
              {question.question}
            </h3>
          </div>

          <div className="flex flex-col gap-2.5 mb-4">
            {options.map((opt, i) => {
              const isPicked = picked === i
              const showCorrect = picked !== null && opt.correct
              const showWrong = isPicked && !opt.correct
              return (
                <motion.button
                  key={opt.key}
                  onClick={() => pick(i)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{
                    opacity: picked !== null && !showCorrect && !showWrong ? 0.4 : 1,
                    y: 0,
                    x: showWrong ? [0, -8, 8, -5, 5, 0] : 0,
                  }}
                  transition={{ delay: picked === null ? 0.08 + i * 0.05 : 0 }}
                  whileHover={picked === null ? { scale: 1.018, x: 4 } : {}}
                  whileTap={picked === null ? { scale: 0.985 } : {}}
                  className="w-full text-left px-4 py-3.5 rounded-xl text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: showCorrect ? 'rgba(74,157,124,0.15)' : showWrong ? 'rgba(194,84,80,0.12)' : 'var(--bg-elevated)',
                    border: `1.5px solid ${showCorrect ? '#4A9D7C' : showWrong ? '#C25450' : 'var(--border-default)'}`,
                    color: showCorrect ? '#4A9D7C' : showWrong ? '#C25450' : 'var(--text-primary)',
                    cursor: picked === null ? 'pointer' : 'default',
                    boxShadow: showCorrect ? '0 0 18px rgba(74,157,124,0.2)' : 'none',
                  }}
                >
                  <span className="flex items-center gap-2.5">
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                      style={{
                        backgroundColor: showCorrect ? '#4A9D7C' : showWrong ? '#C25450' : 'var(--bg-base)',
                        color: showCorrect || showWrong ? '#fff' : 'var(--text-tertiary)',
                        border: `1px solid ${showCorrect ? '#4A9D7C' : showWrong ? '#C25450' : 'var(--border-default)'}`,
                      }}
                    >
                      {showCorrect ? '✓' : showWrong ? '✗' : String.fromCharCode(65 + i)}
                    </span>
                    {opt.text}
                  </span>
                </motion.button>
              )
            })}
          </div>

          <AnimatePresence>
            {picked !== null && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl p-4 mb-1"
                style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-subtle)' }}
              >
                <p className="text-xs leading-relaxed m-0" style={{ color: 'var(--text-secondary)' }}>
                  💡 {question.explanation}
                </p>
                {question.expertNote && (
                  <p className="font-mono text-[10px] mt-2 mb-0 px-2 py-1.5 rounded" style={{ color: 'var(--accent-cool)', backgroundColor: 'var(--bg-panel)', border: '1px dashed var(--border-default)' }}>
                    🤓 {question.expertNote}
                  </p>
                )}
                <motion.button
                  onClick={next}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-3 w-full py-3 rounded-xl text-xs font-bold"
                  style={{ background: 'linear-gradient(135deg, #C41923 0%, #8B131B 100%)', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 16px rgba(180,25,35,0.3)' }}
                >
                  {index + 1 >= questions.length ? 'Voir mon résultat 🏁' : 'Question suivante →'}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
