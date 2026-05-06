'use client'

import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { ShockBannerList } from './ShockBannerList'
import { HistoryDrawer } from './HistoryDrawer'
import { fmtPct, fmtQuarter } from '@/lib/format'

function generateNarrative(state: {
  inflation: number
  outputGap: number
  externalDemand: number
  gdpGrowth: number
  unemployment: number
}): string {
  const { inflation, outputGap, externalDemand, gdpGrowth } = state
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

  return parts.join(' ')
}

export function LeftPanel() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const currentState = useGameStore(s => s.currentState)
  const history = useGameStore(s => s.history)
  const activeShocks = useGameStore(s => s.activeShocks)

  const narrative = generateNarrative(currentState)

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

      {/* Narratif */}
      <div className="px-4 py-3">
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {narrative}
        </p>
      </div>

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
          className="w-full py-2 rounded text-xs transition-colors duration-150"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-default)',
          }}
          onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--bg-hover)')}
          onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--bg-elevated)')}
        >
          Historique ({history.length} trimestre{history.length > 1 ? 's' : ''})
        </button>
      </div>

      <HistoryDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  )
}
