'use client'

import dynamic from 'next/dynamic'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { Anchor, CloudLightning, AlertTriangle, TrendingUp } from 'lucide-react'
import { useGameStore } from '@/store/gameStore'
import { MetricCard } from '@/components/ui/MetricCard'
import { InlineKatex } from '@/components/ui/InlineKatex'
import { NewsAlert } from '@/components/ui/NewsAlert'
import { getLevelConfig } from '@/engine/difficulty'

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

type AlertType = 'financial_innovation' | 'bubble_burst'
interface PendingAlert { id: string; type: AlertType }

const ALERT_CONTENT: Record<AlertType, { severity: 'warning' | 'critical'; title: string; body: string }> = {
  financial_innovation: {
    severity: 'warning',
    title: 'Innovation financière — Canal des taux affaibli',
    body: 'La titrisation se développe sur le marché marocain. Les banques cèdent leurs créances et le lien entre votre taux directeur et le crédit bancaire s\'affaiblit. L\'effet de vos décisions sur l\'économie réelle est désormais réduit de moitié (σ ÷ 2).',
  },
  bubble_burst: {
    severity: 'critical',
    title: 'ÉCLATEMENT DE LA BULLE SPÉCULATIVE',
    body: 'L\'accumulation de risque sur les marchés d\'actifs a atteint un point de rupture (Minsky Moment). Destruction de richesse, effondrement du crédit et récession sévère sont en cours. Utilisez le canal de l\'Emergency Lending pour stabiliser le système financier.',
  },
}

export function Dashboard() {
  const { currentState, history, difficultyLevel } = useGameStore(
    useShallow(s => ({
      currentState: s.currentState,
      history:      s.history,
      difficultyLevel: s.difficultyLevel,
    }))
  )

  const showAdvancedMetrics = getLevelConfig(difficultyLevel).showAdvancedMetrics

  const prev = history[history.length - 1]

  // ── Histories pour sparklines ──────────────────────────────────────
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

  // ── Couleurs dynamiques ────────────────────────────────────────────
  const credColor =
    currentState.centralBankCredibility > 70 ? '#4A9D7C' :
    currentState.centralBankCredibility > 40 ? '#C9A86A' :
    '#C25450'

  const caColor =
    currentState.currentAccountBalance > -4 ? '#4A9D7C' :
    currentState.currentAccountBalance > -6 ? '#C9A86A' :
    '#C25450'

  // ── Étape 2 : Détection Debt-Deflation (Mishkin / Irving Fisher) ───
  const isDebtDeflation =
    showAdvancedMetrics && currentState.inflation < 0 && (currentState.nplRatio ?? 7) > 12

  // ── Étape 4 : Icône crédibilité (BCE Expectations Channel) ────────
  const credibilityStatus: 'anchor' | 'storm' | null =
    currentState.centralBankCredibility > 80 ? 'anchor' :
    currentState.centralBankCredibility < 50 ? 'storm' :
    null

  // ── Étape 1 & 3 : Alertes NewsAlert ───────────────────────────────
  const [pendingAlerts, setPendingAlerts] = useState<PendingAlert[]>([])

  const prevAlertRef = useRef({
    financialInnovationActive: currentState.financialInnovationActive ?? false,
    assetBubbleIndex: currentState.assetBubbleIndex ?? 0,
  })

  useEffect(() => {
    const prev = prevAlertRef.current
    const fiActive  = currentState.financialInnovationActive ?? false
    const bubbleIdx = currentState.assetBubbleIndex ?? 0

    const newAlerts: PendingAlert[] = []

    // Innovation financière : première activation détectée
    if (fiActive && !prev.financialInnovationActive) {
      newAlerts.push({ id: `fi-${Date.now()}`, type: 'financial_innovation' })
    }

    // Éclatement de bulle : l'indice était ≥ 90 et vient de chuter sous 25 (reset post-crise)
    if (prev.assetBubbleIndex >= 90 && bubbleIdx < 25) {
      newAlerts.push({ id: `bb-${Date.now()}`, type: 'bubble_burst' })
    }

    if (newAlerts.length > 0) {
      setPendingAlerts(a => [...a, ...newAlerts])
    }

    prevAlertRef.current = { financialInnovationActive: fiActive, assetBubbleIndex: bubbleIdx }
  }, [currentState.financialInnovationActive, currentState.assetBubbleIndex])

  const dismissAlert = (id: string) =>
    setPendingAlerts(a => a.filter(x => x.id !== id))

  return (
    <>
      {/* ── CSS keyframes pour animations dynamiques ──────────────────── */}
      <style>{`
        @keyframes debt-deflation-pulse {
          0%, 100% {
            box-shadow: 0 0 0 2px rgba(194, 84, 80, 0.55),
                        0 0 24px rgba(194, 84, 80, 0.20);
          }
          50% {
            box-shadow: 0 0 0 3px rgba(194, 84, 80, 0.85),
                        0 0 48px rgba(194, 84, 80, 0.40);
          }
        }
        @keyframes glitch-icon {
          0%, 89%, 100% { transform: translate(0); filter: none; opacity: 1; }
          90%  { transform: translate(-2px, 1px);  filter: hue-rotate(80deg) saturate(3); opacity: 0.8; }
          91%  { transform: translate(2px, -1px);  }
          93%  { transform: translate(-1px, 2px);  filter: contrast(2.5) hue-rotate(-40deg); opacity: 0.9; }
          95%  { transform: translate(1px, -1px);  }
          97%  { transform: translate(-2px, 0);    filter: none; }
        }
        @keyframes credibility-glow {
          0%, 100% { filter: drop-shadow(0 0 3px rgba(74,157,220,0.5)); }
          50%       { filter: drop-shadow(0 0 8px rgba(74,157,220,0.9)); }
        }
      `}</style>

      {/* ── Flash Info alerts (position fixe) ─────────────────────────── */}
      {pendingAlerts.map((alert, idx) => {
        const content = ALERT_CONTENT[alert.type]
        return (
          <NewsAlert
            key={alert.id}
            severity={content.severity}
            title={content.title}
            body={content.body}
            stackIndex={idx}
            onClose={() => dismissAlert(alert.id)}
          />
        )
      })}

      {/* ── Dashboard principal ────────────────────────────────────────── */}
      <div
        className="flex flex-col gap-3"
        style={isDebtDeflation ? {
          borderRadius: '8px',
          animation: 'debt-deflation-pulse 1.6s ease-in-out infinite',
        } : {}}
      >
        {/* ── MetricCards row 1 ──────────────────────────────────────── */}
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
                <p>La cible de la Banque centrale est de 2 %. Au-delà, un resserrement est justifié.</p>
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

        {/* ── MetricCards row 2 ──────────────────────────────────────── */}
        <div className={`grid grid-cols-1 ${showAdvancedMetrics ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-2`}>
          {/* Crédibilité avec icône contextuelle (Étape 4 BCE) */}
          <div className="relative">
            <MetricCard
              label="Crédibilité Banque centrale"
              value={currentState.centralBankCredibility}
              unit=""
              precision={0}
              delta={prev ? currentState.centralBankCredibility - prev.centralBankCredibility : undefined}
              history={credibilityHistory}
              accentColor={credColor}
              tooltipContent={
                <div className="space-y-1.5">
                  <p style={{ color: '#F0F0EA', fontWeight: 600, fontSize: '11px' }}>Crédibilité (0–100)</p>
                  <p>Indice de confiance des agents dans la politique de la Banque centrale.</p>
                  <p>{"Augmente quand l'inflation reste proche de 2 %. Diminue en cas de déviation >2 pt ou de reversal de politique."}</p>
                </div>
              }
            />

            {/* Ancre bleue : anticipations solidement ancrées (> 80) */}
            {credibilityStatus === 'anchor' && (
              <div
                title="Anticipations solidement ancrées"
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '28px',
                  animation: 'credibility-glow 2.5s ease-in-out infinite',
                }}
              >
                <Anchor size={13} style={{ color: '#4A9DDC', opacity: 0.9 }} />
              </div>
            )}

            {/* Tempête rouge : anticipations désancrées (< 50) */}
            {credibilityStatus === 'storm' && (
              <div
                title="Anticipations désancrées — Le marché ne vous écoute plus"
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '28px',
                  animation: 'glitch-icon 4s ease-in-out infinite',
                }}
              >
                <CloudLightning size={13} style={{ color: '#C25450' }} />
              </div>
            )}

            {/* Label contextuel sous la carte */}
            {credibilityStatus && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '-18px',
                  left: 0,
                  right: 0,
                  textAlign: 'center',
                  fontSize: '8.5px',
                  fontFamily: '"Courier New", monospace',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                  color: credibilityStatus === 'anchor' ? '#4A9DDC' : '#C25450',
                  animation: credibilityStatus === 'storm' ? 'glitch-icon 4s ease-in-out infinite' : 'none',
                  pointerEvents: 'none',
                }}
              >
                {credibilityStatus === 'anchor'
                  ? '⚓ Anticipations ancrées'
                  : '⚡ Anticipations désancrées'}
              </div>
            )}
          </div>

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
          {showAdvancedMetrics && (
            <MetricCard
              label="Créances douteuses"
              value={currentState.nplRatio ?? 7.0}
              unit="%"
              invertDelta
              delta={prev ? (currentState.nplRatio ?? 7.0) - (prev.nplRatio ?? 7.0) : undefined}
              history={nplHistory}
              accentColor={(currentState.nplRatio ?? 7.0) > 10.0 ? 'var(--data-negative)' : (currentState.nplRatio ?? 7.0) > 8.0 ? 'var(--data-warning)' : 'var(--data-positive)'}
              tooltipContent={
                <div className="space-y-1.5">
                  <p style={{ color: '#F0F0EA', fontWeight: 600, fontSize: '11px' }}>Créances en souffrance (NPL)</p>
                  <p>Indice de stabilité financière. Les défauts de crédit étouffent le prêt bancaire.</p>
                  <p>Augmente avec les taux d&apos;intérêt élevés et les récessions économiques.</p>
                </div>
              }
            />
          )}
        </div>

        {/* ── Étape 2 : Panel Debt-Deflation (Mishkin / Irving Fisher) ── */}
        {isDebtDeflation && (
          <div
            className="rounded-md px-4 py-3.5 flex flex-col gap-2"
            style={{
              backgroundColor: 'rgba(194, 84, 80, 0.08)',
              border: '1px solid rgba(194, 84, 80, 0.35)',
            }}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} style={{ color: '#C25450', flexShrink: 0 }} />
              <span
                style={{
                  fontFamily: '"Courier New", monospace',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#E8847E',
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                }}
              >
                PIÈGE DE LA DETTE-DÉFLATION — Irving Fisher (1933)
              </span>
            </div>

            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              L&apos;économie est entrée dans une spirale déflationniste (π &lt; 0 %) avec un secteur
              bancaire fragilisé (NPL &gt; 12 %). La déflation alourdit le poids réel des dettes,
              comprime les bilans et bloque le crédit — même une baisse de taux à 0 % ne suffit pas
              (Borne Zéro, Zero Lower Bound).
            </p>

            <div className="flex items-start gap-2 mt-1">
              <TrendingUp size={12} style={{ color: '#C9A86A', flexShrink: 0, marginTop: '2px' }} />
              <p style={{ fontSize: '10.5px', color: '#C9A86A', lineHeight: '1.55', fontFamily: '"Courier New", monospace' }}>
                CONSEIL STRATÉGIQUE : Le canal des taux est bloqué. Activez l&apos;
                <strong>Emergency Lending</strong> (10–20 mds MAD) pour recapitaliser le système
                bancaire et rétablir le flux de crédit vers l&apos;économie réelle.
              </p>
            </div>
          </div>
        )}

        {/* ── Graphes ─────────────────────────────────────────────────── */}
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
    </>
  )
}
