'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useDiscoveryStore, useDiscoveryProfile } from '@/store/discoveryStore'
import { STORY_CHAPTERS } from '@/engine/discovery'
import type { StoryChapter } from '@/engine/discovery'
import { DiscoveryHeader } from '@/components/discovery/DiscoveryHeader'
import { Mascot } from '@/components/discovery/Mascot'
import { StoryWidget } from '@/components/discovery/StoryWidgets'
import { Confetti } from '@/components/discovery/Confetti'
import { sound } from '@/lib/audio'

type Phase = 'slides' | 'checkpoint' | 'done'

const READING_TIPS = [
  'Prends ton temps : chaque histoire se lit en 2 minutes chrono ! ⏱️',
  'Les encadrés 🤓 te montrent comment on dit la même chose en mode expert.',
  'Certaines pages se jouent : bouge les curseurs, appuie sur les boutons !',
  'À la fin de chaque histoire, 2 petites questions pour gagner ton XP. Facile !',
]

/** 📖 Les Histoires — leçons illustrées et interactives, zéro formule. */
export default function StoryPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const currentUser = useAuthStore(s => s.currentUser)
  const profile = useDiscoveryProfile()
  const completeChapter = useDiscoveryStore(s => s.completeChapter)

  const [chapter, setChapter] = useState<StoryChapter | null>(null)
  const [slideIndex, setSlideIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('slides')
  const [cpIndex, setCpIndex] = useState(0)
  const [cpPicked, setCpPicked] = useState<number | null>(null)
  const [cpCorrect, setCpCorrect] = useState(0)
  const [earnedXp, setEarnedXp] = useState(0)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (mounted && !currentUser) {
      router.push('/login')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, currentUser])

  if (!mounted || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-base)' }}>
        <p className="label-caps" style={{ color: 'var(--text-tertiary)' }}>Chargement…</p>
      </div>
    )
  }

  const openChapter = (c: StoryChapter) => {
    sound.playTick()
    setChapter(c)
    setSlideIndex(0)
    setPhase('slides')
    setCpIndex(0)
    setCpPicked(null)
    setCpCorrect(0)
    setEarnedXp(0)
  }

  const closeChapter = () => {
    sound.playTick()
    setChapter(null)
  }

  /* ══════ LISTE DES CHAPITRES ══════ */
  if (!chapter) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-base)' }}>
        <DiscoveryHeader />
        <main className="flex-1 w-full max-w-3xl mx-auto px-5 sm:px-6 py-8 pb-28">
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="text-5xl mb-3">📖</div>
            <h1 className="font-editorial text-3xl mb-2" style={{ color: 'var(--text-primary)' }}>Les Histoires</h1>
            <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--text-tertiary)' }}>
              5 petites aventures, dans l&apos;ordre ou dans le désordre. À la fin,
              tu comprendras tout ce que fait un vrai gouverneur de banque centrale !
            </p>
          </motion.div>

          <div className="flex flex-col gap-3">
            {STORY_CHAPTERS.map((c, i) => {
              const done = profile.completedChapters.includes(c.id)
              return (
                <motion.button
                  key={c.id}
                  onClick={() => openChapter(c)}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ x: 6 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full text-left rounded-2xl p-5 flex items-center gap-4"
                  style={{
                    backgroundColor: 'var(--bg-panel)',
                    border: `1px solid ${done ? 'rgba(74,157,124,0.4)' : 'var(--border-default)'}`,
                    cursor: 'pointer',
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                    style={{ backgroundColor: c.color + '18', border: `1px solid ${c.color}44` }}
                  >
                    {c.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="label-caps" style={{ fontSize: '8px', color: c.color }}>Histoire {i + 1}</span>
                      {done && (
                        <span className="label-badge flex items-center gap-0.5" style={{ backgroundColor: 'rgba(74,157,124,0.14)', color: '#4A9D7C', fontSize: '8px' }}>
                          <Check size={8} /> Terminée
                        </span>
                      )}
                    </div>
                    <span className="block text-sm font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>{c.title}</span>
                    <span className="block text-[11px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{c.tagline}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono text-[10px] block" style={{ color: 'var(--accent-warm)' }}>
                      {done ? '✓ XP gagnée' : `+${c.xpReward} XP`}
                    </span>
                    <ChevronRight size={16} style={{ color: 'var(--text-tertiary)', marginLeft: 'auto', marginTop: '4px' }} />
                  </div>
                </motion.button>
              )
            })}
          </div>
        </main>
        <Mascot tips={READING_TIPS} autoOpen={false} />
      </div>
    )
  }

  /* ══════ ÉCRAN DE FIN DE CHAPITRE ══════ */
  if (phase === 'done') {
    const alreadyDone = earnedXp === 0
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-base)' }}>
        <DiscoveryHeader />
        <main className="flex-1 w-full max-w-xl mx-auto px-5 py-10 flex items-center">
          <div className="relative w-full rounded-2xl p-8 text-center overflow-hidden" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-default)' }}>
            <Confetti />
            <div className="text-5xl mb-3">{chapter.emoji}</div>
            <h2 className="font-editorial-roman text-2xl mb-2" style={{ color: 'var(--text-primary)' }}>
              Histoire terminée !
            </h2>
            <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
              « {chapter.title} » n&apos;a plus de secret pour toi.
              {cpCorrect === chapter.checkpoint.length ? ' Et un sans-faute aux questions ! 🎯' : ''}
            </p>
            <p className="font-mono text-xs mb-6" style={{ color: 'var(--accent-warm)' }}>
              {alreadyDone ? 'Histoire déjà validée (relecture)' : `+${earnedXp} XP`}
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button
                onClick={closeChapter}
                className="px-5 py-2.5 rounded-lg text-xs font-bold"
                style={{ background: 'linear-gradient(135deg, #C41923 0%, #8B131B 100%)', color: '#fff', border: 'none', cursor: 'pointer' }}
              >
                📖 Histoire suivante
              </button>
              <button
                onClick={() => router.push('/decouverte')}
                className="px-5 py-2.5 rounded-lg text-xs font-bold"
                style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)', cursor: 'pointer' }}
              >
                🧭 Retour au camp de base
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  /* ══════ CHECKPOINT (2 questions) ══════ */
  if (phase === 'checkpoint') {
    const question = chapter.checkpoint[cpIndex]
    const finishCheckpoint = () => {
      const xp = completeChapter(chapter.id)
      setEarnedXp(xp)
      sound.playSuccess()
      setPhase('done')
    }
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-base)' }}>
        <DiscoveryHeader />
        <main className="flex-1 w-full max-w-xl mx-auto px-5 py-8">
          <div className="text-center mb-5">
            <span className="label-badge" style={{ backgroundColor: chapter.color + '1E', color: chapter.color }}>
              {chapter.emoji} Petit défi de fin d&apos;histoire · {cpIndex + 1}/{chapter.checkpoint.length}
            </span>
          </div>
          <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-default)' }}>
            <div className="text-center mb-5">
              <div className="text-4xl mb-3">{question.emoji}</div>
              <h3 className="text-base font-semibold leading-snug m-0" style={{ color: 'var(--text-primary)' }}>
                {question.question}
              </h3>
            </div>
            <div className="flex flex-col gap-2.5 mb-4">
              {question.options.map((opt, i) => {
                const isPicked = cpPicked === i
                const showCorrect = cpPicked !== null && opt.correct
                const showWrong = isPicked && !opt.correct
                return (
                  <motion.button
                    key={i}
                    onClick={() => {
                      if (cpPicked !== null) return
                      setCpPicked(i)
                      if (opt.correct) { setCpCorrect(c => c + 1); sound.playSuccess() }
                      else sound.playFailure()
                    }}
                    animate={showWrong ? { x: [0, -8, 8, -5, 5, 0] } : {}}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium"
                    style={{
                      backgroundColor: showCorrect ? 'rgba(74,157,124,0.15)' : showWrong ? 'rgba(194,84,80,0.12)' : 'var(--bg-elevated)',
                      border: `1.5px solid ${showCorrect ? '#4A9D7C' : showWrong ? '#C25450' : 'var(--border-default)'}`,
                      color: showCorrect ? '#4A9D7C' : showWrong ? '#C25450' : 'var(--text-primary)',
                      cursor: cpPicked === null ? 'pointer' : 'default',
                      opacity: cpPicked !== null && !showCorrect && !showWrong ? 0.45 : 1,
                    }}
                  >
                    {showCorrect ? '✅ ' : showWrong ? '❌ ' : ''}{opt.text}
                  </motion.button>
                )
              })}
            </div>
            <AnimatePresence>
              {cpPicked !== null && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <p className="text-xs leading-relaxed rounded-lg p-3 mb-3" style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-subtle)' }}>
                    💡 {question.explanation}
                  </p>
                  <button
                    onClick={() => {
                      sound.playTick()
                      if (cpIndex + 1 >= chapter.checkpoint.length) finishCheckpoint()
                      else { setCpIndex(i => i + 1); setCpPicked(null) }
                    }}
                    className="w-full py-2.5 rounded-lg text-xs font-bold"
                    style={{ background: 'linear-gradient(135deg, #C41923 0%, #8B131B 100%)', color: '#fff', border: 'none', cursor: 'pointer' }}
                  >
                    {cpIndex + 1 >= chapter.checkpoint.length ? 'Terminer l’histoire 🏁' : 'Question suivante →'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    )
  }

  /* ══════ LECTEUR DE SLIDES ══════ */
  const slide = chapter.slides[slideIndex]
  const isLastSlide = slideIndex === chapter.slides.length - 1

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-base)' }}>
      <DiscoveryHeader />
      <main className="flex-1 w-full max-w-xl mx-auto px-5 py-6 flex flex-col">

        {/* En-tête du chapitre */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={closeChapter}
            className="label-caps flex items-center gap-1"
            style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '9px' }}
          >
            <ChevronLeft size={12} /> Toutes les histoires
          </button>
          <span className="label-badge" style={{ backgroundColor: chapter.color + '1E', color: chapter.color, fontSize: '9px' }}>
            {chapter.emoji} {chapter.title}
          </span>
        </div>

        {/* Points de progression */}
        <div className="flex items-center justify-center gap-1.5 mb-5">
          {chapter.slides.map((_, i) => (
            <button
              key={i}
              onClick={() => { sound.playTick(); setSlideIndex(i) }}
              aria-label={`Page ${i + 1}`}
              style={{
                width: i === slideIndex ? '22px' : '8px',
                height: '8px', borderRadius: '4px', border: 'none', cursor: 'pointer',
                backgroundColor: i === slideIndex ? chapter.color : i < slideIndex ? chapter.color + '77' : 'var(--bg-hover)',
                transition: 'all 0.25s ease',
              }}
            />
          ))}
          <span className="w-2" />
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded"
            style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-tertiary)' }}
          >
            🏁
          </span>
        </div>

        {/* Slide */}
        <AnimatePresence mode="wait">
          <motion.div
            key={slideIndex}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 rounded-2xl p-6 sm:p-8"
            style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-default)' }}
          >
            <div className="text-center mb-4">
              <motion.div
                className="text-5xl mb-4 inline-block"
                initial={{ scale: 0.5, rotate: -8 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 12 }}
              >
                {slide.emoji}
              </motion.div>
              <h2 className="font-editorial-roman text-xl mb-3" style={{ color: 'var(--text-primary)' }}>
                {slide.title}
              </h2>
              <p className="text-sm leading-relaxed text-left sm:text-center" style={{ color: 'var(--text-secondary)' }}>
                {slide.text}
              </p>
            </div>

            {slide.widget && (
              <div className="my-5">
                <StoryWidget widget={slide.widget} />
              </div>
            )}

            {slide.funFact && (
              <div className="rounded-xl p-3.5 mb-3" style={{ backgroundColor: 'rgba(201,168,106,0.08)', border: '1px solid rgba(201,168,106,0.25)' }}>
                <span className="label-caps block mb-1" style={{ fontSize: '8px', color: 'var(--accent-warm)' }}>Le savais-tu ?</span>
                <p className="text-xs leading-relaxed m-0" style={{ color: 'var(--text-secondary)' }}>{slide.funFact}</p>
              </div>
            )}

            {slide.expertLink && (
              <div className="rounded-xl p-3.5" style={{ backgroundColor: 'rgba(92,126,146,0.08)', border: '1px dashed rgba(92,126,146,0.35)' }}>
                <span className="label-caps block mb-1" style={{ fontSize: '8px', color: 'var(--accent-cool)' }}>🤓 En mode expert</span>
                <p className="text-xs leading-relaxed m-0 font-mono" style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>{slide.expertLink}</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3 mt-5">
          <button
            onClick={() => { sound.playTick(); setSlideIndex(i => Math.max(0, i - 1)) }}
            disabled={slideIndex === 0}
            className="flex items-center gap-1 px-4 py-2.5 rounded-lg text-xs font-bold"
            style={{
              backgroundColor: 'var(--bg-elevated)', color: slideIndex === 0 ? 'var(--text-tertiary)' : 'var(--text-secondary)',
              border: '1px solid var(--border-default)', cursor: slideIndex === 0 ? 'default' : 'pointer',
              opacity: slideIndex === 0 ? 0.45 : 1,
            }}
          >
            <ChevronLeft size={13} /> Précédent
          </button>
          <button
            onClick={() => {
              sound.playTick()
              if (isLastSlide) setPhase('checkpoint')
              else setSlideIndex(i => i + 1)
            }}
            className="flex items-center gap-1 px-5 py-2.5 rounded-lg text-xs font-bold flex-1 sm:flex-none justify-center"
            style={{
              background: isLastSlide
                ? 'linear-gradient(135deg, #4A9D7C 0%, #2A5A46 100%)'
                : 'linear-gradient(135deg, #C41923 0%, #8B131B 100%)',
              color: '#fff', border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
            }}
          >
            {isLastSlide ? '🏁 Petit défi final !' : 'Suite de l’histoire'} <ChevronRight size={13} />
          </button>
        </div>
      </main>
    </div>
  )
}
