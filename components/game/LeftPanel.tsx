'use client'

import React, { useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import {
  TableProperties, AlertTriangle, TrendingUp, Flame,
  Activity, Shield, Zap, BarChart3, Target, Check,
} from 'lucide-react'
import { useGameStore } from '@/store/gameStore'
import { ShockBannerList } from './ShockBannerList'
import { HistoryDrawer } from './HistoryDrawer'
import { fmtPct, fmtQuarter } from '@/lib/format'
import type { FiscalStance } from '@/engine/state'

const FISCAL_LABELS: Record<FiscalStance, { label: string; color: string; bg: string }> = {
  expansionary:   { label: 'Expansionniste', color: '#4A9D7C', bg: 'rgba(74,157,124,0.15)' },
  neutral:        { label: 'Neutre',         color: '#9A9B9B', bg: 'rgba(154,155,155,0.15)' },
  contractionary: { label: 'Restrictive',    color: '#C25450', bg: 'rgba(194,84,80,0.15)' },
}

const CRED_ZONES = [
  { min: 0,  max: 25,  color: '#C25450', label: 'CRITIQUE' },
  { min: 25, max: 50,  color: '#E8914A', label: 'FRAGILE' },
  { min: 50, max: 75,  color: '#C9A86A', label: 'MODÉRÉE' },
  { min: 75, max: 100, color: '#4A9D7C', label: 'SOLIDE' },
]

const BUBBLE_ZONES = [
  { min: 0,  max: 30,  color: '#4A9D7C', label: 'NORMAL' },
  { min: 30, max: 60,  color: '#C9A86A', label: 'SURVEILL.' },
  { min: 60, max: 80,  color: '#E8914A', label: 'ALERTE' },
  { min: 80, max: 100, color: '#C25450', label: 'CRITIQUE' },
]

function getEcoStatus(inflation: number, outputGap: number, credibility: number) {
  const infDev = Math.abs(inflation - 2)
  const gapDev = Math.abs(outputGap)
  if (infDev > 3 || gapDev > 3 || credibility < 30)
    return { label: 'CRISE',       color: '#C25450', bg: 'rgba(194,84,80,0.15)',  pulse: true  }
  if (infDev > 1.5 || gapDev > 2 || credibility < 50)
    return { label: 'ALERTE',      color: '#E8914A', bg: 'rgba(232,145,74,0.15)', pulse: true  }
  if (infDev > 0.8 || gapDev > 1 || credibility < 70)
    return { label: 'SURVEILLANCE', color: '#C9A86A', bg: 'rgba(201,168,106,0.15)', pulse: false }
  return     { label: 'STABLE',    color: '#4A9D7C', bg: 'rgba(74,157,124,0.15)', pulse: false }
}

function generateNarrative(state: {
  inflation: number; outputGap: number; externalDemand: number
  gdpGrowth: number; unemployment: number; centralBankCredibility: number
  currentAccountBalance: number
}): string {
  const { inflation, outputGap, externalDemand, gdpGrowth, centralBankCredibility } = state
  const parts: string[] = []

  if (inflation > 4.0) {
    parts.push(`L'inflation atteint ${fmtPct(inflation)}, nettement au-dessus de la cible. La priorité est le resserrement.`)
  } else if (inflation > 2.5) {
    parts.push(`L'inflation s'établit à ${fmtPct(inflation)}, légèrement au-dessus de la cible.`)
  } else if (inflation < 0.5) {
    parts.push(`L'inflation est tombée à ${fmtPct(inflation)}, avec un risque déflationniste.`)
  } else if (inflation < 1.5) {
    parts.push(`L'inflation est sous la cible à ${fmtPct(inflation)}.`)
  } else {
    parts.push(`L'inflation s'établit à ${fmtPct(inflation)}, proche de la cible.`)
  }

  if (outputGap < -1.5) {
    parts.push("L'économie sous-utilise ses capacités.")
  } else if (outputGap > 1.5) {
    parts.push("La demande dépasse le potentiel.")
  } else {
    parts.push("L'activité opère proche de son potentiel.")
  }

  if (externalDemand < -0.8) {
    parts.push("La demande extérieure se contracte.")
  } else if (gdpGrowth < 1) {
    parts.push("La croissance ralentit fortement.")
  }

  if (centralBankCredibility < 40) {
    parts.push("La crédibilité de la Banque centrale est fragilisée.")
  }

  return parts.join(' ')
}

function ZonedBar({
  value,
  zones,
  pulse = false,
}: {
  value: number
  zones: { min: number; max: number; color: string; label: string }[]
  pulse?: boolean
}) {
  const clamped = Math.max(0, Math.min(value, 100))
  const activeZoneIdx = zones.findIndex(
    (z, i) => clamped >= z.min && (i === zones.length - 1 ? clamped <= z.max : clamped < z.max)
  )

  return (
    <div className="flex flex-col gap-1">
      <div className="relative h-3 flex gap-px" style={{ borderRadius: '3px', overflow: 'hidden' }}>
        {zones.map((zone, i) => {
          const span = zone.max - zone.min
          const fill = Math.max(0, Math.min(clamped - zone.min, span))
          const fillPct = (fill / span) * 100
          const isActive = i === activeZoneIdx
          return (
            <div
              key={i}
              className="relative overflow-hidden"
              style={{ flex: span, backgroundColor: `${zone.color}1A`, borderRadius: '2px' }}
            >
              <div
                className={`absolute inset-y-0 left-0 transition-all duration-700${pulse && isActive ? ' animate-pulse' : ''}`}
                style={{
                  width: `${fillPct}%`,
                  backgroundColor: zone.color,
                  boxShadow: pulse && isActive && fillPct > 0 ? `0 0 8px ${zone.color}99` : 'none',
                }}
              />
            </div>
          )
        })}
      </div>

      <div className="flex">
        {zones.map((zone, i) => {
          const isActive = i === activeZoneIdx
          return (
            <div key={i} className="text-center" style={{ flex: zone.max - zone.min }}>
              <span
                style={{
                  fontSize: '9px',
                  fontFamily: 'monospace',
                  color: isActive ? zone.color : 'var(--text-tertiary)',
                  fontWeight: isActive ? 700 : 400,
                  letterSpacing: '0.03em',
                }}
              >
                {zone.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function MetricTile({
  label,
  value,
  color,
  icon: Icon,
}: {
  label: string
  value: string
  color?: string
  icon?: React.ElementType
}) {
  return (
    <div
      className="rounded px-2.5 py-2 flex flex-col gap-1"
      style={{
        backgroundColor: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div className="flex items-center gap-1 mb-0.5">
        {Icon && <Icon size={10} style={{ color: color ?? 'var(--text-tertiary)' }} />}
        <span
          className="label-caps"
          style={{ fontSize: '10px', color: 'var(--text-secondary)' }}
        >
          {label}
        </span>
      </div>
      <span
        className="font-mono font-semibold tabular"
        style={{ fontSize: '13px', color: color ?? 'var(--text-primary)', lineHeight: 1 }}
      >
        {value}
      </span>
    </div>
  )
}

function SectionLabel({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 mb-2.5">
      <Icon size={11} style={{ color: 'var(--text-tertiary)' }} />
      <span className="label-caps" style={{ fontSize: '11px', letterSpacing: '0.08em' }}>
        {children}
      </span>
    </div>
  )
}

export function LeftPanel() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { currentState, history, activeShocks } = useGameStore(
    useShallow(s => ({ currentState: s.currentState, history: s.history, activeShocks: s.activeShocks }))
  )

  const narrative  = generateNarrative(currentState)
  const fiscalMeta = FISCAL_LABELS[currentState.fiscalStance]
  const ecoStatus  = getEcoStatus(
    currentState.inflation,
    currentState.outputGap,
    currentState.centralBankCredibility
  )

  const credColor =
    currentState.centralBankCredibility > 70 ? '#4A9D7C' :
    currentState.centralBankCredibility > 40 ? '#C9A86A' : '#C25450'

  const bubbleIndex    = currentState.assetBubbleIndex ?? 0
  const bubbleColor    =
    bubbleIndex > 80 ? '#C25450' :
    bubbleIndex > 60 ? '#E8914A' :
    bubbleIndex > 30 ? '#C9A86A' : '#4A9D7C'
  const isBubbleCrit   = bubbleIndex > 75
  const showBubble     = bubbleIndex > 5

  const rateColor = (r: number) =>
    r > 5 ? '#C25450' : r > 3 ? '#C9A86A' : '#4A9D7C'

  const creditColor =
    currentState.creditGrowth > 15 ? '#C25450' :
    currentState.creditGrowth > 10 ? '#C9A86A' : '#4A9D7C'

  const caColor =
    currentState.currentAccountBalance < -5 ? '#C25450' :
    currentState.currentAccountBalance < -2 ? '#C9A86A' : '#4A9D7C'

  const isInflationTargetMet = currentState.inflation >= 1.5 && currentState.inflation <= 2.5
  const isOutputGapMet = currentState.outputGap >= -1.5 && currentState.outputGap <= 1.5
  const isCredibilityMet = currentState.centralBankCredibility >= 70
  const isNplMet = (currentState.nplRatio ?? 7.0) < 10

  return (
    <div
      className="rounded-md overflow-hidden flex flex-col"
      style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-default)' }}
    >
      {/* ── Header ── */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div className="flex flex-col gap-0.5">
          <span
            className="font-mono"
            style={{ fontSize: '11px', color: 'var(--text-secondary)', letterSpacing: '0.1em' }}
          >
            BANQUE CENTRALE
          </span>
          <span
            className="font-mono font-bold"
            style={{ fontSize: '17px', color: 'var(--accent-primary)', lineHeight: 1 }}
          >
            {fmtQuarter(currentState.date.year, currentState.date.q)}
          </span>
        </div>

        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded"
          style={{
            backgroundColor: ecoStatus.bg,
            color: ecoStatus.color,
            fontSize: '11px',
            fontFamily: 'monospace',
            fontWeight: 700,
            letterSpacing: '0.08em',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: ecoStatus.color,
              display: 'inline-block',
              boxShadow: `0 0 6px ${ecoStatus.color}`,
              animation: ecoStatus.pulse ? 'pulse 1.5s ease-in-out infinite' : 'none',
            }}
          />
          {ecoStatus.label}
        </span>
      </div>

      {/* ── Bulletin de conjoncture ── */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-2.5">
          <Activity size={11} style={{ color: 'var(--text-tertiary)' }} />
          <span className="label-caps" style={{ fontSize: '11px', letterSpacing: '0.08em' }}>
            BULLETIN DE CONJONCTURE
          </span>
          <span
            className="inline-flex items-center gap-1 px-2 py-1 rounded ml-auto"
            style={{
              backgroundColor: fiscalMeta.bg,
              color: fiscalMeta.color,
              fontSize: '10px',
              fontFamily: 'monospace',
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: '4px', height: '4px', borderRadius: '50%',
                backgroundColor: fiscalMeta.color, display: 'inline-block',
              }}
            />
            {fiscalMeta.label}
          </span>
        </div>

        <div
          className="rounded px-3 py-2.5"
          style={{
            borderLeft: `2px solid ${ecoStatus.color}`,
            backgroundColor: 'var(--bg-elevated)',
          }}
        >
          <p
            className="leading-relaxed"
            style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}
          >
            {narrative}
          </p>
        </div>
      </div>

      {/* ── Objectifs de Politique Monétaire ── */}
      <div
        className="px-4 py-3"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center gap-1.5 mb-2.5">
          <Target size={11} style={{ color: 'var(--accent-warm)' }} />
          <span className="label-caps" style={{ fontSize: '11px', letterSpacing: '0.08em', color: 'var(--text-primary)' }}>
            OBJECTIFS DE POLITIQUE MONÉTAIRE
          </span>
        </div>
        
        <div className="flex flex-col gap-2">
          {/* Objectif 1: Inflation */}
          <div 
            className="checklist-item flex items-start gap-2.5 p-2 rounded border border-border-default"
            style={{ backgroundColor: 'var(--bg-elevated)' }}
          >
            <div className="mt-0.5 flex-shrink-0">
              {isInflationTargetMet ? (
                <div className="w-4 h-4 rounded-full flex items-center justify-center bg-data-positive text-white" style={{ backgroundColor: 'rgba(74, 157, 124, 0.2)', border: '1px solid #4A9D7C' }}>
                  <Check size={10} style={{ color: '#4A9D7C' }} />
                </div>
              ) : (
                <div className="w-4 h-4 rounded-full border border-border-strong flex-shrink-0" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-text-primary">Stabilité des Prix (Inflation)</span>
                <span className="text-[10px] font-mono font-bold" style={{ color: isInflationTargetMet ? '#4A9D7C' : '#C25450' }}>
                  {currentState.inflation.toFixed(1)}%
                </span>
              </div>
              <p className="text-[9px] text-text-tertiary mt-0.5 leading-tight">
                Cible : 1.5% - 2.5% (Actuel : {isInflationTargetMet ? 'Stable' : currentState.inflation > 2.5 ? 'Trop élevée' : 'Trop basse'})
              </p>
            </div>
          </div>

          {/* Objectif 2: Output Gap */}
          <div 
            className="checklist-item flex items-start gap-2.5 p-2 rounded border border-border-default"
            style={{ backgroundColor: 'var(--bg-elevated)' }}
          >
            <div className="mt-0.5 flex-shrink-0">
              {isOutputGapMet ? (
                <div className="w-4 h-4 rounded-full flex items-center justify-center bg-data-positive text-white" style={{ backgroundColor: 'rgba(74, 157, 124, 0.2)', border: '1px solid #4A9D7C' }}>
                  <Check size={10} style={{ color: '#4A9D7C' }} />
                </div>
              ) : (
                <div className="w-4 h-4 rounded-full border border-border-strong flex-shrink-0" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-text-primary">Plein Potentiel PIB (Output Gap)</span>
                <span className="text-[10px] font-mono font-bold" style={{ color: isOutputGapMet ? '#4A9D7C' : '#C9A86A' }}>
                  {currentState.outputGap > 0 ? '+' : ''}{currentState.outputGap.toFixed(1)}%
                </span>
              </div>
              <p className="text-[9px] text-text-tertiary mt-0.5 leading-tight">
                Zone confort : -1.5% à +1.5% (Actuel : {isOutputGapMet ? 'Équilibré' : currentState.outputGap > 1.5 ? 'Surchauffe' : 'Sous-utilisation'})
              </p>
            </div>
          </div>

          {/* Objectif 3: Crédibilité */}
          <div 
            className="checklist-item flex items-start gap-2.5 p-2 rounded border border-border-default"
            style={{ backgroundColor: 'var(--bg-elevated)' }}
          >
            <div className="mt-0.5 flex-shrink-0">
              {isCredibilityMet ? (
                <div className="w-4 h-4 rounded-full flex items-center justify-center bg-data-positive text-white" style={{ backgroundColor: 'rgba(74, 157, 124, 0.2)', border: '1px solid #4A9D7C' }}>
                  <Check size={10} style={{ color: '#4A9D7C' }} />
                </div>
              ) : (
                <div className="w-4 h-4 rounded-full border border-border-strong flex-shrink-0" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-text-primary">Crédibilité de l&apos;Institution</span>
                <span className="text-[10px] font-mono font-bold" style={{ color: isCredibilityMet ? '#4A9D7C' : '#C25450' }}>
                  {Math.round(currentState.centralBankCredibility)}/100
                </span>
              </div>
              <p className="text-[9px] text-text-tertiary mt-0.5 leading-tight">
                Seuil de confiance : &ge; 70 (Actuel : {isCredibilityMet ? 'Élevé' : 'Insuffisant'})
              </p>
            </div>
          </div>

          {/* Objectif 4: Stabilité Financière (NPL) */}
          <div 
            className="checklist-item flex items-start gap-2.5 p-2 rounded border border-border-default"
            style={{ backgroundColor: 'var(--bg-elevated)' }}
          >
            <div className="mt-0.5 flex-shrink-0">
              {isNplMet ? (
                <div className="w-4 h-4 rounded-full flex items-center justify-center bg-data-positive text-white" style={{ backgroundColor: 'rgba(74, 157, 124, 0.2)', border: '1px solid #4A9D7C' }}>
                  <Check size={10} style={{ color: '#4A9D7C' }} />
                </div>
              ) : (
                <div className="w-4 h-4 rounded-full border border-border-strong flex-shrink-0" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-text-primary">Stabilité Financière (Créances / NPL)</span>
                <span className="text-[10px] font-mono font-bold" style={{ color: isNplMet ? '#4A9D7C' : '#C25450' }}>
                  {(currentState.nplRatio ?? 7.0).toFixed(1)}%
                </span>
              </div>
              <p className="text-[9px] text-text-tertiary mt-0.5 leading-tight">
                Seuil d&apos;alerte : &lt; 10% (Actuel : {isNplMet ? 'Résistant' : 'Critique'})
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Crédibilité Banque centrale ── */}
      <div
        className="px-4 py-3"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center gap-1.5 mb-2.5">
          <Shield size={11} style={{ color: credColor }} />
          <span className="label-caps" style={{ fontSize: '11px', letterSpacing: '0.08em' }}>
            CRÉDIBILITÉ BANQUE CENTRALE
          </span>
          <span
            className="font-mono font-bold tabular ml-auto"
            style={{ fontSize: '14px', color: credColor, lineHeight: 1 }}
          >
            {Math.round(currentState.centralBankCredibility)}
            <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-tertiary)' }}>
              /100
            </span>
          </span>
        </div>

        <ZonedBar value={currentState.centralBankCredibility} zones={CRED_ZONES} />
      </div>

      {/* ── Bulle spéculative ── */}
      {showBubble && (
        <div
          className="px-4 py-3"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-center gap-1.5 mb-2.5">
            {isBubbleCrit
              ? <Flame size={11} style={{ color: bubbleColor }} />
              : <TrendingUp size={11} style={{ color: bubbleColor }} />
            }
            <span className="label-caps" style={{ fontSize: '11px', letterSpacing: '0.08em' }}>
              PRIX D&apos;ACTIFS / BULLE
            </span>
            <span
              className="font-mono font-bold tabular ml-auto"
              style={{ fontSize: '14px', color: bubbleColor, lineHeight: 1 }}
            >
              {Math.round(bubbleIndex)}
              <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-tertiary)' }}>
                /100
              </span>
            </span>
          </div>

          <ZonedBar value={bubbleIndex} zones={BUBBLE_ZONES} pulse={isBubbleCrit} />

          {isBubbleCrit && (
            <p
              className="font-mono mt-2"
              style={{ fontSize: '11px', color: '#C25450' }}
            >
              ⚠ Risque systémique — resserrement urgent recommandé
            </p>
          )}
        </div>
      )}

      {/* ── Alerte solde courant ── */}
      {currentState.currentAccountBalance < -6 && (
        <div
          className="mx-4 mb-1 px-2.5 py-2 rounded flex items-center gap-2"
          style={{
            backgroundColor: 'rgba(194,84,80,0.1)',
            border: '1px solid rgba(194,84,80,0.25)',
          }}
        >
          <AlertTriangle size={13} style={{ color: '#C25450', flexShrink: 0 }} />
          <span style={{ fontSize: '12px', color: '#C25450' }}>
            Solde courant critique ({fmtPct(currentState.currentAccountBalance)})
          </span>
        </div>
      )}

      {/* ── Métriques monétaires ── */}
      <div
        className="px-4 py-3"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        <SectionLabel icon={BarChart3}>MÉTRIQUES MONÉTAIRES</SectionLabel>
        <div className="grid grid-cols-2 gap-1.5">
          <MetricTile
            label="Taux directeur"
            value={fmtPct(currentState.policyRate, 2)}
            color={rateColor(currentState.policyRate)}
          />
          <MetricTile
            label="TMP"
            value={fmtPct(currentState.interbankRate, 2)}
            color={rateColor(currentState.interbankRate)}
          />
          <MetricTile
            label="Taux débiteur"
            value={fmtPct(currentState.lendingRate, 2)}
            color={rateColor(currentState.lendingRate)}
          />
          <MetricTile
            label="Crédit"
            value={fmtPct(currentState.creditGrowth)}
            color={creditColor}
          />
          <MetricTile
            label="Solde courant"
            value={fmtPct(currentState.currentAccountBalance)}
            color={caColor}
          />
          <MetricTile
            label="Change (MAD/$)"
            value={currentState.exchangeRate.toFixed(1)}
          />
        </div>
      </div>

      {/* ── Chocs actifs ── */}
      <div
        className="px-4 py-3 flex flex-col gap-2"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center gap-1.5">
          <Zap size={11} style={{ color: 'var(--text-tertiary)' }} />
          <span className="label-caps" style={{ fontSize: '11px', letterSpacing: '0.08em' }}>
            CHOCS ACTIFS
          </span>
          {activeShocks.length > 0 && (
            <span
              className="inline-flex items-center justify-center w-5 h-5 rounded-full ml-auto"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 700,
              }}
            >
              {activeShocks.length}
            </span>
          )}
        </div>
        <ShockBannerList />
      </div>

      {/* ── Bouton historique ── */}
      <div
        className="px-4 py-3"
        style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 'auto' }}
      >
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="w-full py-2 rounded text-xs transition-colors duration-150 flex items-center justify-center gap-2"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-default)',
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--bg-hover)')}
          onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--bg-elevated)')}
        >
          <TableProperties size={12} />
          Historique ({history.length} trimestre{history.length > 1 ? 's' : ''})
        </button>
      </div>

      <HistoryDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  )
}
