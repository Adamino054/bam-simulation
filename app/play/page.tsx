'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/shell/Header'
import { Timeline } from '@/components/game/Timeline'
import { Dashboard } from '@/components/game/Dashboard'
import { DecisionPanel } from '@/components/game/DecisionPanel'
import { LeftPanel } from '@/components/game/LeftPanel'
import { useGameStore } from '@/store/gameStore'

export default function PlayPage() {
  const router = useRouter()
  const { status, scenario } = useGameStore(s => ({
    status: s.status,
    scenario: s.scenario,
  }))

  // Rediriger si la partie est terminée ou pas démarrée
  useEffect(() => {
    if (status === 'finished') {
      router.push('/debrief')
    } else if (status === 'menu' || !scenario) {
      router.push('/')
    }
  }, [status, scenario, router])

  if (status !== 'playing') return null

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--bg-base)' }}
    >
      {/* ── Header fixe ── */}
      <Header variant="game" />

      {/* ── Timeline ── */}
      <div
        className="flex items-center justify-center py-3 px-4"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <Timeline />
      </div>

      {/* ── Layout principal ── */}
      <main className="flex-1 w-full max-w-container mx-auto container-padding py-4">
        <div className="grid grid-cols-12 gap-4 h-full">

          {/* Sidebar gauche (3 colonnes) */}
          <aside className="col-span-3 hidden lg:block">
            <LeftPanel />
          </aside>

          {/* Zone centrale (6 colonnes) */}
          <section className="col-span-12 lg:col-span-6">
            <Dashboard />
          </section>

          {/* Sidebar droite (3 colonnes) */}
          <aside className="col-span-12 lg:col-span-3">
            <DecisionPanel />
          </aside>

        </div>

        {/* Mobile : LeftPanel collapse sous le Dashboard */}
        <div className="lg:hidden mt-4">
          <LeftPanel />
        </div>
      </main>
    </div>
  )
}
