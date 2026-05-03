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
}

export function Stepper({ value, options, onChange, label, className = '' }: StepperProps) {
  return (
    <div className={`flex gap-1 ${className}`} role="group" aria-label={label}>
      {options.map((opt) => {
        const isActive = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(opt.value)}
            className="flex-1 px-2 py-1.5 rounded text-xs font-mono transition-colors duration-200"
            style={{
              backgroundColor: isActive ? 'var(--accent-primary)' : 'var(--bg-elevated)',
              color: isActive ? '#fff' : 'var(--text-secondary)',
              border: '1px solid',
              borderColor: isActive ? 'var(--accent-primary)' : 'var(--border-default)',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
