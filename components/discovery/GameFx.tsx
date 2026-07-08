'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * GameFx — boîte à outils d'effets visuels des mini-jeux du Mode Découverte.
 * Compteurs animés, anneau de score, +XP flottant, explosion de particules,
 * flamme de série et barre de progression segmentée.
 */

/* ── Compteur animé (count-up) ──────────────────────────────────── */

export function useCountUp(target: number, duration = 900): number {
  const [value, setValue] = useState(0)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    let raf = 0
    startRef.current = null
    const from = 0
    const tick = (t: number) => {
      if (startRef.current === null) startRef.current = t
      const p = Math.min(1, (t - startRef.current) / duration)
      // easing outCubic
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(from + (target - from) * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return value
}

/* ── Anneau de score (fin de partie) ────────────────────────────── */

interface ScoreRingProps {
  /** Pourcentage 0-100 */
  pct: number
  color: string
  /** Texte central principal (par défaut : le %) */
  centerLabel?: string
  /** Petit texte sous le centre */
  subLabel?: string
  size?: number
}

export function ScoreRing({ pct, color, centerLabel, subLabel, size = 140 }: ScoreRingProps) {
  const displayed = useCountUp(Math.round(pct), 1100)
  const stroke = 10
  const r = (size - stroke) / 2
  const circumference = 2 * Math.PI * r

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="var(--bg-hover)" strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - Math.max(0, Math.min(100, pct)) / 100) }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ filter: `drop-shadow(0 0 8px ${color}66)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-editorial-roman text-3xl tabular" style={{ color }}>
          {centerLabel ?? `${displayed}%`}
        </span>
        {subLabel && (
          <span className="label-caps mt-0.5" style={{ fontSize: '8px', color: 'var(--text-tertiary)' }}>
            {subLabel}
          </span>
        )}
      </div>
    </div>
  )
}

/* ── Étoiles de maîtrise ────────────────────────────────────────── */

export function StarRow({ stars, size = 30, animate = true }: { stars: number; size?: number; animate?: boolean }) {
  return (
    <div className="flex justify-center gap-1.5">
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          initial={animate ? { scale: 0, rotate: -40 } : false}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: animate ? 0.35 + i * 0.22 : 0, type: 'spring', damping: 10 }}
          style={{
            fontSize: size,
            lineHeight: 1,
            opacity: i < stars ? 1 : 0.16,
            filter: i < stars ? 'drop-shadow(0 2px 8px rgba(201,168,106,0.5))' : 'grayscale(1)',
          }}
        >
          ⭐
        </motion.span>
      ))}
    </div>
  )
}

/* ── +XP flottant ───────────────────────────────────────────────── */

interface XpPopProps {
  /** Incrémenter pour déclencher une nouvelle bulle (0 = rien) */
  trigger: number
  amount: number
  emoji?: string
}

export function XpPop({ trigger, amount, emoji = '✨' }: XpPopProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-2 flex justify-center" style={{ zIndex: 30 }}>
      <AnimatePresence>
        {trigger > 0 && (
          <motion.span
            key={trigger}
            initial={{ opacity: 0, y: 16, scale: 0.6 }}
            animate={{ opacity: [0, 1, 1, 0], y: -46, scale: 1.1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
            className="font-mono text-sm font-bold px-3 py-1 rounded-full"
            style={{
              color: '#C9A86A',
              backgroundColor: 'rgba(201,168,106,0.12)',
              border: '1px solid rgba(201,168,106,0.4)',
              textShadow: '0 0 14px rgba(201,168,106,0.6)',
            }}
          >
            {emoji} +{amount} XP
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── Explosion de particules (bonne réponse) ────────────────────── */

interface BurstProps {
  /** Incrémenter pour déclencher (0 = rien) */
  trigger: number
  emojis?: string[]
  count?: number
}

export function Burst({ trigger, emojis = ['⭐', '✨', '🎉'], count = 10 }: BurstProps) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden" style={{ zIndex: 25 }}>
      <AnimatePresence>
        {trigger > 0 && (
          <motion.div key={trigger} className="relative" initial={{}} animate={{}} exit={{ opacity: 0 }}>
            {Array.from({ length: count }, (_, i) => {
              const angle = (i / count) * Math.PI * 2 + (trigger % 7) * 0.3
              const dist = 70 + (i % 3) * 34
              return (
                <motion.span
                  key={i}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 0.4 }}
                  animate={{
                    x: Math.cos(angle) * dist,
                    y: Math.sin(angle) * dist,
                    opacity: 0,
                    scale: 1.15,
                    rotate: (i % 2 === 0 ? 1 : -1) * 120,
                  }}
                  transition={{ duration: 0.85, ease: 'easeOut' }}
                  className="absolute"
                  style={{ fontSize: '17px', left: '-9px', top: '-9px' }}
                >
                  {emojis[i % emojis.length]}
                </motion.span>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── Flamme de série (streak) ───────────────────────────────────── */

export function StreakFlame({ streak }: { streak: number }) {
  const hot = streak >= 5
  return (
    <div
      className="flex items-center gap-1 px-2.5 py-1 rounded-full"
      style={{
        backgroundColor: streak > 0 ? 'rgba(194,84,80,0.1)' : 'var(--bg-elevated)',
        border: `1px solid ${streak > 0 ? 'rgba(194,84,80,0.35)' : 'var(--border-subtle)'}`,
        boxShadow: hot ? '0 0 16px rgba(194,84,80,0.35)' : 'none',
        transition: 'all 0.3s ease',
      }}
    >
      <motion.span
        animate={hot ? { scale: [1, 1.25, 1], rotate: [0, -8, 8, 0] } : streak > 0 ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 0.8, repeat: Infinity }}
        style={{ fontSize: '14px', filter: streak === 0 ? 'grayscale(1)' : 'none', opacity: streak === 0 ? 0.4 : 1 }}
      >
        🔥
      </motion.span>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={streak}
          initial={{ scale: 1.6, y: -4 }}
          animate={{ scale: 1, y: 0 }}
          className="font-mono text-xs font-bold tabular"
          style={{ color: hot ? '#C25450' : streak > 0 ? 'var(--accent-warm)' : 'var(--text-tertiary)' }}
        >
          {streak > 0 ? `×${streak}` : '×0'}
        </motion.span>
      </AnimatePresence>
      {hot && (
        <motion.span
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          className="label-caps"
          style={{ fontSize: '7px', color: '#C25450' }}
        >
          En feu !
        </motion.span>
      )}
    </div>
  )
}

/* ── Progression segmentée (une case par question) ──────────────── */

export type SegmentResult = 'correct' | 'wrong' | 'current' | 'pending'

export function SegmentedProgress({ results }: { results: SegmentResult[] }) {
  return (
    <div className="flex gap-1">
      {results.map((r, i) => (
        <motion.div
          key={i}
          className="flex-1 rounded-full relative overflow-hidden"
          animate={r === 'current' ? { opacity: [1, 0.5, 1] } : {}}
          transition={{ duration: 1.4, repeat: r === 'current' ? Infinity : 0 }}
          style={{
            height: '7px',
            backgroundColor:
              r === 'correct' ? '#4A9D7C' :
              r === 'wrong' ? '#C25450' :
              r === 'current' ? 'var(--accent-warm)' :
              'var(--bg-hover)',
            boxShadow: r === 'correct' ? '0 0 6px rgba(74,157,124,0.4)' : 'none',
          }}
        />
      ))}
    </div>
  )
}

/* ── Bandeau "Nouveau record" ───────────────────────────────────── */

export function NewRecordBanner({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7, rotate: -3 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ type: 'spring', damping: 11, delay: 0.6 }}
      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full mb-3"
      style={{
        background: 'linear-gradient(135deg, rgba(201,168,106,0.2) 0%, rgba(180,25,35,0.14) 100%)',
        border: '1px solid rgba(201,168,106,0.5)',
        boxShadow: '0 0 24px rgba(201,168,106,0.25)',
      }}
    >
      <motion.span animate={{ rotate: [0, 14, -14, 0] }} transition={{ duration: 1, repeat: Infinity }} style={{ fontSize: '14px' }}>
        🏆
      </motion.span>
      <span className="text-[11px] font-bold" style={{ color: 'var(--accent-warm)', letterSpacing: '0.06em' }}>
        NOUVEAU RECORD !
      </span>
    </motion.div>
  )
}
