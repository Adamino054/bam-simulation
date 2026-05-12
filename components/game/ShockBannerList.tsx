'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { ShockBanner } from '@/components/ui/ShockBanner'

export function ShockBannerList() {
  const activeShocks = useGameStore(s => s.activeShocks)

  if (activeShocks.length === 0) {
    return (
      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
        Aucun choc actif.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {activeShocks.map(shock => (
          <motion.div
            key={shock.id}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <ShockBanner shock={shock} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
