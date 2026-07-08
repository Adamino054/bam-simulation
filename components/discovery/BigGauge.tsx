'use client'

import { motion } from 'framer-motion'
import type { MoodGauge } from '@/engine/discovery'

interface BigGaugeProps {
  /** Titre simple, ex. « Les prix » */
  title: string
  titleEmoji: string
  mood: MoodGauge
  /** Affiche la vraie valeur (mode lunettes d'expert 🤓) */
  expertMode?: boolean
  /** Zone verte optionnelle [début %, fin %] dessinée sur la jauge */
  greenZone?: [number, number]
}

/**
 * Grande jauge à émotions du Mode Découverte : un émoji, une phrase
 * simple, une barre colorée — et la vraie valeur experte sur demande.
 */
export function BigGauge({ title, titleEmoji, mood, expertMode = false, greenZone }: BigGaugeProps) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-subtle)' }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
          <span className="text-base">{titleEmoji}</span> {title}
        </span>
        <motion.span
          key={mood.emoji}
          initial={{ scale: 0.4, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 12, stiffness: 260 }}
          className="text-2xl"
        >
          {mood.emoji}
        </motion.span>
      </div>

      {/* Barre */}
      <div className="relative progress-bar mb-2" style={{ height: '10px', backgroundColor: 'var(--bg-hover)' }}>
        {greenZone && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute', top: 0, bottom: 0,
              left: `${greenZone[0]}%`, width: `${greenZone[1] - greenZone[0]}%`,
              backgroundColor: 'rgba(74,157,124,0.22)',
              borderLeft: '1px dashed rgba(74,157,124,0.5)',
              borderRight: '1px dashed rgba(74,157,124,0.5)',
            }}
          />
        )}
        <motion.div
          className="h-full rounded-full relative"
          style={{ backgroundColor: mood.color }}
          animate={{ width: `${mood.pct}%` }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      <p className="text-[11px] leading-snug m-0" style={{ color: 'var(--text-secondary)' }}>
        {mood.label}
      </p>

      {expertMode && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="font-mono text-[10px] mt-1.5 mb-0 px-2 py-1 rounded"
          style={{
            color: 'var(--accent-cool)',
            backgroundColor: 'var(--bg-base)',
            border: '1px dashed var(--border-default)',
          }}
        >
          🤓 {mood.expertValue}
        </motion.p>
      )}
    </div>
  )
}
