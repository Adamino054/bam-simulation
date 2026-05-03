'use client'

import dynamic from 'next/dynamic'
import { useMemo } from 'react'
import { useGameStore } from '@/store/gameStore'
import { MetricCard } from '@/components/ui/MetricCard'
import { InlineKatex } from '@/components/ui/InlineKatex'

const EconomyChart = dynamic(
  () => import('./EconomyChart').then(m => ({ default: m.EconomyChart })),
  { ssr: false, loading: () => <div className="h-[400px]" style={{ backgroundColor: 'var(--bg-panel)' }} /> },
)

export function Dashboard() {
  const { currentState, history } = useGameStore(s => ({
    currentState: s.currentState,
    history: s.history,
  }))

  const prev = history[history.length - 1]

  const inflationHistory = useMemo(
    () => [...history.map(s => s.inflation), currentState.inflation].slice(-8),
    [history, currentState],
  )
  const growthHistory = useMemo(
    () => [...history.map(s => s.gdpGrowth), currentState.gdpGrowth].slice(-8),
    [history, currentState],
  )
  const unemployHistory = useMemo(
    () => [...history.map(s => s.unemployment), currentState.unemployment].slice(-8),
    [history, currentState],
  )
  const gapHistory = useMemo(
    () => [...history.map(s => s.outputGap), currentState.outputGap].slice(-8),
    [history, currentState],
  )

  return (
    <div className="flex flex-col gap-4">
      {/* ── MetricCards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <MetricCard
          label="Inflation"
          value={currentState.inflation}
          unit="%"
          delta={prev ? currentState.inflation - prev.inflation : undefined}
          history={inflationHistory}
          accentColor="var(--accent-primary)"
          tooltipContent={
            <div className="space-y-1.5">
              <p className="font-medium text-xs" style={{ color: 'var(--text-primary)' }}>Inflation (π)</p>
              <p>Variation générale des prix à la consommation, en glissement annuel.</p>
              <p style={{ color: 'var(--text-tertiary)' }}>
                Calculée via la courbe de Phillips :
              </p>
              <InlineKatex>{'\\pi_t = \\beta\\pi^e + \\kappa\\tilde{y} + \\alpha\\Delta p^{imp}'}</InlineKatex>
              <p>La cible de BAM est de <strong>2 %</strong>. Au-delà, un resserrement monétaire est justifié.</p>
            </div>
          }
        />
        <MetricCard
          label="Croissance PIB"
          value={currentState.gdpGrowth}
          unit="%"
          delta={prev ? currentState.gdpGrowth - prev.gdpGrowth : undefined}
          history={growthHistory}
          tooltipContent={
            <div className="space-y-1.5">
              <p className="font-medium text-xs" style={{ color: 'var(--text-primary)' }}>Croissance du PIB</p>
              <p>Taux de croissance du produit intérieur brut en glissement annuel.</p>
              <p style={{ color: 'var(--text-tertiary)' }}>
                Dérivée de l'output gap : Δỹ + croissance potentielle (3 %)
              </p>
              <p>Un resserrement monétaire excessif peut déprimier la croissance en comprimant la demande.</p>
            </div>
          }
        />
        <MetricCard
          label="Chômage"
          value={currentState.unemployment}
          unit="%"
          delta={prev ? currentState.unemployment - prev.unemployment : undefined}
          history={unemployHistory}
          tooltipContent={
            <div className="space-y-1.5">
              <p className="font-medium text-xs" style={{ color: 'var(--text-primary)' }}>Taux de chômage</p>
              <p>Part de la population active sans emploi.</p>
              <InlineKatex>{'u_t = u^* - \\delta_{okun}\\cdot\\tilde{y}_t'}</InlineKatex>
              <p>Le NAIRU marocain est estimé à 9,5 %. Un output gap positif réduit le chômage.</p>
            </div>
          }
        />
        <MetricCard
          label="Output gap"
          value={currentState.outputGap}
          unit="%"
          delta={prev ? currentState.outputGap - prev.outputGap : undefined}
          history={gapHistory}
          tooltipContent={
            <div className="space-y-1.5">
              <p className="font-medium text-xs" style={{ color: 'var(--text-primary)' }}>Output gap (ỹ)</p>
              <p>Écart entre la production observée et la production potentielle.</p>
              <InlineKatex>{'\\tilde{y}_t = \\rho\\tilde{y}_{t-1} - \\sigma(i^D - \\pi^e) + \\delta\\tilde{y}^*'}</InlineKatex>
              <p>Positif = économie en surchauffe → pression inflationniste. Négatif = sous-utilisation des capacités.</p>
            </div>
          }
        />
      </div>

      {/* ── Graphes ── */}
      <div
        className="rounded p-4"
        style={{
          backgroundColor: 'var(--bg-panel)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <EconomyChart />
      </div>
    </div>
  )
}
