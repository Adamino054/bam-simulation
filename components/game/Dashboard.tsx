'use client'

import dynamic from 'next/dynamic'
import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useGameStore } from '@/store/gameStore'
import { MetricCard } from '@/components/ui/MetricCard'
import { InlineKatex } from '@/components/ui/InlineKatex'

const EconomyChart = dynamic(
  () => import('./EconomyChart').then(m => ({ default: m.EconomyChart })),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex items-center justify-center"
        style={{ height: '380px', backgroundColor: 'var(--bg-panel)' }}
      >
        <p className="label-caps">Chargement du graphe…</p>
      </div>
    ),
  },
)

export function Dashboard() {
  const { currentState, history } = useGameStore(
    useShallow(s => ({
      currentState: s.currentState,
      history:      s.history,
    }))
  )

  const prev = history[history.length - 1]

  const inflationHistory = useMemo(
    () => [...history.map(s => s.inflation), currentState.inflation].slice(-10),
    [history, currentState],
  )
  const growthHistory = useMemo(
    () => [...history.map(s => s.gdpGrowth), currentState.gdpGrowth].slice(-10),
    [history, currentState],
  )
  const unemployHistory = useMemo(
    () => [...history.map(s => s.unemployment), currentState.unemployment].slice(-10),
    [history, currentState],
  )
  const gapHistory = useMemo(
    () => [...history.map(s => s.outputGap), currentState.outputGap].slice(-10),
    [history, currentState],
  )
  const credibilityHistory = useMemo(
    () => [...history.map(s => s.centralBankCredibility), currentState.centralBankCredibility].slice(-10),
    [history, currentState],
  )
  const currentAccountHistory = useMemo(
    () => [...history.map(s => s.currentAccountBalance), currentState.currentAccountBalance].slice(-10),
    [history, currentState],
  )
  const nplHistory = useMemo(
    () => [...history.map(s => s.nplRatio ?? 7.0), currentState.nplRatio ?? 7.0].slice(-10),
    [history, currentState],
  )

  const credColor =
    currentState.centralBankCredibility > 70 ? '#4A9D7C' :
    currentState.centralBankCredibility > 40 ? '#C9A86A' :
    '#C25450'

  const caColor =
    currentState.currentAccountBalance > -4 ? '#4A9D7C' :
    currentState.currentAccountBalance > -6 ? '#C9A86A' :
    '#C25450'

  return (
    <div className="flex flex-col gap-3">
      {/* MetricCards row 1 */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
        <MetricCard
          label="Inflation"
          value={currentState.inflation}
          unit="%"
          delta={prev ? currentState.inflation - prev.inflation : undefined}
          history={inflationHistory}
          accentColor="#B41923"
          tooltipContent={
            <div className="space-y-1.5">
              <p style={{ color: '#F0F0EA', fontWeight: 600, fontSize: '11px' }}>Inflation (π)</p>
              <p>Variation générale des prix à la consommation, en glissement annuel.</p>
              <InlineKatex>{'\\pi_t = \\beta\\pi^e + \\kappa\\tilde{y} + \\alpha\\Delta p^{imp}'}</InlineKatex>
              <p>La cible de BAM est de 2 %. Au-delà, un resserrement est justifié.</p>
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
              <p style={{ color: '#F0F0EA', fontWeight: 600, fontSize: '11px' }}>Croissance du PIB</p>
              <p>Taux de croissance en glissement annuel. Croissance potentielle ≈ 3 %.</p>
              <p>Un resserrement monétaire excessif déprime la demande et ralentit la croissance.</p>
            </div>
          }
        />
        <MetricCard
          label="Chômage"
          value={currentState.unemployment}
          unit="%"
          delta={prev ? currentState.unemployment - prev.unemployment : undefined}
          history={unemployHistory}
          invertDelta
          tooltipContent={
            <div className="space-y-1.5">
              <p style={{ color: '#F0F0EA', fontWeight: 600, fontSize: '11px' }}>Taux de chômage</p>
              <p>Part de la population active sans emploi. NAIRU marocain ≈ 9,5 %.</p>
              <InlineKatex>{'u_t = u^* - \\delta_{okun}\\cdot\\tilde{y}_t'}</InlineKatex>
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
              <p style={{ color: '#F0F0EA', fontWeight: 600, fontSize: '11px' }}>Output gap (ỹ)</p>
              <p>Écart entre production observée et potentielle. Positif = surchauffe.</p>
              <InlineKatex>{'\\tilde{y}_t = \\rho\\tilde{y}_{t-1} - \\sigma(i^D - \\pi^e) + \\delta\\tilde{y}^*'}</InlineKatex>
            </div>
          }
        />
      </div>

      {/* MetricCards row 2: new metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <MetricCard
          label="Crédibilité BAM"
          value={currentState.centralBankCredibility}
          unit=""
          precision={0}
          delta={prev ? currentState.centralBankCredibility - prev.centralBankCredibility : undefined}
          history={credibilityHistory}
          accentColor={credColor}
          tooltipContent={
            <div className="space-y-1.5">
              <p style={{ color: '#F0F0EA', fontWeight: 600, fontSize: '11px' }}>Crédibilité (0–100)</p>
              <p>Indice de confiance des agents dans la politique de BAM.</p>
              <p>{"Augmente quand l'inflation reste proche de 2 %. Diminue en cas de déviation >2 pt ou de reversal de politique."}</p>
            </div>
          }
        />
        <MetricCard
          label="Solde courant"
          value={currentState.currentAccountBalance}
          unit="% PIB"
          delta={prev ? currentState.currentAccountBalance - prev.currentAccountBalance : undefined}
          history={currentAccountHistory}
          accentColor={caColor}
          tooltipContent={
            <div className="space-y-1.5">
              <p style={{ color: '#F0F0EA', fontWeight: 600, fontSize: '11px' }}>Solde courant (% PIB)</p>
              <p>Balance des échanges courants. Zone de confort : −4 % à 0 %.</p>
              <p>Un déficit {">"} 6 % déclenche une prime de risque automatique.</p>
            </div>
          }
        />
        <MetricCard
          label="Créances douteuses"
          value={currentState.nplRatio ?? 7.0}
          unit="%"
          invertDelta
          delta={prev ? (currentState.nplRatio ?? 7.0) - (prev.nplRatio ?? 7.0) : undefined}
          history={nplHistory}
          accentColor={currentState.nplRatio > 10.0 ? 'var(--data-negative)' : currentState.nplRatio > 8.0 ? 'var(--data-warning)' : 'var(--data-positive)'}
          tooltipContent={
            <div className="space-y-1.5">
              <p style={{ color: '#F0F0EA', fontWeight: 600, fontSize: '11px' }}>Créances en souffrance (NPL)</p>
              <p>Indice de stabilité financière. Les défauts de crédit étouffent le prêt bancaire.</p>
              <p>Augmente avec les taux d&apos;intérêt élevés et les récessions économiques.</p>
            </div>
          }
        />
      </div>

      {/* Graphes */}
      <div
        className="rounded-md p-4"
        style={{
          backgroundColor: 'var(--bg-panel)',
          border: '1px solid var(--border-default)',
        }}
      >
        <EconomyChart />
      </div>
    </div>
  )
}
