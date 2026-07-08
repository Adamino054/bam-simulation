'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { useDiscoveryProfile } from '@/store/discoveryStore'
import { DiscoveryHeader } from '@/components/discovery/DiscoveryHeader'
import { Mascot } from '@/components/discovery/Mascot'
import { QuizGame } from '@/components/discovery/QuizGame'
import { PredictionGame } from '@/components/discovery/PredictionGame'
import { MatchingGame } from '@/components/discovery/MatchingGame'
import { BalloonGame } from '@/components/discovery/BalloonGame'
import { StarRow } from '@/components/discovery/GameFx'
import { sound } from '@/lib/audio'

type GameId = 'quiz' | 'prediction' | 'matching' | 'balloon'

const ARCADE_TIPS = [
  'Chaque jeu te fait gagner de l’XP : plus tu joues, plus tu montes de niveau ! 🎮',
  'Vise les 3 étoiles ⭐⭐⭐ sur chaque jeu pour devenir un vrai maître.',
  'Le jeu des paires 🧩 est mon préféré : il t’apprend les vrais mots du mode expert.',
  'Un sans-faute au quiz débloque le badge « Sans faute » 🎯. Chiche ?',
  'Dans le Gardien du Ballon, anticipe le vent au lieu de le subir. Comme un vrai gouverneur !',
]

/** Émojis décoratifs qui flottent dans le fond du menu */
function FloatingDecor() {
  const items = [
    { emoji: '🎈', left: '6%', top: '18%', duration: 5.5, delay: 0 },
    { emoji: '🪙', left: '90%', top: '12%', duration: 6.5, delay: 1.2 },
    { emoji: '🎯', left: '84%', top: '68%', duration: 7, delay: 0.6 },
    { emoji: '🔮', left: '10%', top: '74%', duration: 6, delay: 2 },
  ]
  return (
    <>
      {items.map((it, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          className="absolute hidden sm:block"
          animate={{ y: [0, -14, 0], rotate: [0, 6, -6, 0] }}
          transition={{ duration: it.duration, delay: it.delay, repeat: Infinity, ease: 'easeInOut' }}
          style={{ left: it.left, top: it.top, fontSize: '26px', opacity: 0.16, pointerEvents: 'none' }}
        >
          {it.emoji}
        </motion.span>
      ))}
    </>
  )
}

/** 🕹️ La Salle de Jeux — les 4 mini-jeux du Mode Découverte. */
export default function ArcadePage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const currentUser = useAuthStore(s => s.currentUser)
  const profile = useDiscoveryProfile()
  const [activeGame, setActiveGame] = useState<GameId | null>(null)

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

  /* Étoiles de maîtrise par jeu (selon les records) */
  const quizPct = profile.quizBestTotal > 0 ? (profile.quizBestScore / profile.quizBestTotal) * 100 : 0
  const quizStars = quizPct >= 100 ? 3 : quizPct >= 75 ? 2 : quizPct >= 50 ? 1 : 0
  const predStars = profile.predictionBestStreak >= 10 ? 3 : profile.predictionBestStreak >= 6 ? 2 : profile.predictionBestStreak >= 3 ? 1 : 0
  const matchStars = profile.matchingBestErrors === null ? 0 : profile.matchingBestErrors === 0 ? 3 : profile.matchingBestErrors <= 2 ? 2 : 1
  const balloonStars = profile.balloonBestPct >= 80 ? 3 : profile.balloonBestPct >= 60 ? 2 : profile.balloonBestPct >= 40 ? 1 : 0
  const totalStars = quizStars + predStars + matchStars + balloonStars

  const games: {
    id: GameId
    emoji: string
    title: string
    subtitle: string
    color: string
    best: string
    stars: number
  }[] = [
    {
      id: 'quiz',
      emoji: '🎓',
      title: 'Le Grand Quiz',
      subtitle: '8 questions rigolotes, zéro jargon. Prouve que tu as tout compris !',
      color: '#4A9D7C',
      best: profile.quizPlays > 0 ? `Record : ${profile.quizBestScore}/${profile.quizBestTotal}` : 'Jamais joué',
      stars: quizStars,
    },
    {
      id: 'prediction',
      emoji: '🔮',
      title: 'Devine la suite !',
      subtitle: 'Une situation, deux futurs possibles. Enchaîne les bonnes prédictions !',
      color: '#5C7E92',
      best: profile.predictionPlays > 0 ? `Meilleure série : ${profile.predictionBestStreak} 🔥` : 'Jamais joué',
      stars: predStars,
    },
    {
      id: 'matching',
      emoji: '🧩',
      title: 'Le Traducteur',
      subtitle: 'Associe les mots savants du mode expert à leur image toute simple.',
      color: '#C9A86A',
      best: profile.matchingPlays > 0
        ? profile.matchingBestErrors === 0 ? 'Record : sans erreur ✨' : `Record : ${profile.matchingBestErrors} erreur${(profile.matchingBestErrors ?? 0) > 1 ? 's' : ''}`
        : 'Jamais joué',
      stars: matchStars,
    },
    {
      id: 'balloon',
      emoji: '🎈',
      title: 'Le Gardien du Ballon',
      subtitle: 'Jeu d’arcade : garde le ballon des prix dans la zone verte malgré le vent !',
      color: '#C25450',
      best: profile.balloonPlays > 0 ? `Record : ${profile.balloonBestPct} % en zone verte` : 'Jamais joué',
      stars: balloonStars,
    },
  ]

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-base)' }}>
      <DiscoveryHeader />
      <main className="relative flex-1 w-full max-w-2xl mx-auto px-5 sm:px-6 py-8 pb-28">

        <AnimatePresence mode="wait">
          {activeGame === null ? (
            <motion.div
              key="menu"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <FloatingDecor />

              <div className="relative text-center mb-8">
                <motion.div
                  className="text-5xl mb-3 inline-block"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  🕹️
                </motion.div>
                <h1 className="font-editorial text-3xl mb-2" style={{ color: 'var(--text-primary)' }}>La Salle de Jeux</h1>
                <p className="text-sm max-w-md mx-auto mb-3" style={{ color: 'var(--text-tertiary)' }}>
                  4 façons de t&apos;entraîner en t&apos;amusant. Chaque partie rapporte de l&apos;XP
                  et peut débloquer un badge !
                </p>
                {/* Compteur global d'étoiles */}
                <span
                  className="inline-flex items-center gap-1.5 font-mono text-[11px] font-bold px-3 py-1.5 rounded-full tabular"
                  style={{
                    color: totalStars >= 12 ? '#C9A86A' : 'var(--text-secondary)',
                    backgroundColor: 'var(--bg-panel)',
                    border: `1px solid ${totalStars >= 12 ? 'rgba(201,168,106,0.5)' : 'var(--border-default)'}`,
                    boxShadow: totalStars >= 12 ? '0 0 18px rgba(201,168,106,0.25)' : 'none',
                  }}
                >
                  ⭐ {totalStars} / 12 étoiles de maîtrise
                  {totalStars >= 12 ? ' · MAÎTRE DE LA SALLE !' : ''}
                </span>
              </div>

              <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-4">
                {games.map((game, i) => (
                  <motion.button
                    key={game.id}
                    onClick={() => { sound.playTick(); setActiveGame(game.id) }}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                    whileHover={{ y: -6, scale: 1.025 }}
                    whileTap={{ scale: 0.97 }}
                    className="relative text-left rounded-2xl p-5 overflow-hidden"
                    style={{
                      backgroundColor: 'var(--bg-panel)',
                      border: `1px solid ${game.color}40`,
                      boxShadow: `0 6px 24px ${game.color}12`,
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      aria-hidden="true"
                      style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, ${game.color} 0%, ${game.color}44 100%)` }}
                    />
                    {/* Lueur de fond au survol */}
                    <div
                      aria-hidden="true"
                      style={{
                        position: 'absolute', top: '-40px', right: '-40px', width: '130px', height: '130px',
                        background: `radial-gradient(circle, ${game.color}1A 0%, transparent 70%)`,
                        pointerEvents: 'none',
                      }}
                    />
                    <div className="flex items-start justify-between mb-3">
                      <motion.div
                        className="text-4xl"
                        whileHover={{ rotate: [0, -8, 8, 0] }}
                        transition={{ duration: 0.5 }}
                      >
                        {game.emoji}
                      </motion.div>
                      <StarRow stars={game.stars} size={13} animate={false} />
                    </div>
                    <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{game.title}</h3>
                    <p className="text-[11px] leading-snug mb-3" style={{ color: 'var(--text-secondary)' }}>
                      {game.subtitle}
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[9px] px-2 py-1 rounded" style={{ backgroundColor: 'var(--bg-base)', color: game.color, border: `1px solid ${game.color}33` }}>
                        {game.best}
                      </span>
                      <span
                        className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: `${game.color}1C`, color: game.color, border: `1px solid ${game.color}44` }}
                      >
                        Jouer →
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={activeGame}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => { sound.playTick(); setActiveGame(null) }}
                  className="label-caps flex items-center gap-1"
                  style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '9px' }}
                >
                  ← Salle de jeux
                </button>
                <span className="label-badge" style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', fontSize: '9px' }}>
                  {games.find(g => g.id === activeGame)?.emoji} {games.find(g => g.id === activeGame)?.title}
                </span>
              </div>

              {activeGame === 'quiz' && <QuizGame onExit={() => setActiveGame(null)} />}
              {activeGame === 'prediction' && <PredictionGame onExit={() => setActiveGame(null)} />}
              {activeGame === 'matching' && <MatchingGame onExit={() => setActiveGame(null)} />}
              {activeGame === 'balloon' && <BalloonGame onExit={() => setActiveGame(null)} />}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      {activeGame === null && <Mascot tips={ARCADE_TIPS} autoOpen={false} />}
    </div>
  )
}
