'use client'

import { motion } from 'framer-motion'
import { Award, Lock, Sparkles, Star } from 'lucide-react'
import { BADGES, getBadgesByCategory } from '@/engine/badges'
import { useAuthStore } from '@/store/authStore'
import { Tooltip } from './Tooltip'

export function BadgeDisplay() {
  const player = useAuthStore(s => s.getCurrentPlayer())
  const earnedBadges = player?.badges ?? []

  const categories = [
    { id: 'course', label: 'Cours & Quizzes', icon: Award, color: 'var(--accent-cool)' },
    { id: 'simulation', label: 'Simulation & Stratégie', icon: Star, color: 'var(--accent-primary)' },
    { id: 'mastery', label: 'Maîtrise & Excellence', icon: Sparkles, color: 'var(--accent-warm)' },
  ] as const

  return (
    <div className="flex flex-col gap-6">
      {categories.map(cat => {
        const catBadges = getBadgesByCategory(cat.id)
        const Icon = cat.icon

        return (
          <div
            key={cat.id}
            className="rounded-lg p-5"
            style={{
              backgroundColor: 'var(--bg-panel)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {/* Category Header */}
            <div className="flex items-center gap-2 mb-4">
              <Icon size={16} style={{ color: cat.color }} />
              <span className="label-caps" style={{ color: cat.color, fontSize: '10px' }}>
                {cat.label}
              </span>
            </div>

            {/* Badge Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
              {catBadges.map(badge => {
                const isEarned = earnedBadges.includes(badge.id)

                return (
                  <Tooltip
                    key={badge.id}
                    content={
                      <div className="text-left max-w-[200px]">
                        <p className="font-semibold text-xs" style={{ color: badge.color }}>
                          {badge.title}
                        </p>
                        <p className="text-[10px] text-gray-300 mt-1 leading-normal">
                          {badge.description}
                        </p>
                        <p className="text-[9px] mt-2 italic text-gray-400">
                          {isEarned ? '✨ Débloqué !' : '🔒 Verrouillé'}
                        </p>
                      </div>
                    }
                  >
                    <motion.div
                      whileHover={{ y: -3, scale: 1.02 }}
                      className="flex flex-col items-center justify-center p-3 rounded-lg text-center transition-all relative overflow-hidden"
                      style={{
                        backgroundColor: isEarned ? `${badge.color}0B` : 'var(--bg-elevated)',
                        border: `1px solid ${isEarned ? `${badge.color}35` : 'var(--border-subtle)'}`,
                        cursor: 'default',
                        minHeight: '100px',
                      }}
                    >
                      {/* Glow for earned badges */}
                      {isEarned && (
                        <div
                          className="absolute inset-0 pointer-events-none opacity-30"
                          style={{
                            background: `radial-gradient(circle at 50% 50%, ${badge.color} 0%, transparent 70%)`,
                          }}
                        />
                      )}

                      {/* Badge Icon / Emoji */}
                      <div
                        className="relative w-12 h-12 rounded-full flex items-center justify-center mb-2"
                        style={{
                          backgroundColor: isEarned ? `${badge.color}1c` : 'rgba(255,255,255,0.02)',
                          border: `1px dashed ${isEarned ? badge.color : 'var(--border-default)'}`,
                          filter: isEarned ? 'none' : 'grayscale(100%) opacity(40%)',
                          fontSize: '22px',
                        }}
                      >
                        {badge.emoji}
                      </div>

                      {/* Badge Title */}
                      <span
                        className="text-xs font-semibold block truncate w-full"
                        style={{
                          color: isEarned ? 'var(--text-primary)' : 'var(--text-tertiary)',
                          fontSize: '11px',
                        }}
                      >
                        {badge.title}
                      </span>

                      {/* Lock Icon */}
                      {!isEarned && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '6px',
                            right: '6px',
                            color: 'var(--text-tertiary)',
                            opacity: 0.5,
                          }}
                        >
                          <Lock size={10} />
                        </div>
                      )}
                    </motion.div>
                  </Tooltip>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
