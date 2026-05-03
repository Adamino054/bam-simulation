'use client'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  id?: string
}

export function Toggle({ checked, onChange, label, id }: ToggleProps) {
  return (
    <label
      htmlFor={id}
      className="flex items-center gap-2 cursor-pointer"
      aria-label={label}
    >
      <div
        className="relative w-8 h-4 rounded-full transition-colors duration-200"
        style={{
          backgroundColor: checked ? 'var(--accent-primary)' : 'var(--bg-hover)',
        }}
      >
        <div
          className="absolute top-0.5 w-3 h-3 rounded-full transition-transform duration-200"
          style={{
            backgroundColor: 'var(--text-primary)',
            transform: checked ? 'translateX(18px)' : 'translateX(2px)',
          }}
        />
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
          role="switch"
          aria-checked={checked}
        />
      </div>
      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </span>
    </label>
  )
}
