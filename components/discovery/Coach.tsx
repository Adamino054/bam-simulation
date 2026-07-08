'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Floussi } from './Floussi'
import type { FloussiMood } from './Floussi'

/**
 * Prof. Floussi — le coach des mini-jeux.
 * Une ligne de coach = une humeur + une phrase. Le CoachBar affiche le
 * personnage animé et sa bulle de dialogue qui « pop » à chaque nouvelle réplique.
 */

export interface CoachLine {
  mood: FloussiMood
  text: string
}

/* ── Réserves de répliques ──────────────────────────────────────── */

export const COACH_PHRASES = {
  correct: [
    'Bravo, c’est exactement ça !',
    'Ouiii ! Tu m’impressionnes !',
    'Parfait ! Un vrai petit gouverneur !',
    'Excellente réponse, continue !',
    'Et hop ! Dans le mille !',
    'Magnifique ! Tu as tout compris !',
  ],
  wrong: [
    'Oups... pas grave, maintenant tu sais !',
    'Raté, mais même les grands économistes se trompent !',
    'Presque ! Lis bien l’explication, elle vaut de l’or.',
    'Hé non ! Mais chaque erreur t’apprend un secret.',
    'Zut ! Allez, on se rattrape à la prochaine.',
  ],
  streak: [
    'Quelle série ! Tu es en feu !',
    'Inarrêtable ! Continue comme ça !',
    'Incroyable, tu enchaînes les bonnes réponses !',
  ],
  thinking: [
    'Hmm, celle-ci est intéressante...',
    'Prends ton temps, réfléchis bien...',
    'Alors, qu’est-ce que ça va donner ?',
    'Concentre-toi, tu peux la trouver !',
  ],
  match: [
    'Belle paire ! Encore un mot d’expert dans ta poche.',
    'Trouvé ! Le pont se construit...',
    'Exact ! Ces deux-là vont ensemble.',
    'Bien vu ! Tu parles de mieux en mieux économiste.',
  ],
  matchWrong: [
    'Non, ces deux-là ne vont pas ensemble... réessaie !',
    'Pas cette combinaison ! Observe bien les indices.',
    'Presque ! Pense à l’image derrière le mot savant.',
  ],
  balloonInZone: [
    'Superbe pilotage, reste dans le vert !',
    'Voilà ! Ni trop chaud, ni trop froid.',
    'Tu tiens le ballon comme un chef !',
  ],
  balloonOutZone: [
    'Le ballon s’échappe, rattrape-le !',
    'Hé, reviens dans la zone verte !',
    'Doucement... ramène-le au centre !',
  ],
  balloonGust: [
    'Accroche-toi, une rafale arrive !',
    'Aïe, le vent se lève ! Compense vite !',
    'Choc surprise ! C’est ça, l’économie !',
  ],
} as const

export function pickPhrase(pool: readonly string[]): string {
  return pool[Math.floor(Math.random() * pool.length)]
}

/* ── La barre de coach (personnage + bulle) ─────────────────────── */

interface CoachBarProps {
  line: CoachLine
  size?: number
}

export function CoachBar({ line, size = 58 }: CoachBarProps) {
  return (
    <div className="flex items-end gap-2.5">
      <div className="shrink-0" style={{ marginBottom: '-2px' }}>
        <Floussi mood={line.mood} size={size} />
      </div>
      <div className="flex-1 min-w-0 pb-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={line.text}
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative rounded-2xl px-3.5 py-2.5"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderBottomLeftRadius: '4px',
              boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
            }}
          >
            <span className="label-caps block mb-0.5" style={{ fontSize: '7px', color: 'var(--accent-warm)' }}>
              Prof. Floussi
            </span>
            <p className="text-[11.5px] leading-snug m-0" style={{ color: 'var(--text-primary)' }}>
              {line.text}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

/* ── Floussi de fin de partie (grand format, humeur selon étoiles) ─ */

export function CoachFinale({ stars }: { stars: number }) {
  const mood: FloussiMood = stars >= 2 ? 'excited' : stars === 1 ? 'happy' : 'sad'
  return (
    <motion.div
      initial={{ scale: 0, rotate: -20 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', damping: 11, delay: 0.15 }}
      className="inline-block"
    >
      <Floussi mood={mood} size={84} />
    </motion.div>
  )
}
