'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useShallow } from 'zustand/react/shallow'
import { useGameStore } from '@/store/gameStore'
import { gameQuarters } from '@/engine/gameLength'
import { fmtQuarter } from '@/lib/format'
import { Sun, CloudRain, Snowflake, Leaf } from 'lucide-react'

// ── Season data for Morocco ──────────────────────────────────
const SEASONS: Record<number, { label: string; icon: any; color: string }> = {
  1: { label: 'Ramadan & Semis', icon: Sun, color: '#C9A86A' },
  2: { label: 'Tourisme & Aid', icon: CloudRain, color: '#4A9D7C' },
  3: { label: 'Récolte & Aid', icon: Leaf, color: '#5C7E92' },
  4: { label: 'Budget & Hiver', icon: Snowflake, color: '#B41923' },
}

export function Timeline() {
  const { currentState, scenario, freeMode } = useGameStore(
    useShallow(s => ({
      currentState: s.currentState,
      scenario:     s.scenario,
      freeMode:     s.freeMode,
    }))
  )
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  // Longueur réelle de la partie en cours (rejeu historique, campagne, mode libre).
  const totalQuarters = gameQuarters(scenario, freeMode)
  const currentQ = currentState.quarter
  const pct = Math.round(((currentQ + 1) / totalQuarters) * 100)
  const yearMarkers = Array.from({ length: Math.ceil(totalQuarters / 4) }, (_, i) => `A${i + 1}`)

  const getSeason = (qIdx: number) => SEASONS[(qIdx % 4) + 1]

  return (
    <div className="flex flex-col items-center gap-2 w-full max-w-lg">
      {/* Labels */}
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs font-semibold tabular" style={{ color: 'var(--accent-primary)' }}>
          {fmtQuarter(currentState.date.year, currentState.date.q)}
        </span>
        <span className="text-text-tertiary">·</span>
        <span className="label-caps">Trimestre {currentQ + 1} / {totalQuarters}</span>
        <span className="text-text-tertiary">·</span>
        <span className="label-caps text-text-tertiary">{pct}% du mandat</span>
      </div>

      {/* Progress bar */}
      <div className="w-full relative">
        <div
          className="h-2.5 rounded-full overflow-hidden"
          style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, rgba(180,25,35,0.7) 0%, #B41923 100%)',
              boxShadow: '2px 0 10px rgba(180,25,35,0.5)',
            }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>

        {/* Year markers — un repère par année de mandat, selon la durée réelle */}
        <div className="flex justify-between mt-1 px-0">
          {yearMarkers.map((y, i) => (
            <span
              key={y}
              className="label-caps"
              style={{
                fontSize: '8px',
                color: i < Math.ceil(currentQ / 4) ? 'var(--text-tertiary)' : 'var(--border-default)',
                transform: i === yearMarkers.length - 1 ? 'translateX(50%)' : i === 0 ? 'translateX(-50%)' : 'none',
              }}
            >
              {y}
            </span>
          ))}
        </div>

        {/* Dots */}
        <div className="flex items-center justify-between mt-1">
          {Array.from({ length: totalQuarters }, (_, i) => {
            const isPast    = i < currentQ
            const isCurrent = i === currentQ
            const season    = getSeason(i)
            const isHovered = hoveredIdx === i

            return (
              <div
                key={i}
                className="relative flex flex-col items-center"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <div className={isCurrent ? 'pulse-dual-ring' : ''}>
                  <motion.div
                    animate={{
                      scale: isCurrent ? 1.6 : isHovered ? 1.3 : 1,
                      backgroundColor: isCurrent
                        ? '#B41923'
                        : isPast
                          ? 'var(--text-tertiary)'
                          : 'var(--border-default)',
                    }}
                    className="rounded-full cursor-pointer"
                    style={{
                      width:     isCurrent ? 9  : 5,
                      height:    isCurrent ? 9  : 5,
                      boxShadow: isCurrent ? '0 0 10px rgba(180,25,35,0.7)' : 'none',
                    }}
                  />
                </div>

                {isHovered && (
                  <div
                    className="absolute bottom-full mb-3.5 z-50 w-40 p-2.5 rounded-md text-xs glass-premium"
                    style={{
                      boxShadow: `0 10px 30px rgba(0,0,0,0.45), 0 0 10px ${season.color}33`,
                      borderLeft: `3px solid ${season.color}`,
                    }}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5" style={{ color: season.color }}>
                      <season.icon size={12} className="animate-pulse-soft" />
                      <span className="font-bold uppercase tracking-wider" style={{ fontSize: '10px' }}>{season.label}</span>
                    </div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '9px' }}>
                      Trimestre {i + 1} / {totalQuarters}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Current season */}
      <div className="flex items-center gap-2 text-xs text-text-tertiary">
        {(() => {
          const season = SEASONS[currentState.date.q]
          return season ? <>
            <span style={{ color: season.color }}><season.icon size={14} /></span>
            <span>{season.label}</span>
          </> : null
        })()}
      </div>
    </div>
  )
}
