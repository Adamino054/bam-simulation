'use client'

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
      className={`flex gap-[2px] ${className}`}
      role="group"
      aria-label={label}
    >
      {options.map((opt) => {
        const isActive = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(opt.value)}
            className="flex-1 rounded transition-all duration-150"
            style={{
              padding: compact ? '4px 2px' : '5px 3px',
              fontSize: compact ? '9px' : '10px',
              fontFamily: 'var(--font-jetbrains), monospace',
              fontWeight: 600,
              backgroundColor: isActive ? 'var(--accent-primary)' : 'var(--bg-elevated)',
              color: isActive ? '#fff' : 'var(--text-tertiary)',
              border: `1px solid ${isActive ? 'var(--accent-primary)' : 'var(--border-default)'}`,
              letterSpacing: '0',
              minWidth: 0,
              textAlign: 'center',
              cursor: 'pointer',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
