'use client'

import { useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { ShockBannerList } from './ShockBannerList'
import { HistoryDrawer } from './HistoryDrawer'
import { fmtPct, fmtQuarter } from '@/lib/format'

export function LeftPanel() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { currentState, history, activeShocks } = useGameStore(s => ({
    currentState: s.currentState,
    history: s.history,
    activeShocks: s.activeShocks,
  }))

  // Génère un narratif court basé sur l'état courant
  function generateNarrative(): string {
    const parts: string[] = []
    const { inflation, outputGap, externalDemand, gdpGrowth } = currentState

    if (inflation > 3.5) {
      parts.push(`L'inflation s'établit à ${fmtPct(inflation)}, nettement au-dessus de la cible. Des mesures restrictives sont à envisager.`)
    } else if (inflation < 1.0) {
      parts.push(`L'inflation est tombée à ${fmtPct(inflation)}, en deçà de la cible, avec un risque de déflation.`)
    } else {
      parts.push(`L'inflation s'établit à ${fmtPct(inflation)}${Math.abs(inflation - 2) < 0.3 ? ', proche de la cible' : ''}.`)
    }

    if (outputGap < -1.5) {
      parts.push('L\'activité économique est en deçà de son potentiel.')
    } else if (outputGap > 1.5) {
      parts.push('L\'économie est en surchauffe : la demande dépasse l\'offre.')
    } else {
      parts.push('L\'économie opère proche de son potentiel.')
    }

    if (externalDemand < -0.5) {
      parts.push('La demande extérieure se contracte, pesant sur les exportations.')
    }

    return parts.join(' ')
  }

  return (
    <div
      className="flex flex-col gap-4 rounded p-4 h-full"
      style={{
        backgroundColor: 'var(--bg-panel)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      {/* Indicateur de trimestre */}
      <div>
        <p className="label-caps mb-1">
          {fmtQuarter(currentState.date.year, currentState.date.q)}
        </p>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {generateNarrative()}
        </p>
      </div>

      <div style={{ borderTop: '1px solid var(--border-subtle)' }} />

      {/* Chocs actifs */}
      <div>
        <p className="label-caps mb-2">
          Chocs actifs
          {activeShocks.length > 0 && (
            <span className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full text-xs"
              style={{ backgroundColor: 'var(--accent-primary)', color: '#fff', fontSize: '10px' }}>
              {activeShocks.length}
            </span>
          )}
        </p>
        <ShockBannerList />
      </div>

      {/* Bouton historique */}
      <div className="mt-auto">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="w-full py-2 px-3 rounded text-xs transition-colors duration-200"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-default)',
          }}
          onMouseEnter={e => {
            ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--bg-hover)'
          }}
          onMouseLeave={e => {
            ;(e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--bg-elevated)'
          }}
        >
          Voir l'historique ({history.length} trim.)
        </button>
      </div>

      <HistoryDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  )
}
