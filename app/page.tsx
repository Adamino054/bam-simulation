'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGameStore } from '@/store/gameStore'
import { SCENARIOS } from '@/engine/scenarios'
import { ThemeToggle } from '@/components/shell/ThemeToggle'
import type { ScenarioId } from '@/engine/state'

const DIFFICULTY_META: Record<string, { label: string; color: string; bg: string }> = {
  normal: { label: 'Standard',  color: '#4A9D7C', bg: 'rgba(74, 157, 124, 0.12)' },
  hard:   { label: 'Difficile', color: '#C9A86A', bg: 'rgba(201, 168, 106, 0.12)' },
  crisis: { label: 'Crise',     color: '#C25450', bg: 'rgba(194, 84, 80, 0.12)'  },
}

const STATS = [
  { label: 'Horizon',         value: '5 ans'  },
  { label: 'Trimestres',      value: '20'     },
  { label: 'Instruments',     value: '3'      },
  { label: 'Cible inflation', value: '2,0 %'  },
  { label: 'NAIRU',           value: '9,5 %'  },
  { label: 'Taux neutre',     value: '1,5 %'  },
]

export default function HomePage() {
  const router    = useRouter()
  const startGame = useGameStore(s => s.startGame)
  const [selected, setSelected] = useState<ScenarioId>('standard')

  const handleStart = () => {
    startGame(selected)
    router.push('/play')
  }

  const scenarios     = Object.values(SCENARIOS)
  const selectedMeta  = DIFFICULTY_META[SCENARIOS[selected].difficulty]

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--bg-base)', position: 'relative', overflow: 'hidden' }}
    >
      {/* ── Ambient radial glow ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-80px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '1100px',
          height: '650px',
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(180,25,35,0.13) 0%, rgba(180,25,35,0.04) 40%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* ── Dot grid ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'radial-gradient(circle, rgba(240,240,234,0.045) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* ── Content (above decorations) ── */}
      <div className="relative flex flex-col min-h-screen" style={{ zIndex: 1 }}>

        {/* Nav */}
        <nav
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-center gap-3">
            <span
              className="font-editorial"
              style={{ color: 'var(--accent-primary)', fontSize: '1.15rem', letterSpacing: '-0.01em' }}
            >
              CBS
            </span>
            <span style={{ color: 'var(--border-default)' }}>·</span>
            <span className="label-caps hidden sm:block" style={{ color: 'var(--text-tertiary)' }}>
              Bank Al-Maghrib — Simulateur de politique monétaire
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/about"
              className="label-caps transition-colors duration-150"
              style={{ color: 'var(--text-tertiary)', textDecoration: 'none' }}
              onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-secondary)')}
              onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-tertiary)')}
            >
              À propos
            </a>
            <ThemeToggle />
          </div>
        </nav>

        {/* Hero */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 pt-14 pb-8 max-w-4xl mx-auto w-full">

          {/* Live badge */}
          <div
            className="inline-flex items-center gap-2 mb-9 px-3.5 py-1.5 rounded-full"
            style={{
              backgroundColor: 'var(--bg-panel)',
              border: '1px solid var(--border-default)',
            }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full animate-pulse-soft"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            />
            <span className="label-caps" style={{ letterSpacing: '0.12em' }}>
              Serious game · Projet de Fin d'Année · BAM 2025
            </span>
          </div>

          {/* Title */}
          <h1
            className="font-editorial text-center mb-4"
            style={{
              fontSize: 'clamp(3.5rem, 8vw, 7rem)',
              letterSpacing: '-0.03em',
              lineHeight: 0.92,
              color: 'var(--text-primary)',
            }}
          >
            Vous êtes<br />le gouverneur.
          </h1>

          {/* Subtitle */}
          <p
            className="text-center mb-3 max-w-md"
            style={{ fontSize: '1.0625rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}
          >
            Cinq ans pour piloter l'économie marocaine.
            <br />Quatre instruments. Une cible : 2&nbsp;% d'inflation.
          </p>
          <p
            className="text-center mb-12 max-w-xl text-sm leading-relaxed"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Incarnez le gouverneur de Bank Al-Maghrib et prenez des décisions
            trimestre par trimestre — taux directeur, réserves obligatoires, opérations de marché.
            Naviguez entre stabilité des prix, croissance et chocs exogènes imprévisibles.
          </p>

          {/* ── Scenario selector ── */}
          <div className="w-full max-w-2xl">
            <p className="label-caps mb-3">Choisir un scénario</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
              {scenarios.map(sc => {
                const isSelected = sc.id === selected
                const meta = DIFFICULTY_META[sc.difficulty]
                return (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => setSelected(sc.id)}
                    className="relative text-left rounded-lg p-4 transition-all duration-200"
                    style={{
                      backgroundColor: isSelected ? 'var(--bg-elevated)' : 'var(--bg-panel)',
                      border: `1px solid ${isSelected ? meta.color + '55' : 'var(--border-default)'}`,
                      boxShadow: isSelected
                        ? `0 0 0 1px ${meta.color}22, 0 6px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)`
                        : 'none',
                      transform: isSelected ? 'translateY(-2px)' : 'translateY(0)',
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) {
                        const el = e.currentTarget as HTMLElement
                        el.style.backgroundColor = 'var(--bg-elevated)'
                        el.style.transform = 'translateY(-1px)'
                        el.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)'
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) {
                        const el = e.currentTarget as HTMLElement
                        el.style.backgroundColor = 'var(--bg-panel)'
                        el.style.transform = 'translateY(0)'
                        el.style.boxShadow = 'none'
                      }
                    }}
                  >
                    {/* Difficulty pill */}
                    <span
                      className="inline-flex items-center gap-1.5 mb-3 px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: meta.bg,
                        color: meta.color,
                        fontSize: '9px',
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                      }}
                    >
                      <span style={{
                        width: '4px', height: '4px',
                        borderRadius: '50%',
                        backgroundColor: meta.color,
                        display: 'inline-block',
                        flexShrink: 0,
                      }} />
                      {meta.label}
                    </span>

                    <span
                      className="block font-medium mb-1"
                      style={{ color: 'var(--text-primary)', fontSize: '13px', lineHeight: 1.3 }}
                    >
                      {sc.title}
                    </span>
                    <span className="block text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                      {sc.subtitle}
                    </span>

                    {/* Selected checkmark */}
                    {isSelected && (
                      <span
                        className="absolute top-3 right-3 flex items-center justify-center w-[18px] h-[18px] rounded-full"
                        style={{ backgroundColor: meta.color }}
                      >
                        <svg width="8" height="6" viewBox="0 0 8 6" fill="none" aria-hidden>
                          <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Scenario description */}
            <div
              className="rounded-md px-4 py-3 mb-5 text-sm text-left leading-relaxed"
              style={{
                backgroundColor: 'var(--bg-panel)',
                border: '1px solid var(--border-subtle)',
                borderLeft: `3px solid ${selectedMeta.color}`,
                color: 'var(--text-secondary)',
                fontStyle: 'italic',
              }}
            >
              {SCENARIOS[selected].description}
            </div>

            {/* CTA */}
            <button
              type="button"
              onClick={handleStart}
              className="w-full py-4 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, #C41923 0%, #8B131B 100%)',
                color: '#fff',
                border: 'none',
                letterSpacing: '0.06em',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2), 0 4px 20px rgba(180,25,35,0.3)',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2), 0 8px 32px rgba(180,25,35,0.45)'
                el.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2), 0 4px 20px rgba(180,25,35,0.3)'
                el.style.transform = 'translateY(0)'
              }}
            >
              Commencer la partie
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d="M2.5 7H11.5M8 3.5L11.5 7L8 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </main>

        {/* ── Stats bar ── */}
        <div className="py-5 px-6" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
            {STATS.map(item => (
              <div key={item.label} className="flex items-baseline gap-2">
                <span className="label-caps">{item.label}</span>
                <span
                  className="font-mono text-sm tabular font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
