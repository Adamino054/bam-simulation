'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDiscoveryStore } from '@/store/discoveryStore'
import { Confetti } from './Confetti'
import { ScoreRing, StarRow, NewRecordBanner, useCountUp } from './GameFx'
import { CoachBar, CoachFinale, COACH_PHRASES, pickPhrase } from './Coach'
import type { CoachLine } from './Coach'
import { Floussi } from './Floussi'
import { sound } from '@/lib/audio'

const COACH_INTRO: CoachLine = { mood: 'happy', text: 'Le vent va tout faire pour pousser le ballon hors de la zone verte. Montre-lui qui est le chef !' }
const COACH_PLAYING: CoachLine = { mood: 'idle', text: 'Petites corrections, tôt et souvent : c’est le secret !' }

/**
 * 🎈 Le Gardien du Ballon — jeu d'arcade.
 * Le vent (les chocs !) fait monter et descendre les prix : maintiens le
 * ballon dans la zone verte (autour de 2 %) avec tes deux boutons.
 * C'est exactement le métier du gouverneur, version réflexes !
 */

const GAME_SECONDS = 45
const TICK_MS = 100
const TOTAL_TICKS = (GAME_SECONDS * 1000) / TICK_MS
const ZONE_MIN = 1.0
const ZONE_MAX = 3.0
const PLAYER_FORCE = 0.045 // effet du bouton par tick

interface Gust {
  emoji: string
  text: string
}

const GUSTS: Gust[] = [
  { emoji: '⛽', text: 'Pétrole plus cher !' },
  { emoji: '🌵', text: 'Sécheresse !' },
  { emoji: '🛍️', text: 'Fièvre d’achats !' },
  { emoji: '🥶', text: 'Coup de froid sur les ventes !' },
  { emoji: '🌍', text: 'Les voisins ralentissent !' },
]

interface BalloonGameProps {
  onExit: () => void
}

/* ── Décor : nuages qui dérivent ────────────────────────────────── */

function DriftingClouds() {
  const clouds = [
    { top: '12%', duration: 26, delay: 0, size: 22, opacity: 0.5 },
    { top: '34%', duration: 34, delay: 6, size: 17, opacity: 0.35 },
    { top: '58%', duration: 30, delay: 14, size: 20, opacity: 0.42 },
    { top: '78%', duration: 38, delay: 3, size: 15, opacity: 0.3 },
  ]
  return (
    <>
      {clouds.map((c, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          initial={{ x: '-40px' }}
          animate={{ x: '380px' }}
          transition={{ duration: c.duration, delay: c.delay, repeat: Infinity, ease: 'linear' }}
          className="absolute"
          style={{ top: c.top, left: 0, fontSize: c.size, opacity: c.opacity, pointerEvents: 'none' }}
        >
          ☁️
        </motion.span>
      ))}
    </>
  )
}

/* ── Écran de fin ─────────────────────────────────────────────── */

function BalloonEndScreen({
  pct, isRecord, onReplay, onExit,
}: {
  pct: number
  isRecord: boolean
  onReplay: () => void
  onExit: () => void
}) {
  const stars = pct >= 80 ? 3 : pct >= 60 ? 2 : pct >= 40 ? 1 : 0
  const xp = Math.round(pct / 2)
  const displayedXp = useCountUp(xp, 1000)
  const color = pct >= 80 ? '#C9A86A' : pct >= 50 ? '#4A9D7C' : '#C25450'

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
        <ScoreRing pct={pct} color={color} subLabel="du temps en zone verte" />
      </div>

      <StarRow stars={stars} />

      <h2 className="font-editorial-roman text-2xl mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>
        {pct >= 80 ? 'Gardien en or !' : pct >= 60 ? 'Beau pilotage !' : pct >= 40 ? 'Pas facile, ce vent !' : 'Le ballon s’est envolé...'}
      </h2>
      <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
        {pct >= 60
          ? 'Les vrais gouverneurs font exactement ça : de petits gestes, tôt et souvent.'
          : 'Astuce : agis dès que le ballon quitte la zone, sans attendre qu’il soit tout en haut !'}
      </p>
      <p className="font-mono text-sm mb-6 tabular" style={{ color: 'var(--accent-warm)', textShadow: '0 0 12px rgba(201,168,106,0.4)' }}>
        ✨ +{displayedXp} XP {pct >= 80 ? '· Badge « Ballon d’Or » 🏅' : ''}
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

export function BalloonGame({ onExit }: BalloonGameProps) {
  const addXp = useDiscoveryStore(s => s.addXp)
  const recordBalloon = useDiscoveryStore(s => s.recordBalloon)

  const [phase, setPhase] = useState<'intro' | 'countdown' | 'playing' | 'done'>('intro')
  const [countdown, setCountdown] = useState(3)
  const [inflation, setInflation] = useState(2.0)
  const [ticksLeft, setTicksLeft] = useState(TOTAL_TICKS)
  const [inZoneTicks, setInZoneTicks] = useState(0)
  const [zoneStreakTicks, setZoneStreakTicks] = useState(0)
  const [windDisplay, setWindDisplay] = useState(0)
  const [gust, setGust] = useState<Gust | null>(null)
  const [trail, setTrail] = useState<number[]>([])
  const [finalPct, setFinalPct] = useState(0)
  const [isRecord, setIsRecord] = useState(false)
  const [coach, setCoach] = useState<CoachLine>(COACH_PLAYING)

  const brakeHeld = useRef(false)
  const blowHeld = useRef(false)
  const windRef = useRef(0.01)
  const inflationRef = useRef(2.0)
  const inZoneRef = useRef(0)
  const zoneStreakRef = useRef(0)
  const ticksRef = useRef(TOTAL_TICKS)
  const prevInZoneRef = useRef(true)
  const lastCoachTickRef = useRef(-999)

  const launchCountdown = () => {
    sound.playTick()
    setCountdown(3)
    setPhase('countdown')
  }

  /* Compte à rebours 3-2-1-GO */
  useEffect(() => {
    if (phase !== 'countdown') return
    if (countdown === 0) {
      // GO !
      setInflation(2.0)
      inflationRef.current = 2.0
      windRef.current = 0.01
      inZoneRef.current = 0
      zoneStreakRef.current = 0
      ticksRef.current = TOTAL_TICKS
      setInZoneTicks(0)
      setZoneStreakTicks(0)
      setTicksLeft(TOTAL_TICKS)
      setGust(null)
      setTrail([])
      setCoach(COACH_PLAYING)
      prevInZoneRef.current = true
      lastCoachTickRef.current = -999
      setPhase('playing')
      return
    }
    sound.playTick()
    const t = setTimeout(() => setCountdown(c => c - 1), 750)
    return () => clearTimeout(t)
  }, [phase, countdown])

  const finish = useCallback(() => {
    const pct = Math.round((inZoneRef.current / TOTAL_TICKS) * 100)
    const prevBest = useDiscoveryStore.getState().getProfile().balloonBestPct
    setIsRecord(pct > prevBest && pct > 0)
    setFinalPct(pct)
    recordBalloon(pct)
    addXp(Math.round(pct / 2))
    if (pct >= 60) sound.playSuccess()
    else sound.playFailure()
    setPhase('done')
  }, [addXp, recordBalloon])

  useEffect(() => {
    if (phase !== 'playing') return
    let tickCount = 0

    const interval = setInterval(() => {
      tickCount += 1

      // Vent : marche aléatoire + rappel léger vers 0
      windRef.current += (Math.random() - 0.5) * 0.012
      windRef.current *= 0.985
      windRef.current = Math.max(-0.06, Math.min(0.06, windRef.current))

      // Rafales surprises (~ toutes les 6 s)
      if (Math.random() < TICK_MS / 6000) {
        const g = GUSTS[Math.floor(Math.random() * GUSTS.length)]
        windRef.current = (Math.random() < 0.5 ? -1 : 1) * (0.05 + Math.random() * 0.04)
        setGust(g)
        setCoach({ mood: 'surprised', text: pickPhrase(COACH_PHRASES.balloonGust) })
        lastCoachTickRef.current = tickCount
        sound.playAlert()
        setTimeout(() => setGust(null), 1800)
      }

      // Action du joueur
      let delta = windRef.current
      if (brakeHeld.current) delta -= PLAYER_FORCE
      if (blowHeld.current) delta += PLAYER_FORCE

      inflationRef.current = Math.max(-2, Math.min(9, inflationRef.current + delta))
      setInflation(inflationRef.current)
      setWindDisplay(windRef.current)

      // Traînée de comète (1 point tous les 3 ticks)
      if (tickCount % 3 === 0) {
        setTrail(prev => [inflationRef.current, ...prev].slice(0, 7))
      }

      const nowInZone = inflationRef.current >= ZONE_MIN && inflationRef.current <= ZONE_MAX
      if (nowInZone) {
        inZoneRef.current += 1
        zoneStreakRef.current += 1
        setInZoneTicks(inZoneRef.current)
        setZoneStreakTicks(zoneStreakRef.current)
      } else {
        zoneStreakRef.current = 0
        setZoneStreakTicks(0)
      }

      // Prof. Floussi réagit aux entrées/sorties de zone (max 1 réplique / 2,5 s)
      if (nowInZone !== prevInZoneRef.current && tickCount - lastCoachTickRef.current > 25) {
        lastCoachTickRef.current = tickCount
        setCoach(
          nowInZone
            ? { mood: 'happy', text: pickPhrase(COACH_PHRASES.balloonInZone) }
            : { mood: 'surprised', text: pickPhrase(COACH_PHRASES.balloonOutZone) },
        )
      }
      prevInZoneRef.current = nowInZone

      ticksRef.current -= 1
      setTicksLeft(ticksRef.current)
      if (ticksRef.current <= 0) {
        clearInterval(interval)
        finish()
      }
    }, TICK_MS)

    return () => clearInterval(interval)
  }, [phase, finish])

  /* ── Écran d'intro ─────────────────────────────────────────── */
  if (phase === 'intro') {
    return (
      <div className="relative rounded-2xl p-8 text-center overflow-hidden" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-default)' }}>
        <div className="flex items-center justify-center gap-2 mb-3">
          <Floussi mood="happy" size={72} />
          <motion.div
            className="text-6xl inline-block"
            animate={{ y: [0, -10, 0], rotate: [0, -4, 4, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            🎈
          </motion.div>
        </div>
        <h2 className="font-editorial-roman text-2xl mb-3" style={{ color: 'var(--text-primary)' }}>Le Gardien du Ballon</h2>
        <p className="text-sm leading-relaxed mb-2 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
          Le vent de l’économie fait gonfler et dégonfler le ballon des prix.
          Ta mission : le garder dans la <strong style={{ color: 'var(--data-positive)' }}>zone verte</strong> pendant {GAME_SECONDS} secondes !
        </p>
        <p className="text-xs italic mb-2 max-w-sm mx-auto" style={{ color: 'var(--accent-warm)' }}>
          « {COACH_INTRO.text} » — Prof. Floussi
        </p>
        <div className="flex justify-center gap-4 my-5 flex-wrap">
          <span className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(92,126,146,0.12)', color: 'var(--accent-cool)', border: '1px solid rgba(92,126,146,0.3)' }}>
            🧊 <strong>Freiner</strong> = le ballon descend
          </span>
          <span className="text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: 'rgba(194,84,80,0.1)', color: '#C25450', border: '1px solid rgba(194,84,80,0.3)' }}>
            🔥 <strong>Chauffer</strong> = le ballon monte
          </span>
        </div>
        <p className="text-[11px] mb-6" style={{ color: 'var(--text-tertiary)' }}>
          🤓 C’est exactement le travail du gouverneur en mode expert : garder l’inflation autour de 2 % malgré les chocs !
        </p>
        <div className="flex gap-3 justify-center">
          <motion.button
            onClick={launchCountdown}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="px-7 py-3.5 rounded-xl text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, #C41923 0%, #8B131B 100%)', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(180,25,35,0.35)' }}
          >
            🚀 C’est parti !
          </motion.button>
          <button
            onClick={onExit}
            className="px-5 py-3.5 rounded-xl text-xs font-bold"
            style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)', cursor: 'pointer' }}
          >
            ← Autres jeux
          </button>
        </div>
      </div>
    )
  }

  /* ── Écran de fin ──────────────────────────────────────────── */
  if (phase === 'done') {
    return <BalloonEndScreen pct={finalPct} isRecord={isRecord} onReplay={launchCountdown} onExit={onExit} />
  }

  /* ── Le jeu (+ compte à rebours par-dessus) ────────────────── */
  const inZone = inflation >= ZONE_MIN && inflation <= ZONE_MAX
  const balloonPct = ((inflation + 2) / 11) * 100
  const zoneBottomPct = ((ZONE_MIN + 2) / 11) * 100
  const zoneTopPct = ((ZONE_MAX + 2) / 11) * 100
  const secondsLeft = Math.ceil((ticksLeft * TICK_MS) / 1000)
  const livePct = Math.round((inZoneTicks / TOTAL_TICKS) * 100)
  const zoneStreakSec = Math.floor((zoneStreakTicks * TICK_MS) / 1000)
  const windStrength = Math.abs(windDisplay)
  const windArrows = windStrength > 0.04 ? 3 : windStrength > 0.02 ? 2 : windStrength > 0.008 ? 1 : 0

  return (
    <div className="relative rounded-2xl p-5 sm:p-7 select-none overflow-hidden" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-default)' }}>

      {/* Compte à rebours en surimpression */}
      <AnimatePresence>
        {phase === 'countdown' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: 'var(--bg-overlay)', zIndex: 40, backdropFilter: 'blur(4px)' }}
          >
            <motion.span
              key={countdown}
              initial={{ scale: 2.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', damping: 14 }}
              className="font-editorial text-7xl"
              style={{ color: countdown === 0 ? 'var(--data-positive)' : 'var(--accent-warm)' }}
            >
              {countdown === 0 ? 'GO !' : countdown}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <span
          className="font-mono text-sm font-bold tabular px-2.5 py-1 rounded-lg"
          style={{
            color: secondsLeft <= 10 ? '#C25450' : 'var(--text-primary)',
            backgroundColor: 'var(--bg-elevated)',
            border: `1px solid ${secondsLeft <= 10 ? 'rgba(194,84,80,0.4)' : 'var(--border-subtle)'}`,
            animation: secondsLeft <= 10 ? 'pulse-soft 1s ease-in-out infinite' : 'none',
          }}
        >
          ⏱️ {secondsLeft}s
        </span>

        {/* Indicateur de vent */}
        <div
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg"
          style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
        >
          <span className="text-xs">💨</span>
          <span className="font-mono text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Vent :</span>
          <span className="font-mono text-xs font-bold" style={{ color: windArrows >= 2 ? '#C25450' : 'var(--text-secondary)' }}>
            {windArrows === 0 ? '—' : (windDisplay > 0 ? '⬆️' : '⬇️').repeat(windArrows)}
          </span>
        </div>

        <span className="font-mono text-xs tabular px-2.5 py-1 rounded-lg" style={{ color: 'var(--data-positive)', backgroundColor: 'rgba(74,157,124,0.08)', border: '1px solid rgba(74,157,124,0.25)' }}>
          Zone verte : {livePct} %
        </span>
      </div>

      {/* Rafale */}
      <div style={{ height: '34px' }} className="mb-1">
        <AnimatePresence>
          {gust && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1, x: [0, -4, 4, -3, 3, 0] }}
              exit={{ opacity: 0 }}
              className="text-center text-xs font-bold py-1.5 rounded-lg"
              style={{
                backgroundColor: 'rgba(201,168,106,0.14)',
                color: 'var(--accent-warm)',
                border: '1px solid rgba(201,168,106,0.4)',
                boxShadow: '0 0 20px rgba(201,168,106,0.2)',
              }}
            >
              💨 {gust.emoji} {gust.text}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Zone de jeu : le ciel */}
      <motion.div
        animate={gust ? { x: [0, -3, 3, -2, 2, 0] } : {}}
        transition={{ duration: 0.5 }}
        className="relative rounded-xl mb-5 mx-auto"
        style={{
          height: '270px', maxWidth: '360px',
          background: 'linear-gradient(180deg, rgba(194,84,80,0.14) 0%, rgba(201,168,106,0.06) 32%, rgba(74,157,124,0.05) 55%, rgba(92,126,146,0.14) 100%)',
          border: '1px solid var(--border-subtle)', overflow: 'hidden',
        }}
      >
        <DriftingClouds />

        {/* Repères extrêmes */}
        <span className="absolute top-1.5 left-2 text-[9px] flex items-center gap-1" style={{ color: '#C25450' }}>
          <motion.span animate={{ scale: inflation > 5 ? [1, 1.3, 1] : 1 }} transition={{ duration: 0.6, repeat: Infinity }}>🥵</motion.span>
          Prix qui explosent
        </span>
        <span className="absolute bottom-1.5 left-2 text-[9px] flex items-center gap-1" style={{ color: '#5C7E92' }}>
          <motion.span animate={{ scale: inflation < 0 ? [1, 1.3, 1] : 1 }} transition={{ duration: 0.6, repeat: Infinity }}>🥶</motion.span>
          Prix qui s’écroulent
        </span>

        {/* Zone verte */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', left: 0, right: 0,
            bottom: `${zoneBottomPct}%`, height: `${zoneTopPct - zoneBottomPct}%`,
            backgroundColor: inZone ? 'rgba(74,157,124,0.20)' : 'rgba(74,157,124,0.10)',
            borderTop: '1.5px dashed rgba(74,157,124,0.6)',
            borderBottom: '1.5px dashed rgba(74,157,124,0.6)',
            boxShadow: inZone ? 'inset 0 0 30px rgba(74,157,124,0.15)' : 'none',
            transition: 'background-color 0.3s ease',
          }}
        />
        <span
          className="absolute right-2 font-mono text-[9px]"
          style={{ bottom: `${zoneTopPct}%`, color: 'var(--data-positive)' }}
        >
          Zone idéale (~2 %)
        </span>

        {/* Combo zone verte */}
        <AnimatePresence>
          {zoneStreakSec >= 3 && (
            <motion.span
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              className="absolute top-2 right-2 font-mono text-[10px] font-bold px-2 py-1 rounded-full"
              style={{
                color: '#4A9D7C', backgroundColor: 'rgba(74,157,124,0.14)',
                border: '1px solid rgba(74,157,124,0.45)',
                boxShadow: '0 0 14px rgba(74,157,124,0.3)',
              }}
            >
              ✨ combo {zoneStreakSec}s
            </motion.span>
          )}
        </AnimatePresence>

        {/* Traînée de comète */}
        {trail.map((v, i) => {
          const pct = ((v + 2) / 11) * 100
          return (
            <span
              key={i}
              aria-hidden="true"
              className="absolute rounded-full"
              style={{
                left: `calc(50% - ${10 + i * 7}px)`,
                bottom: `calc(${pct}% + 14px)`,
                width: `${7 - i * 0.8}px`, height: `${7 - i * 0.8}px`,
                backgroundColor: inZone ? 'rgba(74,157,124,0.5)' : 'rgba(201,168,106,0.45)',
                opacity: Math.max(0.06, 0.5 - i * 0.07),
                transition: 'bottom 0.12s linear',
              }}
            />
          )
        })}

        {/* Ballon */}
        <motion.div
          className="absolute left-1/2"
          animate={{ bottom: `${balloonPct}%`, rotate: inZone ? 0 : [0, -5, 5, 0] }}
          transition={{ bottom: { duration: 0.12, ease: 'linear' }, rotate: { duration: 0.5, repeat: inZone ? 0 : Infinity } }}
          style={{ transform: 'translateX(-50%)', marginLeft: '-19px', fontSize: '38px', lineHeight: 1 }}
        >
          {/* Halo quand en zone */}
          {inZone && (
            <motion.span
              aria-hidden="true"
              className="absolute rounded-full"
              animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
              transition={{ duration: 1.1, repeat: Infinity }}
              style={{
                inset: '-6px',
                border: '2px solid rgba(74,157,124,0.6)',
              }}
            />
          )}
          🎈
        </motion.div>
      </motion.div>

      {/* Boutons de contrôle (maintenir appuyé) */}
      <div className="grid grid-cols-2 gap-3 max-w-[360px] mx-auto">
        <motion.button
          onPointerDown={() => { brakeHeld.current = true }}
          onPointerUp={() => { brakeHeld.current = false }}
          onPointerLeave={() => { brakeHeld.current = false }}
          onContextMenu={e => e.preventDefault()}
          whileTap={{ scale: 0.94 }}
          className="py-4 rounded-xl text-sm font-bold"
          style={{
            backgroundColor: 'rgba(92,126,146,0.15)', color: 'var(--accent-cool)',
            border: '2px solid rgba(92,126,146,0.4)', cursor: 'pointer', touchAction: 'none',
          }}
        >
          🧊 Freiner
          <span className="block text-[9px] font-normal mt-0.5" style={{ color: 'var(--text-tertiary)' }}>maintiens appuyé</span>
        </motion.button>
        <motion.button
          onPointerDown={() => { blowHeld.current = true }}
          onPointerUp={() => { blowHeld.current = false }}
          onPointerLeave={() => { blowHeld.current = false }}
          onContextMenu={e => e.preventDefault()}
          whileTap={{ scale: 0.94 }}
          className="py-4 rounded-xl text-sm font-bold"
          style={{
            backgroundColor: 'rgba(194,84,80,0.12)', color: '#C25450',
            border: '2px solid rgba(194,84,80,0.4)', cursor: 'pointer', touchAction: 'none',
          }}
        >
          🔥 Chauffer
          <span className="block text-[9px] font-normal mt-0.5" style={{ color: 'var(--text-tertiary)' }}>maintiens appuyé</span>
        </motion.button>
      </div>

      {/* Prof. Floussi commente le pilotage en direct */}
      <div className="max-w-[360px] mx-auto mt-4">
        <CoachBar line={coach} size={48} />
      </div>
    </div>
  )
}
