'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Gamepad2,
  LockKeyhole,
  Play,
  Sailboat,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useDiscoveryProfile } from '@/store/discoveryStore'
import {
  DISCOVERY_BADGES,
  DISCOVERY_LEVELS,
  MASCOT_TIPS_HUB,
  STORY_CHAPTERS,
  getLevelProgress,
} from '@/engine/discovery'
import { DiscoveryHeader } from '@/components/discovery/DiscoveryHeader'
import { Floussi } from '@/components/discovery/Floussi'
import { AssistantBot } from '@/components/ui/AssistantBot'
import { sound } from '@/lib/audio'

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
}

const activityFeed = [
  {
    kicker: 'Prix',
    title: 'Quand les prix montent trop vite, la banque centrale ralentit le jeu.',
    detail: 'Le taux directeur agit comme un frein ou un accelerateur pour le credit.',
  },
  {
    kicker: 'Emploi',
    title: 'Une economie en forme cree plus facilement des emplois.',
    detail: 'Dans le simulateur, tes decisions influencent la confiance puis l activite.',
  },
  {
    kicker: 'Confiance',
    title: 'La credibilite se gagne petit a petit.',
    detail: 'Des decisions stables aident les citoyens et les banques a anticiper.',
  },
]

export default function DiscoveryHubPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [tipIndex, setTipIndex] = useState(0)
  const [feedIndex, setFeedIndex] = useState(0)
  const currentUser = useAuthStore(s => s.currentUser)
  const getCurrentPlayer = useAuthStore(s => s.getCurrentPlayer)
  const profile = useDiscoveryProfile()

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (mounted && !currentUser) {
      router.push('/login')
    }
  }, [mounted, currentUser, router])

  useEffect(() => {
    const tipTimer = window.setInterval(() => {
      setTipIndex(index => (index + 1) % MASCOT_TIPS_HUB.length)
    }, 6500)
    const feedTimer = window.setInterval(() => {
      setFeedIndex(index => (index + 1) % activityFeed.length)
    }, 4200)

    return () => {
      window.clearInterval(tipTimer)
      window.clearInterval(feedTimer)
    }
  }, [])

  const player = getCurrentPlayer()
  const progress = getLevelProgress(profile.xp)
  const chaptersDone = profile.completedChapters.length
  const gamesPlayed = profile.quizPlays + profile.predictionPlays + profile.matchingPlays + profile.balloonPlays

  const journey = useMemo(() => {
    const storyPct = Math.round((chaptersDone / STORY_CHAPTERS.length) * 100)
    const gamePct = Math.min(100, Math.round((gamesPlayed / 4) * 100))
    const missionPct = Math.min(100, Math.round((profile.missionBestStars / 3) * 100))

    return [
      {
        id: 'stories',
        order: '01',
        icon: BookOpen,
        title: 'Histoires interactives',
        subtitle: `${STORY_CHAPTERS.length} chapitres courts pour comprendre sans formule.`,
        href: '/decouverte/histoire',
        color: '#C9A86A',
        progressLabel: `${chaptersDone}/${STORY_CHAPTERS.length}`,
        progressPct: storyPct,
        cta: chaptersDone === 0 ? 'Commencer' : chaptersDone >= STORY_CHAPTERS.length ? 'Relire' : 'Continuer',
        complete: chaptersDone >= STORY_CHAPTERS.length,
        recommended: chaptersDone < STORY_CHAPTERS.length,
      },
      {
        id: 'games',
        order: '02',
        icon: Gamepad2,
        title: 'Salle de jeux',
        subtitle: 'Quiz, predictions, paires et ballon pour tester tes reflexes.',
        href: '/decouverte/jeux',
        color: '#4A9D7C',
        progressLabel: `${gamesPlayed} partie${gamesPlayed > 1 ? 's' : ''}`,
        progressPct: gamePct,
        cta: 'Jouer',
        complete: gamesPlayed >= 4,
        recommended: chaptersDone >= STORY_CHAPTERS.length && gamesPlayed < 4,
      },
      {
        id: 'mission',
        order: '03',
        icon: Sailboat,
        title: 'Mission capitaine',
        subtitle: 'Pilote une economie pendant 2 ans avec des choix simples et visibles.',
        href: '/decouverte/mission',
        color: '#B41923',
        progressLabel: profile.missionsCompleted === 0 ? 'A tenter' : `${profile.missionBestStars}/3 etoiles`,
        progressPct: missionPct,
        cta: profile.missionsCompleted === 0 ? 'Partir' : 'Rejouer',
        complete: profile.missionBestStars >= 3,
        recommended: chaptersDone >= STORY_CHAPTERS.length && gamesPlayed >= 4 && profile.missionBestStars < 2,
      },
      {
        id: 'challenge',
        order: '04',
        icon: Trophy,
        title: 'Challenge millionnaire',
        subtitle: 'Un defi bonus pour verifier que les bons reflexes sont la.',
        href: '/decouverte/millionaire',
        color: '#5C7E92',
        progressLabel: profile.quizBestScore > 0 ? `Record ${profile.quizBestScore}` : 'Bonus',
        progressPct: profile.quizBestScore > 0 ? 100 : 0,
        cta: 'Defier',
        complete: profile.quizBestScore > 0,
        recommended: chaptersDone >= STORY_CHAPTERS.length && gamesPlayed >= 4 && profile.missionBestStars >= 2,
      },
    ]
  }, [chaptersDone, gamesPlayed, profile.missionBestStars, profile.missionsCompleted, profile.quizBestScore])

  const recommended = journey.find(item => item.recommended) ?? journey[0]
  const totalProgress = Math.min(
    100,
    Math.round(
      (chaptersDone / STORY_CHAPTERS.length) * 35 +
      (Math.min(gamesPlayed, 4) / 4) * 25 +
      (Math.min(profile.missionBestStars, 3) / 3) * 40
    )
  )

  const go = (path: string) => {
    sound.playTick()
    router.push(path)
  }

  const askFloussi = () => {
    sound.playTick()
    window.dispatchEvent(new CustomEvent('open-cbs-assistant', {
      detail: {
        query: `Je suis en mode decouverte avec ${profile.xp} XP. Quelle activite me conseilles-tu maintenant ?`,
      },
    }))
  }

  if (!mounted || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-base)' }}>
        <p className="label-caps" style={{ color: 'var(--text-tertiary)' }}>Chargement...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--bg-base)' }}>
      <DiscoveryHeader backHref="/choix" backLabel="Choix du mode" />

      <main className="flex-1 w-full max-w-6xl mx-auto px-5 sm:px-6 py-6 pb-28">
        <section className="relative min-h-[calc(100vh-120px)] flex flex-col justify-center gap-7">
          <motion.div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-6 lg:gap-10 items-center" {...fadeUp}>
            <div className="relative z-10 py-3">
              <motion.div
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg mb-4"
                style={{ backgroundColor: 'rgba(201,168,106,0.12)', color: 'var(--accent-warm)', border: '1px solid rgba(201,168,106,0.24)' }}
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Sparkles size={15} />
                <span className="label-caps">Campus interactif</span>
              </motion.div>

              <h1 className="font-editorial text-4xl sm:text-6xl lg:text-7xl leading-[0.95] mb-5" style={{ color: 'var(--text-primary)' }}>
                L&apos;economie devient une aventure.
              </h1>

              <div className="h-[88px] sm:h-[72px] max-w-2xl mb-6">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={tipIndex}
                    className="text-sm sm:text-base leading-relaxed"
                    style={{ color: 'var(--text-secondary)' }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                  >
                    {MASCOT_TIPS_HUB[tipIndex]}
                  </motion.p>
                </AnimatePresence>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => go(recommended.href)}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-bold"
                  style={{ backgroundColor: recommended.color, color: '#fff', border: 'none', boxShadow: `0 12px 30px ${recommended.color}30` }}
                >
                  <Play size={16} fill="currentColor" />
                  {recommended.cta} maintenant
                </button>
                <button
                  onClick={askFloussi}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-bold"
                  style={{ backgroundColor: 'var(--bg-panel)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }}
                >
                  <Sparkles size={16} />
                  Demander a Floussi
                </button>
              </div>
            </div>

            <motion.div
              className="relative min-h-[360px] rounded-lg overflow-hidden"
              style={{
                background:
                  'linear-gradient(135deg, rgba(180,25,35,0.10), rgba(201,168,106,0.08) 46%, rgba(74,157,124,0.10))',
                border: '1px solid var(--border-default)',
              }}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.12 }}
            >
              <div className="absolute inset-x-0 top-0 h-16" style={{ background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.16) 0 1px, transparent 1px 36px)' }} />
              <div className="absolute inset-x-0 bottom-0 h-24" style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.10), transparent)' }} />

              <motion.div
                className="absolute left-1/2 top-[18%] -translate-x-1/2"
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Floussi size={156} mood="happy" />
              </motion.div>

              <div className="absolute left-4 right-4 bottom-4 grid grid-cols-3 gap-3">
                {[
                  { icon: Zap, label: 'XP', value: profile.xp, color: '#C9A86A' },
                  { icon: Trophy, label: 'Badges', value: `${profile.badges.length}/${DISCOVERY_BADGES.length}`, color: '#B41923' },
                  { icon: Target, label: 'Parcours', value: `${totalProgress}%`, color: '#4A9D7C' },
                ].map(stat => {
                  const Icon = stat.icon
                  return (
                    <div
                      key={stat.label}
                      className="rounded-lg p-3 min-h-[88px]"
                      style={{ backgroundColor: 'rgba(255,255,255,0.76)', border: '1px solid rgba(255,255,255,0.75)' }}
                    >
                      <Icon size={18} style={{ color: stat.color }} />
                      <p className="font-mono text-xl tabular mt-2 leading-none" style={{ color: 'var(--text-primary)' }}>{stat.value}</p>
                      <p className="label-caps mt-1" style={{ color: 'var(--text-tertiary)' }}>{stat.label}</p>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            className="grid lg:grid-cols-[220px_1fr_260px] gap-4 items-stretch"
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.16 }}
          >
            <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-default)' }}>
              <div
                className="w-28 h-28 rounded-full mx-auto flex items-center justify-center"
                style={{ background: `conic-gradient(#C9A86A ${progress.progressPct}%, rgba(201,168,106,0.15) 0)` }}
              >
                <div className="w-[86px] h-[86px] rounded-full flex flex-col items-center justify-center" style={{ backgroundColor: 'var(--bg-panel)' }}>
                  <span className="text-2xl">{progress.current.emoji}</span>
                  <span className="font-mono text-xs tabular" style={{ color: 'var(--text-primary)' }}>{progress.progressPct}%</span>
                </div>
              </div>
              <p className="text-center text-sm font-bold mt-3" style={{ color: 'var(--text-primary)' }}>
                Niveau {progress.current.level} · {progress.current.title}
              </p>
              <p className="text-center text-[11px] mt-1" style={{ color: 'var(--text-tertiary)' }}>
                {progress.next ? `${progress.next.minXp - profile.xp} XP avant ${progress.next.title}` : 'Niveau maximum atteint'}
              </p>
            </div>

            <div className="rounded-lg p-4 flex flex-col justify-between" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-default)' }}>
              <div className="flex items-center justify-between gap-3 mb-3">
                <p className="label-caps" style={{ color: 'var(--accent-cool)' }}>Le saviez-vous ?</p>
                <span className="font-mono text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{feedIndex + 1}/{activityFeed.length}</span>
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={feedIndex}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                >
                  <span className="label-badge" style={{ backgroundColor: 'rgba(92,126,146,0.12)', color: '#5C7E92' }}>
                    {activityFeed[feedIndex].kicker}
                  </span>
                  <h2 className="font-editorial-roman text-xl mt-3 mb-2" style={{ color: 'var(--text-primary)' }}>
                    {activityFeed[feedIndex].title}
                  </h2>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {activityFeed[feedIndex].detail}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="rounded-lg p-4" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-default)' }}>
              <p className="label-caps mb-3" style={{ color: 'var(--accent-warm)' }}>Route des niveaux</p>
              <div className="flex items-center justify-between gap-1">
                {DISCOVERY_LEVELS.map(level => {
                  const reached = profile.xp >= level.minXp
                  return (
                    <div key={level.level} className="flex flex-col items-center gap-1 flex-1" title={`${level.title} (${level.minXp} XP)`}>
                      <span className="text-lg" style={{ opacity: reached ? 1 : 0.26, filter: reached ? 'none' : 'grayscale(1)' }}>
                        {level.emoji}
                      </span>
                      <span className="font-mono text-[9px]" style={{ color: reached ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}>
                        {level.minXp}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </section>

        <section className="py-10">
          <div className="flex items-end justify-between gap-4 mb-4">
            <div>
              <p className="label-caps mb-2" style={{ color: 'var(--accent-warm)' }}>Parcours</p>
              <h2 className="font-editorial-roman text-2xl sm:text-3xl" style={{ color: 'var(--text-primary)' }}>
                Ton prochain bon mouvement, {player?.pseudo ?? 'capitaine'}.
              </h2>
            </div>
            <span className="hidden sm:inline-flex font-mono text-sm tabular" style={{ color: 'var(--text-tertiary)' }}>
              {totalProgress}% complete
            </span>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            {journey.map((item, index) => {
              const Icon = item.icon
              return (
                <motion.button
                  key={item.id}
                  onClick={() => go(item.href)}
                  className="relative text-left rounded-lg p-4 min-h-[230px] overflow-hidden"
                  style={{
                    backgroundColor: 'var(--bg-panel)',
                    border: `1px solid ${item.recommended ? item.color + '88' : 'var(--border-default)'}`,
                    boxShadow: item.recommended ? `0 14px 38px ${item.color}18` : 'none',
                  }}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.06 }}
                  whileHover={{ y: -5 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="flex items-start justify-between gap-3 mb-5">
                    <div className="w-11 h-11 rounded-lg flex items-center justify-center" style={{ backgroundColor: item.color + '18', color: item.color }}>
                      <Icon size={22} />
                    </div>
                    <span className="font-mono text-xs" style={{ color: 'var(--text-tertiary)' }}>{item.order}</span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{item.title}</h3>
                    {item.complete && <CheckCircle2 size={15} style={{ color: '#4A9D7C' }} />}
                  </div>
                  <p className="text-xs leading-relaxed mb-5" style={{ color: 'var(--text-secondary)' }}>{item.subtitle}</p>

                  <div className="absolute left-4 right-4 bottom-4">
                    {item.recommended && (
                      <span className="inline-flex items-center gap-1 label-badge mb-3" style={{ backgroundColor: item.color + '18', color: item.color }}>
                        <Sparkles size={11} />
                        Recommande
                      </span>
                    )}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="progress-bar flex-1" style={{ height: 6 }}>
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: item.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${item.progressPct}%` }}
                          transition={{ duration: 0.8, delay: 0.2 + index * 0.08 }}
                        />
                      </div>
                      <span className="font-mono text-[10px] tabular" style={{ color: 'var(--text-tertiary)' }}>{item.progressLabel}</span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-bold" style={{ color: item.color }}>
                      {item.cta}
                      <ArrowRight size={13} />
                    </span>
                  </div>
                </motion.button>
              )
            })}
          </div>
        </section>

        <section className="grid lg:grid-cols-[1fr_330px] gap-6 pb-8">
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <p className="label-caps" style={{ color: 'var(--accent-cool)' }}>
                Trophees · {profile.badges.length}/{DISCOVERY_BADGES.length}
              </p>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-6 gap-3">
              {DISCOVERY_BADGES.map(badge => {
                const unlocked = profile.badges.includes(badge.id)
                return (
                  <div
                    key={badge.id}
                    className="relative rounded-lg p-3 min-h-[110px] flex flex-col items-center justify-center text-center"
                    title={`${badge.title} - ${badge.description}`}
                    style={{
                      backgroundColor: unlocked ? badge.color + '12' : 'var(--bg-panel)',
                      border: `1px solid ${unlocked ? badge.color + '55' : 'var(--border-subtle)'}`,
                    }}
                  >
                    <div className="text-3xl mb-2" style={{ opacity: unlocked ? 1 : 0.22, filter: unlocked ? 'none' : 'grayscale(1)' }}>
                      {badge.emoji}
                    </div>
                    <span className="text-[10px] font-bold leading-tight" style={{ color: unlocked ? badge.color : 'var(--text-tertiary)' }}>
                      {badge.title}
                    </span>
                    {!unlocked && (
                      <LockKeyhole size={12} className="absolute top-2 right-2" style={{ color: 'var(--text-tertiary)' }} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-lg p-5 flex flex-col justify-between" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-default)' }}>
            <div>
              <span className="text-3xl">🏛️</span>
              <h3 className="font-editorial-roman text-xl mt-3 mb-2" style={{ color: 'var(--text-primary)' }}>
                Passer en mode expert
              </h3>
              <p className="text-xs leading-relaxed mb-5" style={{ color: 'var(--text-secondary)' }}>
                La Mission capitaine utilise la meme economie que le simulateur expert. Quand tu te sens pret,
                tu peux ouvrir le tableau de bord complet et piloter les vrais indicateurs.
              </p>
            </div>
            <button
              onClick={() => go('/dashboard')}
              className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg text-sm font-bold"
              style={{ backgroundColor: '#B41923', color: '#fff', border: 'none' }}
            >
              Ouvrir le mode expert
              <ArrowRight size={16} />
            </button>
          </div>
        </section>
      </main>

      <AssistantBot messages={[]} context="discovery" />
    </div>
  )
}
