'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'

const COLORS = ['#C9A86A', '#B41923', '#4A9D7C', '#5C7E92', '#F2F2EC']
const EMOJIS = ['🎉', '⭐', '🪙', '✨']

interface ConfettiProps {
  /** Nombre de particules (défaut 26) */
  count?: number
}

/**
 * Petite pluie de confettis en pur framer-motion (aucune dépendance).
 * À monter conditionnellement : elle joue une fois puis reste invisible.
 */
export function Confetti({ count = 26 }: ConfettiProps) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.45,
        duration: 1.6 + Math.random() * 1.2,
        rotate: (Math.random() - 0.5) * 720,
        drift: (Math.random() - 0.5) * 120,
        isEmoji: i % 5 === 0,
        emoji: EMOJIS[i % EMOJIS.length],
        color: COLORS[i % COLORS.length],
        size: 6 + Math.random() * 7,
      })),
    [count],
  )

  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 50 }}>
      {pieces.map(p => (
        <motion.span
          key={p.id}
          initial={{ y: -30, x: 0, opacity: 1, rotate: 0 }}
          animate={{ y: '110vh', x: p.drift, opacity: [1, 1, 0.8, 0], rotate: p.rotate }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
          style={{
            position: 'absolute',
            top: 0,
            left: `${p.left}%`,
            fontSize: p.isEmoji ? '16px' : undefined,
            width: p.isEmoji ? undefined : `${p.size}px`,
            height: p.isEmoji ? undefined : `${p.size * 0.45}px`,
            backgroundColor: p.isEmoji ? undefined : p.color,
            borderRadius: '2px',
            display: 'inline-block',
          }}
        >
          {p.isEmoji ? p.emoji : ''}
        </motion.span>
      ))}
    </div>
  )
}
