'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { Floussi } from './Floussi'
import { sound } from '@/lib/audio'

interface MascotProps {
  /** Astuces affichées en boucle dans la bulle */
  tips: string[]
  /** Ouvre la bulle automatiquement au chargement */
  autoOpen?: boolean
}

/**
 * Floussi 🪙 — la mascotte du Mode Découverte.
 * Une pièce magique qui flotte en bas à droite et donne des astuces
 * en langage 100 % simple. Clic : astuce suivante.
 */
export function Mascot({ tips, autoOpen = true }: MascotProps) {
  const [open, setOpen] = useState(false)
  const [tipIndex, setTipIndex] = useState(0)

  useEffect(() => {
    if (!autoOpen) return
    const timer = setTimeout(() => setOpen(true), 900)
    return () => clearTimeout(timer)
  }, [autoOpen])

  const nextTip = useCallback(() => {
    sound.playTick()
    if (!open) {
      setOpen(true)
      return
    }
    setTipIndex(i => (i + 1) % Math.max(1, tips.length))
  }, [open, tips.length])

  if (tips.length === 0) return null

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9990, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
      <AnimatePresence>
        {open && (
          <motion.div
            key={tipIndex}
            initial={{ opacity: 0, y: 12, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl p-4 relative"
            style={{
              maxWidth: '290px',
              backgroundColor: 'var(--bg-panel)',
              border: '1px solid var(--border-default)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
              borderBottomRightRadius: '4px',
            }}
          >
            <button
              onClick={e => { e.stopPropagation(); setOpen(false) }}
              className="absolute top-2 right-2 p-1"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}
              aria-label="Fermer la bulle"
            >
              <X size={12} />
            </button>
            <span className="label-caps block mb-1.5" style={{ color: 'var(--accent-warm)', fontSize: '8px' }}>
              Floussi · ta pièce porte-bonheur
            </span>
            <p className="text-xs leading-relaxed m-0 pr-3" style={{ color: 'var(--text-secondary)' }}>
              {tips[tipIndex % tips.length]}
            </p>
            {tips.length > 1 && (
              <button
                onClick={e => { e.stopPropagation(); nextTip() }}
                className="mt-2.5 text-[10px] font-bold px-2.5 py-1 rounded-full transition-colors"
                style={{
                  backgroundColor: 'rgba(201,168,106,0.12)',
                  color: 'var(--accent-warm)',
                  border: '1px solid rgba(201,168,106,0.25)',
                  cursor: 'pointer',
                }}
              >
                Astuce suivante →
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={nextTip}
        whileHover={{ scale: 1.1, rotate: 6 }}
        whileTap={{ scale: 0.92 }}
        className="flex items-center justify-center"
        style={{
          width: '66px', height: '70px',
          background: 'none', border: 'none',
          filter: 'drop-shadow(0 8px 22px rgba(201,168,106,0.45))',
          cursor: 'pointer', lineHeight: 0,
        }}
        aria-label="Parler à Floussi"
      >
        <Floussi mood={open ? 'happy' : 'idle'} size={60} />
      </motion.button>
    </div>
  )
}
