'use client'

import { useState } from 'react'
import { AlertTriangle, Zap, TrendingDown, Globe } from 'lucide-react'
import type { Shock } from '@/engine/state'

const TYPE_CONFIG: Record<
  Shock['type'],
  { icon: typeof AlertTriangle; color: string; bg: string }
> = {
  supply:    { icon: Zap,          color: 'var(--data-warning)',  bg: 'rgba(201,168,106,0.08)' },
  demand:    { icon: TrendingDown, color: 'var(--data-negative)', bg: 'rgba(194,84,80,0.08)' },
  financial: { icon: AlertTriangle,color: 'var(--data-warning)',  bg: 'rgba(201,168,106,0.08)' },
  external:  { icon: Globe,        color: 'var(--accent-cool)',   bg: 'rgba(92,126,146,0.08)' },
}

interface ShockBannerProps {
  shock: Shock
  isNew?: boolean
}

export function ShockBanner({ shock, isNew = false }: ShockBannerProps) {
  const [expanded, setExpanded] = useState(false)
  const config = TYPE_CONFIG[shock.type]
  const Icon   = config.icon

  return (
    <div
      className={`rounded p-2.5 ${isNew ? 'animate-slide-in-left' : ''}`}
      style={{
        backgroundColor: config.bg,
        border: `1px solid ${config.color}33`,
      }}
    >
      <div className="flex items-start gap-2">
        <Icon
          size={14}
          style={{ color: config.color, flexShrink: 0, marginTop: 2 }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span
              className="text-xs font-medium truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              {shock.label}
            </span>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span
                className="label-caps"
                style={{ color: config.color }}
              >
                {shock.remainingQuarters}T restant{shock.remainingQuarters > 1 ? 's' : ''}
              </span>
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="w-4 h-4 rounded-full flex items-center justify-center text-xs transition-colors"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-tertiary)',
                  fontSize: '10px',
                }}
                aria-expanded={expanded}
                aria-label={`Détails sur ${shock.label}`}
              >
                i
              </button>
            </div>
          </div>
          {expanded && (
            <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {shock.description}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
