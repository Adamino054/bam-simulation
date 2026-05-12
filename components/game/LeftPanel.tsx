'use client'

import { useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { TableProperties, AlertTriangle } from 'lucide-react'
import { useGameStore } from '@/store/gameStore'
import { ShockBannerList } from './ShockBannerList'
import { HistoryDrawer } from './HistoryDrawer'
import { fmtPct, fmtQuarter } from '@/lib/format'
import type { FiscalStance } from '@/engine/state'

const FISCAL_LABELS: Record<FiscalStance, { label: string; color: string; bg: string }> = {
  expansionary:    { label: 'Expansionniste',   color: '#4A9D7C', bg: 'rgba(74, 157, 124, 0.15)' },
  neutral:         { label: 'Neutre',           color: '#9A9B9B', bg: 'rgba(154, 155, 155, 0.15)' },
  contractionary:  { label: 'Restrictive',      color: '#C25450', bg: 'rgba(194, 84, 80, 0.15)' },
}

function generateNarrative(state: {
  inflation: number
  outputGap: number
  externalDemand: number
  gdpGrowth: number
  unemployment: number
  centralBankCredibility: number
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
    parts.push("La demande est en dessous du potentiel — l'économie sous-utilise ses capacités.")
  } else if (outputGap > 1.5) {
    parts.push("La demande dépasse le potentiel, source de pressions inflationnistes futures.")
  } else {
    parts.push("L'activité opère proche de son potentiel.")
  }

  if (externalDemand < -0.8) {
    parts.push("La demande extérieure se contracte, pesant sur les exportations.")
  } else if (gdpGrowth < 1) {
    parts.push("La croissance ralentit fortement.")
  }

  if (centralBankCredibility < 40) {
    parts.push("La crédibilité de BAM est fragilisée — les anticipations risquent de se désancrer.")
  }

  return parts.join(' ')
}

function getEconomicStateColor(state: { inflation: number; outputGap: number }): string {
  if (Math.abs(state.inflation - 2) > 3 || Math.abs(state.outputGap) > 3) return 'var(--data-negative)'
  if (Math.abs(state.inflation - 2) > 1.5 || Math.abs(state.outputGap) > 1.5) return 'var(--data-warning)'
  return 'var(--data-positive)'
}

export function LeftPanel() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { currentState, history, activeShocks } = useGameStore(
    useShallow(s => ({
      currentState: s.currentState,
      history:      s.history,
      activeShocks: s.activeShocks,
    }))
  )

  const narrative = generateNarrative(currentState)
  const fiscalMeta = FISCAL_LABELS[currentState.fiscalStance]
  const stateColor = getEconomicStateColor(currentState)

  const credColor =
    currentState.centralBankCredibility > 70 ? 'var(--data-positive)' :
    currentState.centralBankCredibility > 40 ? 'var(--data-warning)' :
    'var(--data-negative)'

  return (
    <div
      className="rounded-md overflow-hidden flex flex-col"
      style={{
        backgroundColor: 'var(--bg-panel)',
        border: '1px solid var(--border-default)',
      }}
    >
      {/* En-tête */}
      <div
        className="px-4 py-3"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <span
          className="font-mono text-xs font-medium"
          style={{ color: 'var(--accent-primary)' }}
        >
          {fmtQuarter(currentState.date.year, currentState.date.q)}
        </span>
      </div>

      {/* Bulletin de conjoncture */}
      <div className="px-4 py-3">
        {/* Fiscal stance badge */}
        <div className="flex items-center gap-2 mb-2">
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider"
            style={{
              backgroundColor: fiscalMeta.bg,
              color: fiscalMeta.color,
            }}
          >
            <span style={{
              width: '4px', height: '4px',
              borderRadius: '50%',
              backgroundColor: fiscalMeta.color,
              display: 'inline-block',
            }} />
            Budget {fiscalMeta.label}
          </span>
        </div>
        {/* Narrative card with accent left border */}
        <div
          className="rounded px-3 py-2.5"
          style={{
            borderLeft: `3px solid ${stateColor}`,
            backgroundColor: 'var(--bg-elevated)',
          }}
        >
          <p className="text-xs leading-relaxed italic" style={{ color: 'var(--text-secondary)' }}>
            {narrative}
          </p>
        </div>
      </div>

      {/* Credibility bar */}
      <div
        className="px-4 py-3 flex flex-col gap-1.5"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center justify-between">
          <span className="label-caps">Crédibilité BAM</span>
          <span className="font-mono text-xs tabular font-semibold" style={{ color: credColor }}>
            {Math.round(currentState.centralBankCredibility)}
          </span>
        </div>
        <div className="h-1.5 rounded-full" style={{ backgroundColor: 'var(--bg-hover)' }}>
          <div
            className="h-1.5 rounded-full transition-all duration-500"
            style={{
              width: `${currentState.centralBankCredibility}%`,
              background: `linear-gradient(to right, var(--data-negative), var(--data-warning), var(--data-positive))`,
            }}
          />
        </div>
      </div>

      {/* Current account warning */}
      {currentState.currentAccountBalance < -6 && (
        <div
          className="mx-4 mb-2 px-2.5 py-2 rounded flex items-center gap-2"
          style={{
            backgroundColor: 'rgba(194, 84, 80, 0.1)',
            border: '1px solid rgba(194, 84, 80, 0.25)',
          }}
        >
          <AlertTriangle size={12} style={{ color: 'var(--data-negative)', flexShrink: 0 }} />
          <span className="text-[10px]" style={{ color: 'var(--data-negative)' }}>
            Solde courant critique ({fmtPct(currentState.currentAccountBalance)})
          </span>
        </div>
      )}

      {/* Métriques secondaires */}
      <div
        className="px-4 py-3 grid grid-cols-2 gap-y-2 gap-x-4"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        {[
          { label: 'Taux directeur', value: fmtPct(currentState.policyRate, 2) },
          { label: 'TMP',            value: fmtPct(currentState.interbankRate, 2) },
          { label: 'Taux débiteur',  value: fmtPct(currentState.lendingRate, 2) },
          { label: 'Crédit',         value: fmtPct(currentState.creditGrowth) },
          { label: 'Solde courant',  value: fmtPct(currentState.currentAccountBalance) },
          { label: 'Change',         value: currentState.exchangeRate.toFixed(1) },
        ].map(item => (
          <div key={item.label}>
            <span className="label-caps block">{item.label}</span>
            <span className="font-mono text-xs tabular" style={{ color: 'var(--text-primary)' }}>
              {item.value}
            </span>
          </div>
        ))}
      </div>

      {/* Chocs actifs */}
      <div
        className="px-4 py-3 flex flex-col gap-2"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center gap-2">
          <span className="label-caps">Chocs actifs</span>
          {activeShocks.length > 0 && (
            <span
              className="inline-flex items-center justify-center w-4 h-4 rounded-full"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: '#fff',
                fontSize: '9px',
                fontWeight: 700,
              }}
            >
              {activeShocks.length}
            </span>
          )}
        </div>
        <ShockBannerList />
      </div>

      {/* Bouton historique */}
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
