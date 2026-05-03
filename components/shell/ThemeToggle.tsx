'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('cbs-theme')
    if (saved === 'light') {
      setIsDark(false)
      document.documentElement.classList.add('light')
    }
  }, [])

  const toggle = () => {
    const next = !isDark
    setIsDark(next)
    if (next) {
      document.documentElement.classList.remove('light')
      localStorage.setItem('cbs-theme', 'dark')
    } else {
      document.documentElement.classList.add('light')
      localStorage.setItem('cbs-theme', 'light')
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      className="p-1.5 rounded transition-colors duration-200"
      style={{
        color: 'var(--text-tertiary)',
        backgroundColor: 'transparent',
      }}
      onMouseEnter={e => {
        ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'
      }}
      onMouseLeave={e => {
        ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-tertiary)'
      }}
    >
      {isDark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  )
}
