'use client'

import { sound } from '@/lib/audio'

interface StepperOption {
  value: number
  label: string
}

interface StepperProps {
  value: number
  options: StepperOption[]
  onChange: (value: number) => void
  label: string
  className?: string
  compact?: boolean
}

export function Stepper({
  value,
  options,
  onChange,
  label,
  className = '',
  compact = false,
}: StepperProps) {
  return (
    <div
      className={`flex gap-[2px] p-[3px] rounded-md ${className}`}
      role="group"
      aria-label={label}
      style={{
        backgroundColor: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      {options.map((opt) => {
        const isActive = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => {
              onChange(opt.value)
              sound.playTick()
            }}
            className="flex-1 rounded transition-all duration-100"
            style={{
              padding: compact ? '3px 2px' : '4px 3px',
              fontSize: compact ? '9px' : '10px',
              fontFamily: 'var(--font-jetbrains), monospace',
              fontWeight: isActive ? 700 : 500,
              backgroundColor: isActive ? 'var(--accent-primary)' : 'transparent',
              color: isActive ? '#fff' : 'var(--text-tertiary)',
              border: 'none',
              letterSpacing: 0,
              minWidth: 0,
              textAlign: 'center',
              cursor: 'pointer',
              boxShadow: isActive ? '0 1px 4px rgba(180,25,35,0.35)' : 'none',
            }}
            onMouseEnter={e => {
              if (!isActive) (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'
            }}
            onMouseLeave={e => {
              if (!isActive) (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)'
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

