'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGameStore } from '@/store/gameStore'
import { SCENARIOS } from '@/engine/scenarios'
import { ThemeToggle } from '@/components/shell/ThemeToggle'
import type { ScenarioId } from '@/engine/state'

const DIFFICULTY_META: Record<string, { label: string; color: string }> = {
  normal: { label: 'Niveau standard',  color: 'var(--data-positive)' },
  hard:   { label: 'Niveau difficile', color: 'var(--data-warning)' },
  crisis: { label: 'Crise',            color: 'var(--data-negative)' },
}

export default function HomePage() {
  const router    = useRouter()
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
      {/* ── Barre top ── */}
      <nav
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center gap-3">
          <span className="label-caps" style={{ color: 'var(--accent-primary)', letterSpacing: '0.12em' }}>
            CBS
          </span>
          <span style={{ color: 'var(--border-default)' }}>·</span>
          <span className="label-caps">Bank Al-Maghrib — Simulateur de politique monétaire</span>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="/about"
            className="label-caps transition-colors duration-200"
            style={{ color: 'var(--text-tertiary)', textDecoration: 'none' }}
          >
            À propos
          </a>
          <ThemeToggle />
        </div>
      </nav>

      {/* ── Hero ── */}
      <main className="flex-1 flex flex-col">

        {/* Section éditoriale */}
        <section className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-20 pb-16 max-w-4xl mx-auto w-full">

          {/* Surtitre */}
          <div
            className="inline-flex items-center gap-2 mb-8 px-3 py-1 rounded"
            style={{
              backgroundColor: 'var(--bg-panel)',
              border: '1px solid var(--border-default)',
            }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            />
            <span className="label-caps">Serious game · Projet de Fin d'Année · BAM 2025</span>
          </div>

          {/* Titre principal */}
          <h1
            className="font-editorial mb-5"
            style={{
              fontSize: 'clamp(3rem, 7vw, 5.5rem)',
              letterSpacing: '-0.03em',
              lineHeight: 1.0,
              color: 'var(--text-primary)',
            }}
          >
            Vous êtes<br />le gouverneur.
          </h1>

          {/* Sous-titre */}
          <p
            className="mb-4 max-w-lg"
            style={{
              fontSize: '1.125rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
            }}
          >
            Cinq ans pour piloter l'économie marocaine.
            <br />Quatre instruments. Une cible : 2&nbsp;% d'inflation.
          </p>

          {/* Description */}
          <p
            className="mb-14 max-w-xl text-sm leading-relaxed"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Incarnez le gouverneur de Bank Al-Maghrib et prenez des décisions
            trimestre par trimestre — taux directeur, réserves obligatoires,
            opérations de marché. Naviguez entre stabilité des prix, croissance
            et chocs exogènes imprévisibles.
          </p>

          {/* ── Sélecteur de scénario ── */}
          <div className="w-full max-w-2xl">
            <p className="label-caps text-left mb-3">Choisir un scénario</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
              {scenarios.map(s => {
                const isSelected = s.id === selected
                const meta = DIFFICULTY_META[s.difficulty]
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelected(s.id)}
                    className="relative text-left rounded-md p-4 transition-all duration-150"
                    style={{
                      backgroundColor: isSelected ? 'var(--bg-elevated)' : 'var(--bg-panel)',
                      border: `1px solid ${isSelected ? 'var(--border-strong)' : 'var(--border-default)'}`,
                      boxShadow: isSelected ? `inset 0 0 0 1px var(--accent-primary)33` : 'none',
                    }}
                  >
                    {/* Indicateur de sélection */}
                    {isSelected && (
                      <span
                        className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: 'var(--accent-primary)' }}
                      />
                    )}

                    <span className="label-caps block mb-2" style={{ color: meta.color }}>
                      {meta.label}
                    </span>
                    <span
                      className="block font-medium mb-1"
                      style={{ color: 'var(--text-primary)', fontSize: '13px' }}
                    >
                      {s.title}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {s.subtitle}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Description du scénario */}
            <div
              className="rounded-md p-4 mb-6 text-sm text-left leading-relaxed"
              style={{
                backgroundColor: 'var(--bg-panel)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
              }}
            >
              {SCENARIOS[selected].description}
            </div>

            {/* CTA */}
            <button
              type="button"
              onClick={handleStart}
              className="w-full py-3.5 rounded-md font-medium text-sm tracking-wide transition-opacity duration-150"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: '#fff',
                border: 'none',
                letterSpacing: '0.04em',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.opacity = '0.9')}
              onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.opacity = '1')}
            >
              Commencer la partie →
            </button>
          </div>
        </section>

        {/* ── Bande d'indicateurs ── */}
        <div
          className="py-4 px-6"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <div className="max-w-4xl mx-auto flex flex-wrap items-center gap-x-8 gap-y-2">
            {[
              { label: 'Trimestres', value: '20' },
              { label: 'Horizon', value: '5 ans' },
              { label: 'Instruments', value: '3' },
              { label: 'Cible inflation', value: '2,0 %' },
              { label: 'NAIRU marocain', value: '9,5 %' },
              { label: 'Taux réel neutre', value: '1,5 %' },
            ].map(item => (
              <div key={item.label} className="flex items-baseline gap-2">
                <span className="label-caps">{item.label}</span>
                <span
                  className="font-mono text-sm tabular"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
