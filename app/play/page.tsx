'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Header } from '@/components/shell/Header'
import { Timeline } from '@/components/game/Timeline'
import { Dashboard } from '@/components/game/Dashboard'
import { DecisionPanel } from '@/components/game/DecisionPanel'
import { LeftPanel } from '@/components/game/LeftPanel'
import { useGameStore } from '@/store/gameStore'

export default function PlayPage() {
  const router = useRouter()
  const pathname = usePathname()
  const status = useGameStore(s => s.status)
  const scenario = useGameStore(s => s.scenario)
  const _hasHydrated = useGameStore(s => s._hasHydrated)

  useEffect(() => {
    // Attendre la fin de la rehydration avant de rediriger
    if (!_hasHydrated) return

    if (status === 'finished' && pathname !== '/debrief') {
      router.replace('/debrief')
    } else if ((status === 'menu' || !scenario) && pathname !== '/') {
      router.replace('/')
    }
  }, [status, scenario, pathname, router, _hasHydrated])

  // Fallback: forcer l'hydratation après 2 secondes si elle échoue
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!useGameStore.getState()._hasHydrated) {
        useGameStore.getState().setHasHydrated(true)
      }
    }, 2000)
    return () => clearTimeout(timer)
  }, [])

  // Splash de chargement pendant la rehydration localStorage
  if (!_hasHydrated) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-base)' }}
      >
        <p className="label-caps" style={{ color: 'var(--text-tertiary)' }}>
          Chargement…
        </p>
      </div>
    )
  }

  if (status !== 'playing') return null

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--bg-base)' }}
    >
      <Header variant="game" />

      {/* Timeline */}
      <div
        className="flex items-center justify-center py-2.5 px-4"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <Timeline />
      </div>

      {/* Layout 12 colonnes */}
      <main className="flex-1 w-full max-w-container mx-auto container-padding py-4">
        <div className="grid grid-cols-12 gap-3 items-start">

          {/* Sidebar gauche — contexte + chocs (3 col) */}
          <aside className="col-span-3 hidden lg:flex flex-col gap-3">
            <LeftPanel />
          </aside>

          {/* Zone centrale — dashboard + graphes (6 col) */}
          <section className="col-span-12 lg:col-span-6 flex flex-col gap-3">
            <Dashboard />
          </section>

          {/* Sidebar droite — décision (3 col) */}
          <aside className="col-span-12 lg:col-span-3">
            <DecisionPanel />
          </aside>

        </div>

        {/* Mobile : LeftPanel en bas */}
        <div className="lg:hidden mt-3">
          <LeftPanel />
        </div>
      </main>
    </div>
  )
}
