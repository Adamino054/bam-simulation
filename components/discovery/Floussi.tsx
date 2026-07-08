'use client'

import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'

/**
 * Floussi — la pièce d'or professeur, personnage officiel du Mode Découverte.
 * Dessiné en SVG pur et animé avec framer-motion : yeux qui clignent,
 * expressions qui changent selon l'humeur, bras qui se lèvent, reflet qui
 * balaie la pièce... Aucune image externe.
 */

export type FloussiMood = 'idle' | 'happy' | 'excited' | 'sad' | 'surprised' | 'thinking'

interface FloussiProps {
  mood?: FloussiMood
  size?: number
  /** Chapeau de diplômé (look professeur) */
  cap?: boolean
}

/** Animations du corps entier selon l'humeur */
const BODY_VARIANTS: Variants = {
  idle:      { y: [0, -3, 0], rotate: 0, scale: 1, transition: { y: { duration: 2.6, repeat: Infinity, ease: 'easeInOut' } } },
  happy:     { y: [0, -6, 0], rotate: [0, -3, 3, 0], scale: 1.02, transition: { duration: 0.9, repeat: Infinity, ease: 'easeInOut' } },
  excited:   { y: [0, -10, 0], rotate: [0, -6, 6, 0], scale: [1, 1.06, 1], transition: { duration: 0.65, repeat: Infinity, ease: 'easeInOut' } },
  sad:       { y: 4, rotate: -4, scale: 0.97, transition: { duration: 0.6 } },
  surprised: { y: [0, -7, 0], rotate: 0, scale: [1, 1.12, 1.05], transition: { duration: 0.45 } },
  thinking:  { y: [0, -2, 0], rotate: 4, scale: 1, transition: { y: { duration: 3, repeat: Infinity, ease: 'easeInOut' } } },
}

/** Bouches (path SVG) par humeur */
function Mouth({ mood }: { mood: FloussiMood }) {
  switch (mood) {
    case 'happy':
      return <path d="M44 74 Q60 90 76 74" fill="none" stroke="#5A3A12" strokeWidth="4" strokeLinecap="round" />
    case 'excited':
      return (
        <g>
          <path d="M44 72 Q60 96 76 72 Z" fill="#5A3A12" />
          <path d="M50 82 Q60 90 70 82 Q60 94 50 82 Z" fill="#D96A5E" />
        </g>
      )
    case 'sad':
      return <path d="M46 84 Q60 72 74 84" fill="none" stroke="#5A3A12" strokeWidth="4" strokeLinecap="round" />
    case 'surprised':
      return <ellipse cx="60" cy="80" rx="7" ry="9" fill="#5A3A12" />
    case 'thinking':
      return <path d="M48 80 Q60 82 70 78" fill="none" stroke="#5A3A12" strokeWidth="3.5" strokeLinecap="round" />
    default:
      return <path d="M47 76 Q60 86 73 76" fill="none" stroke="#5A3A12" strokeWidth="4" strokeLinecap="round" />
  }
}

/** Sourcils par humeur */
function Brows({ mood }: { mood: FloussiMood }) {
  if (mood === 'sad') {
    return (
      <g stroke="#5A3A12" strokeWidth="3" strokeLinecap="round">
        <path d="M38 48 L50 53" />
        <path d="M82 48 L70 53" />
      </g>
    )
  }
  if (mood === 'surprised') {
    return (
      <g stroke="#5A3A12" strokeWidth="3" strokeLinecap="round">
        <path d="M38 44 Q45 40 52 44" fill="none" />
        <path d="M68 44 Q75 40 82 44" fill="none" />
      </g>
    )
  }
  if (mood === 'thinking') {
    return (
      <g stroke="#5A3A12" strokeWidth="3" strokeLinecap="round">
        <path d="M38 46 Q45 43 52 46" fill="none" />
        <path d="M68 50 L82 48" />
      </g>
    )
  }
  return (
    <g stroke="#5A3A12" strokeWidth="3" strokeLinecap="round" opacity="0.75">
      <path d="M39 48 Q45 45 51 48" fill="none" />
      <path d="M69 48 Q75 45 81 48" fill="none" />
    </g>
  )
}

export function Floussi({ mood = 'idle', size = 64, cap = true }: FloussiProps) {
  const eyesWide = mood === 'surprised' || mood === 'excited'
  const pupilDx = mood === 'thinking' ? 3 : 0
  const pupilDy = mood === 'thinking' ? -3 : 0
  const armsUp = mood === 'excited' || mood === 'happy'

  return (
    <motion.div
      variants={BODY_VARIANTS}
      animate={mood}
      initial={false}
      style={{ width: size, height: size, display: 'inline-block', lineHeight: 0 }}
    >
      <svg viewBox="0 0 120 130" width={size} height={size * (130 / 120)} style={{ overflow: 'visible' }}>
        <defs>
          <radialGradient id="floussi-gold" cx="38%" cy="32%" r="75%">
            <stop offset="0%" stopColor="#F2DA9E" />
            <stop offset="45%" stopColor="#DDB86A" />
            <stop offset="100%" stopColor="#A9823F" />
          </radialGradient>
          <linearGradient id="floussi-rim" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8A6D3B" />
            <stop offset="100%" stopColor="#6B5227" />
          </linearGradient>
          <clipPath id="floussi-clip">
            <circle cx="60" cy="72" r="52" />
          </clipPath>
        </defs>

        {/* ── Bras (se lèvent quand Floussi jubile) ── */}
        <motion.g
          animate={{ rotate: armsUp ? -105 : 0 }}
          transition={{ type: 'spring', damping: 12 }}
          style={{ transformBox: 'fill-box', transformOrigin: '90% 15%' }}
        >
          <path d="M12 82 Q0 92 4 104" fill="none" stroke="#A9823F" strokeWidth="7" strokeLinecap="round" />
          <circle cx="4" cy="105" r="6.5" fill="#DDB86A" stroke="#8A6D3B" strokeWidth="1.5" />
        </motion.g>
        <motion.g
          animate={{ rotate: armsUp ? 105 : 0 }}
          transition={{ type: 'spring', damping: 12, delay: 0.06 }}
          style={{ transformBox: 'fill-box', transformOrigin: '10% 15%' }}
        >
          <path d="M108 82 Q120 92 116 104" fill="none" stroke="#A9823F" strokeWidth="7" strokeLinecap="round" />
          <circle cx="116" cy="105" r="6.5" fill="#DDB86A" stroke="#8A6D3B" strokeWidth="1.5" />
        </motion.g>

        {/* ── Corps : la pièce ── */}
        <circle cx="60" cy="72" r="52" fill="url(#floussi-gold)" stroke="url(#floussi-rim)" strokeWidth="4" />
        <circle cx="60" cy="72" r="43" fill="none" stroke="#8A6D3B" strokeWidth="1.6" opacity="0.55" strokeDasharray="3 4" />

        {/* Reflet qui balaie la pièce */}
        <g clipPath="url(#floussi-clip)">
          <motion.rect
            x="-30" y="10" width="26" height="130" rx="12"
            fill="#FFFFFF" opacity="0.22"
            animate={{ x: [-40, 140] }}
            transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 2.6, ease: 'easeInOut' }}
            transform="rotate(18 60 72)"
          />
        </g>

        {/* ── Chapeau de professeur ── */}
        {cap && (
          <motion.g
            animate={mood === 'excited' ? { rotate: [0, -6, 6, 0], y: [0, -3, 0] } : { rotate: 0, y: 0 }}
            transition={{ duration: 0.65, repeat: mood === 'excited' ? Infinity : 0 }}
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          >
            <path d="M42 32 Q42 22 60 22 Q78 22 78 32 L78 36 Q60 42 42 36 Z" fill="#2A2D34" />
            <polygon points="24,28 60,10 96,28 60,44" fill="#383C46" stroke="#1E2126" strokeWidth="1.5" />
            <line x1="60" y1="27" x2="88" y2="34" stroke="#C9A86A" strokeWidth="2" />
            <motion.circle
              cx="88" cy="40" r="4" fill="#C9A86A"
              animate={{ y: [0, 2.5, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.g>
        )}

        {/* ── Yeux (clignent tout seuls) ── */}
        <motion.g
          animate={{ scaleY: [1, 1, 0.08, 1, 1] }}
          transition={{ duration: 3.6, times: [0, 0.9, 0.94, 0.98, 1], repeat: Infinity }}
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        >
          <circle cx="45" cy="60" r={eyesWide ? 8 : 6.5} fill="#3A2A10" />
          <circle cx="75" cy="60" r={eyesWide ? 8 : 6.5} fill="#3A2A10" />
          <circle cx={45 + pupilDx + 2} cy={60 + pupilDy - 2} r="2.2" fill="#FFF" opacity="0.9" />
          <circle cx={75 + pupilDx + 2} cy={60 + pupilDy - 2} r="2.2" fill="#FFF" opacity="0.9" />
        </motion.g>

        <Brows mood={mood} />

        {/* Joues roses quand content */}
        {(mood === 'happy' || mood === 'excited') && (
          <g opacity="0.5">
            <ellipse cx="36" cy="72" rx="6" ry="4" fill="#D96A5E" />
            <ellipse cx="84" cy="72" rx="6" ry="4" fill="#D96A5E" />
          </g>
        )}

        {/* Larme quand triste */}
        {mood === 'sad' && (
          <motion.path
            d="M78 68 Q81 74 78 78 Q75 74 78 68 Z"
            fill="#7FB3D5"
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: [0, 1, 1, 0], y: [0, 8] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          />
        )}

        {/* Bulle de réflexion quand pensif */}
        {mood === 'thinking' && (
          <motion.g
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          >
            <circle cx="96" cy="34" r="3" fill="#8A6D3B" opacity="0.5" />
            <circle cx="103" cy="24" r="4.5" fill="#8A6D3B" opacity="0.65" />
            <text x="100" y="29" fontSize="9" fill="#F2DA9E" fontWeight="bold">?</text>
          </motion.g>
        )}

        <Mouth mood={mood} />

        {/* Étoiles de joie autour de la tête */}
        {mood === 'excited' && (
          <g>
            {[
              { x: 16, y: 30, d: 0 },
              { x: 104, y: 26, d: 0.3 },
              { x: 12, y: 58, d: 0.6 },
            ].map((s, i) => (
              <motion.text
                key={i}
                x={s.x} y={s.y} fontSize="11" textAnchor="middle"
                animate={{ opacity: [0, 1, 0], scale: [0.5, 1.25, 0.5], rotate: [0, 25, 0] }}
                transition={{ duration: 1.1, repeat: Infinity, delay: s.d }}
                style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
              >
                ✨
              </motion.text>
            ))}
          </g>
        )}

        {/* Marque CBS gravée sur la pièce */}
        <text x="60" y="112" fontSize="9" textAnchor="middle" fontWeight="bold" fill="#8A6D3B" opacity="0.65" letterSpacing="2">
          CBS
        </text>
      </svg>
    </motion.div>
  )
}
