'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGameStore } from '@/store/gameStore'
import { SCENARIOS } from '@/engine/scenarios'
import { ThemeToggle } from '@/components/shell/ThemeToggle'
import type { ScenarioId } from '@/engine/state'

const DIFFICULTY_LABEL: Record<string, string> = {
  normal: 'Normal',
  hard:   'Difficile',
  crisis: 'Crise',
}

const DIFFICULTY_COLOR: Record<string, string> = {
  normal: 'var(--data-positive)',
  hard:   'var(--data-warning)',
  crisis: 'var(--data-negative)',
}

export default function HomePage() {
  const router = useRouter()
  const startGame = useGameStore(s => s.startGame)
  const [selected, setSelected] = useState<ScenarioId>('standard')

  const handleStart = () => {
    startGame(selected)
    router.push('/play')
  }

  const scenarios = Object.values(SCENARIOS)

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--bg-base)' }}
    >
      {/* Barre supérieure minimaliste */}
      <div className="flex items-center justify-between px-6 py-4">
        <span
          className="font-editorial text-sm"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Bank Al-Maghrib — Projet de Fin d'Année
        </span>
        <ThemeToggle />
      </div>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center max-w-3xl mx-auto w-full">

        {/* Wordmark */}
        <p
          className="label-caps mb-6"
          style={{ color: 'var(--accent-primary)' }}
        >
          Central Bank Simulator
        </p>

        {/* Titre éditorial */}
        <h1
          className="font-editorial mb-4"
          style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            letterSpacing: '-0.03em',
            lineHeight: 1.0,
            color: 'var(--text-primary)',
          }}
        >
          Vous êtes le gouverneur.
        </h1>

        <p
          className="text-lg mb-3"
          style={{ color: 'var(--text-secondary)', maxWidth: '480px' }}
        >
          Cinq ans pour piloter l'économie marocaine.
          Quatre instruments. Une cible : 2 % d'inflation.
        </p>

        <p
          className="text-sm leading-relaxed mb-12"
          style={{ color: 'var(--text-tertiary)', maxWidth: '520px' }}
        >
          Incarnez le gouverneur de Bank Al-Maghrib et prenez des décisions
          de politique monétaire trimestre par trimestre — taux directeur,
          réserves obligatoires, opérations de marché. Naviguez entre
          stabilité des prix, soutien à la croissance et chocs imprévus.
        </p>

        {/* Sélecteur de scénario */}
        <div className="w-full max-w-2xl mb-10">
          <p className="label-caps text-left mb-3">Choisir un scénario</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {scenarios.map(s => {
              const isSelected = s.id === selected
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelected(s.id)}
                  className="relative text-left rounded p-4 transition-all duration-200"
                  style={{
                    backgroundColor: isSelected ? 'var(--bg-elevated)' : 'var(--bg-panel)',
                    border: `1px solid ${isSelected ? 'var(--border-strong)' : 'var(--border-default)'}`,
                    outline: isSelected ? `2px solid var(--accent-primary)` : 'none',
                    outlineOffset: '2px',
                  }}
                >
                  {/* Difficulty badge */}
                  <span
                    className="label-caps"
                    style={{ color: DIFFICULTY_COLOR[s.difficulty] }}
                  >
                    {DIFFICULTY_LABEL[s.difficulty]}
                  </span>

                  <h3
                    className="font-medium mt-1.5 mb-1"
                    style={{ color: 'var(--text-primary)', fontSize: '14px' }}
                  >
                    {s.title}
                  </h3>
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {s.subtitle}
                  </p>
                </button>
              )
            })}
          </div>

          {/* Description du scénario sélectionné */}
          <div
            className="mt-4 rounded p-4 text-sm text-left"
            style={{
              backgroundColor: 'var(--bg-panel)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
            }}
          >
            {SCENARIOS[selected].description}
          </div>
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={handleStart}
          className="px-10 py-3.5 rounded font-medium text-sm transition-all duration-200 mb-16"
          style={{
            backgroundColor: 'var(--accent-primary)',
            color: '#fff',
            border: 'none',
            letterSpacing: '0.02em',
          }}
          onMouseEnter={e => {
            ;(e.currentTarget as HTMLButtonElement).style.opacity = '0.88'
          }}
          onMouseLeave={e => {
            ;(e.currentTarget as HTMLButtonElement).style.opacity = '1'
          }}
        >
          Commencer la partie
        </button>
      </main>

      {/* Footer */}
      <footer
        className="text-center py-4 px-6"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        <p className="label-caps">
          Projet de Fin d'Année · BAM · 2024-2025
          <span className="mx-3" style={{ color: 'var(--border-default)' }}>·</span>
          <a
            href="/about"
            className="transition-colors duration-200"
            style={{ color: 'var(--text-tertiary)', textDecoration: 'none' }}
          >
            À propos
          </a>
        </p>
      </footer>
    </div>
  )
}
