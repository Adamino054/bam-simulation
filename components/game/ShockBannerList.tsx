'use client'

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
      {activeShocks.map(shock => (
        <ShockBanner key={shock.id} shock={shock} />
      ))}
    </div>
  )
}
