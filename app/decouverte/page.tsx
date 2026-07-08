'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ChevronRight, Lock } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useDiscoveryProfile } from '@/store/discoveryStore'
import {
  STORY_CHAPTERS, DISCOVERY_BADGES, getLevelProgress,
  MASCOT_TIPS_HUB, DISCOVERY_LEVELS,
} from '@/engine/discovery'
import { DiscoveryHeader } from '@/components/discovery/DiscoveryHeader'
import { Mascot } from '@/components/discovery/Mascot'
import { sound } from '@/lib/audio'

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
}

/** Hub du Mode Découverte : le point de départ de l'aventure sans maths. */
export default function DiscoveryHubPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const currentUser = useAuthStore(s => s.currentUser)
  const getCurrentPlayer = useAuthStore(s => s.getCurrentPlayer)
  const profile = useDiscoveryProfile()

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

  const player = getCurrentPlayer()
  const progress = getLevelProgress(profile.xp)
  const chaptersDone = profile.completedChapters.length
  const gamesPlayed = profile.quizPlays + profile.predictionPlays + profile.matchingPlays + profile.balloonPlays

  const go = (path: string) => {
    sound.playTick()
    router.push(path)
  }

  const steps = [
    {
      number: 1,
      emoji: '📖',
      title: 'Les Histoires',
      subtitle: `${STORY_CHAPTERS.length} petites aventures pour tout comprendre, sans une seule formule.`,
      color: '#C9A86A',
      href: '/decouverte/histoire',
      progressLabel: `${chaptersDone} / ${STORY_CHAPTERS.length} terminées`,
      progressPct: (chaptersDone / STORY_CHAPTERS.length) * 100,
      cta: chaptersDone === 0 ? 'Lire la première histoire' : chaptersDone >= STORY_CHAPTERS.length ? 'Relire les histoires' : 'Continuer la lecture',
      recommended: chaptersDone < STORY_CHAPTERS.length,
    },
    {
      number: 2,
      emoji: '🕹️',
      title: 'La Salle de Jeux',
      subtitle: '4 mini-jeux pour t’entraîner : quiz, prédictions, paires magiques et le Gardien du Ballon.',
      color: '#4A9D7C',
      href: '/decouverte/jeux',
      progressLabel: gamesPlayed === 0 ? 'Jamais visitée' : `${gamesPlayed} partie${gamesPlayed > 1 ? 's' : ''} jouée${gamesPlayed > 1 ? 's' : ''}`,
      progressPct: Math.min(100, gamesPlayed * 12),
      cta: 'Entrer dans la salle',
      recommended: chaptersDone >= STORY_CHAPTERS.length && gamesPlayed === 0,
    },
    {
      number: 3,
      emoji: '⛵',
      title: 'La Mission Capitaine',
      subtitle: 'Prends les commandes d’une vraie économie pendant 2 ans. La même que le mode expert... sans les chiffres qui piquent !',
      color: '#B41923',
      href: '/decouverte/mission',
      progressLabel: profile.missionsCompleted === 0
        ? 'Jamais tentée'
        : `${profile.missionsCompleted} mission${profile.missionsCompleted > 1 ? 's' : ''} · Record : ${'⭐'.repeat(Math.max(1, profile.missionBestStars))}`,
      progressPct: Math.min(100, profile.missionBestStars * 33.4),
      cta: profile.missionsCompleted === 0 ? 'Prendre la barre' : 'Repartir en mer',
      recommended: gamesPlayed > 0 && profile.missionsCompleted === 0,
    },
  ]

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-base)' }}>
      <DiscoveryHeader backHref="/choix" backLabel="Choix du mode" />

      <main className="flex-1 w-full max-w-4xl mx-auto px-5 sm:px-6 py-8 pb-28">

        {/* ══════ HERO ══════ */}
        <motion.div className="text-center mb-8" {...fadeUp}>
          <motion.div
            className="text-5xl mb-3 inline-block"
            animate={{ rotate: [0, -6, 6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            🧭
          </motion.div>
          <h1 className="font-editorial text-3xl sm:text-4xl mb-2" style={{ color: 'var(--text-primary)' }}>
            Ton aventure, {player?.pseudo} !
          </h1>
          <p className="text-sm max-w-lg mx-auto" style={{ color: 'var(--text-tertiary)' }}>
            Ici, pas de formules ni de gros mots d&apos;économistes. Juste des histoires,
            des jeux... et à la fin, tu comprendras tout ce qui se passe dans le mode expert. Promis ! 🤞
          </p>
        </motion.div>

        {/* ══════ CARTE NIVEAU ══════ */}
        <motion.div
          className="rounded-2xl p-5 mb-8"
          style={{
            background: 'linear-gradient(135deg, rgba(201,168,106,0.08) 0%, rgba(180,25,35,0.05) 100%)',
            border: '1px solid rgba(201,168,106,0.25)',
          }}
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.08 }}
        >
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-4xl">{progress.current.emoji}</span>
            <div className="flex-1 min-w-[200px]">
              <div className="flex items-baseline justify-between mb-1 gap-3">
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  Niveau {progress.current.level} · {progress.current.title}
                </span>
                <span className="font-mono text-[10px] tabular" style={{ color: 'var(--text-tertiary)' }}>
                  {profile.xp} XP{progress.next ? ` / ${progress.next.minXp} pour ${progress.next.title} ${progress.next.emoji}` : ' · Niveau maximum !'}
                </span>
              </div>
              <div className="progress-bar" style={{ height: '8px' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #C9A86A 0%, #B41923 100%)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress.progressPct}%` }}
                  transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            </div>
          </div>
          {/* Route des niveaux */}
          <div className="flex justify-between mt-4 gap-1">
            {DISCOVERY_LEVELS.map(lvl => {
              const reached = profile.xp >= lvl.minXp
              return (
                <div key={lvl.level} className="flex flex-col items-center gap-0.5 flex-1" title={`${lvl.title} (${lvl.minXp} XP)`}>
                  <span className="text-base" style={{ opacity: reached ? 1 : 0.28, filter: reached ? 'none' : 'grayscale(1)' }}>
                    {lvl.emoji}
                  </span>
                  <span className="text-[8px] text-center leading-tight hidden sm:block" style={{ color: reached ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}>
                    {lvl.title}
                  </span>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* ══════ LE PARCOURS ══════ */}
        <motion.div className="flex items-center gap-3 mb-4" {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.12 }}>
          <h2 className="label-caps m-0" style={{ color: 'var(--accent-warm)' }}>Ton parcours en 3 étapes</h2>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle)' }} />
        </motion.div>

        <div className="flex flex-col gap-4 mb-10">
          {steps.map((step, i) => (
            <motion.button
              key={step.number}
              onClick={() => go(step.href)}
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.15 + i * 0.07 }}
              whileHover={{ x: 6, scale: 1.005 }}
              whileTap={{ scale: 0.99 }}
              className="relative w-full text-left rounded-2xl p-5 flex items-center gap-4 sm:gap-5 overflow-hidden"
              style={{
                backgroundColor: 'var(--bg-panel)',
                border: `1px solid ${step.recommended ? step.color + '66' : 'var(--border-default)'}`,
                boxShadow: step.recommended ? `0 6px 28px ${step.color}18` : 'none',
                cursor: 'pointer',
              }}
            >
              {/* Numéro d'étape */}
              <div
                className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-editorial text-lg font-bold"
                style={{ backgroundColor: step.color + '1E', color: step.color, border: `1.5px solid ${step.color}55` }}
              >
                {step.number}
              </div>

              <div className="text-3xl sm:text-4xl shrink-0">{step.emoji}</div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{step.title}</span>
                  {step.recommended && (
                    <span className="label-badge" style={{ backgroundColor: step.color + '1E', color: step.color, fontSize: '8px' }}>
                      ✨ Recommandé
                    </span>
                  )}
                </div>
                <p className="text-[11px] leading-snug mb-2" style={{ color: 'var(--text-secondary)' }}>
                  {step.subtitle}
                </p>
                <div className="flex items-center gap-2.5">
                  <div className="progress-bar flex-1 max-w-[160px]" style={{ height: '5px' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${step.progressPct}%`, backgroundColor: step.color }}
                    />
                  </div>
                  <span className="font-mono text-[9px] tabular" style={{ color: 'var(--text-tertiary)' }}>
                    {step.progressLabel}
                  </span>
                </div>
              </div>

              <span
                className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold px-3 py-2 rounded-lg shrink-0"
                style={{ backgroundColor: step.color + '18', color: step.color, border: `1px solid ${step.color}44` }}
              >
                {step.cta}
                <ChevronRight size={12} />
              </span>
            </motion.button>
          ))}
        </div>

        {/* ══════ BADGES ══════ */}
        <motion.div className="flex items-center gap-3 mb-4" {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.3 }}>
          <h2 className="label-caps m-0" style={{ color: 'var(--accent-cool)' }}>
            Tes trophées · {profile.badges.length} / {DISCOVERY_BADGES.length}
          </h2>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-subtle)' }} />
        </motion.div>

        <motion.div
          className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2.5 mb-10"
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.34 }}
        >
          {DISCOVERY_BADGES.map(badge => {
            const unlocked = profile.badges.includes(badge.id)
            return (
              <div
                key={badge.id}
                className="rounded-xl p-3 text-center relative"
                title={`${badge.title} — ${badge.description}`}
                style={{
                  backgroundColor: unlocked ? badge.color + '14' : 'var(--bg-panel)',
                  border: `1px solid ${unlocked ? badge.color + '55' : 'var(--border-subtle)'}`,
                }}
              >
                <div className="text-2xl mb-1" style={{ opacity: unlocked ? 1 : 0.25, filter: unlocked ? 'none' : 'grayscale(1)' }}>
                  {badge.emoji}
                </div>
                <span className="text-[8px] font-bold block leading-tight" style={{ color: unlocked ? badge.color : 'var(--text-tertiary)' }}>
                  {badge.title}
                </span>
                {!unlocked && (
                  <Lock size={9} className="absolute top-1.5 right-1.5" style={{ color: 'var(--text-tertiary)' }} />
                )}
              </div>
            )
          })}
        </motion.div>

        {/* ══════ PONT VERS LE MODE EXPERT ══════ */}
        <motion.div
          className="rounded-2xl p-6 text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(180,25,35,0.07) 0%, rgba(92,126,146,0.06) 100%)',
            border: '1px solid var(--border-default)',
          }}
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.4 }}
        >
          <div className="text-3xl mb-2">🏛️</div>
          <h3 className="font-editorial-roman text-lg mb-1.5" style={{ color: 'var(--text-primary)' }}>
            Tu te sens prêt pour la cour des grands ?
          </h3>
          <p className="text-xs max-w-md mx-auto mb-4" style={{ color: 'var(--text-secondary)' }}>
            Le mode expert utilise exactement la même économie que ta Mission Capitaine :
            mêmes prix, mêmes emplois, même confiance... mais avec toutes les manettes et les vrais chiffres.
            {profile.missionBestStars >= 2
              ? ' Et vu tes étoiles, tu es largement prêt ! 💪'
              : ' Termine d’abord une mission avec 2 étoiles pour partir confiant !'}
          </p>
          <button
            onClick={() => go('/dashboard')}
            className="px-5 py-2.5 rounded-lg text-xs font-bold"
            style={{
              background: 'linear-gradient(135deg, #C41923 0%, #8B131B 100%)',
              color: '#fff', border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(180,25,35,0.3)',
            }}
          >
            Essayer le mode expert →
          </button>
        </motion.div>
      </main>

      <Mascot tips={MASCOT_TIPS_HUB} />
    </div>
  )
}
