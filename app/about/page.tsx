'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ThemeToggle } from '@/components/shell/ThemeToggle'

export default function AboutPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-base)' }}>
        <p className="label-caps" style={{ color: 'var(--text-tertiary)' }}>Chargement…</p>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-16 relative transition-colors duration-200"
      style={{ backgroundColor: 'var(--bg-base)' }}
    >
      {/* Premium Floating Theme Toggle */}
      <div className="absolute top-6 right-6 flex items-center gap-2">
        <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] hidden sm:inline-block">
          Thème
        </span>
        <ThemeToggle />
      </div>

      <div className="w-full max-w-2xl mx-auto">
        <p className="label-caps mb-4" style={{ color: 'var(--accent-primary)' }}>
          À propos du projet
        </p>
        <h1
          className="font-editorial-roman mb-6"
          style={{
            fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
          }}
        >
          Central Bank Simulator
        </h1>

        <div className="space-y-4 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          <p>
            Ce serious game servira de support pédagogique pour illustrer les mécanismes de
            politique monétaire au grand public et aux étudiants.
          </p>
        </div>

        <div className="mt-10">
          <Link
            href="/"
            className="label-caps flex items-center gap-1.5 transition-colors duration-200 hover:text-[var(--text-primary)]"
            style={{ color: 'var(--text-tertiary)', textDecoration: 'none', display: 'inline-flex' }}
          >
            <ArrowLeft size={12} />
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  )
}
