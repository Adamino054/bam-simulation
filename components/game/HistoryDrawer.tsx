'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useGameStore } from '@/store/gameStore'
import { fmtBnMad, fmtBp, fmtPct, fmtQuarter } from '@/lib/format'
import type { PolicyAction } from '@/engine/state'

interface HistoryDrawerProps {
  open: boolean
  onClose: () => void
}

const GUIDANCE_LABELS: Record<PolicyAction['communicationStance'], string> = {
  dovish: 'Accommodant',
  neutral: 'Neutre',
  hawkish: 'Restrictif',
}

function formatChoice(value: number, neutral: string, formatter: (v: number) => string) {
  return value === 0 ? neutral : formatter(value)
}

function Choice({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className="rounded px-2 py-1.5"
      style={{
        backgroundColor: highlight ? 'rgba(180, 25, 35, 0.08)' : 'var(--bg-panel)',
        border: `1px solid ${highlight ? 'rgba(180, 25, 35, 0.22)' : 'var(--border-subtle)'}`,
      }}
    >
      <span className="label-caps block mb-0.5" style={{ color: 'var(--text-tertiary)', fontSize: '8px' }}>
        {label}
      </span>
      <span
        className="font-mono tabular"
        style={{
          color: highlight ? 'var(--accent-primary)' : 'var(--text-secondary)',
          fontSize: '11px',
        }}
      >
        {value}
      </span>
    </div>
  )
}

export function HistoryDrawer({ open, onClose }: HistoryDrawerProps) {
  const history = useGameStore(s => s.history)
  const actionHistory = useGameStore(s => s.actionHistory ?? [])

  const rows = history.map((state, index) => ({
    state,
    action: actionHistory[index],
  }))

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <div
        className="fixed top-0 left-0 bottom-0 z-40 flex flex-col overflow-hidden transition-transform duration-300"
        style={{
          width: '380px',
          backgroundColor: 'var(--bg-panel)',
          borderRight: '1px solid var(--border-default)',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
        }}
        role="dialog"
        aria-label="Historique des choix"
        aria-modal={open}
      >
        <div
          className="flex items-center justify-between p-4"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div className="flex flex-col gap-0.5">
            <span className="label-caps" style={{ color: 'var(--text-secondary)' }}>
              Historique
            </span>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Decisions prises par le joueur
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer l'historique"
            className="p-1 rounded"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {history.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Aucun trimestre passe.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {[...rows].reverse().map(({ state, action }, i) => (
                <div
                  key={state.quarter}
                  className="rounded-md p-3"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    opacity: i === 0 ? 1 : Math.max(0.55, 0.82 - i * 0.03),
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {fmtQuarter(state.date.year, state.date.q)}
                    </span>
                    <span className="label-caps" style={{ color: 'var(--text-tertiary)', fontSize: '9px' }}>
                      Choix du joueur
                    </span>
                  </div>

                  {action ? (
                    <div className="grid grid-cols-2 gap-2">
                      <Choice
                        label="Taux directeur"
                        value={fmtBp(action.policyRateChangeBp)}
                        highlight={action.policyRateChangeBp !== 0}
                      />
                      <Choice
                        label="Reserve oblig."
                        value={fmtBp(action.reserveRequirementChangeBp)}
                        highlight={action.reserveRequirementChangeBp !== 0}
                      />
                      <Choice
                        label="Operations marche"
                        value={formatChoice(action.marketOperationsBnMad, 'Neutre', fmtBnMad)}
                        highlight={action.marketOperationsBnMad !== 0}
                      />
                      <Choice
                        label="Guidance"
                        value={GUIDANCE_LABELS[action.communicationStance]}
                        highlight={action.communicationStance !== 'neutral'}
                      />
                      <Choice
                        label="Intervention FX"
                        value={formatChoice(action.fxInterventionBnMad, 'Neutre', fmtBnMad)}
                        highlight={action.fxInterventionBnMad !== 0}
                      />
                      <Choice
                        label="Emergency lending"
                        value={formatChoice(action.emergencyLendingBnMad, 'Inactif', fmtBnMad)}
                        highlight={action.emergencyLendingBnMad !== 0}
                      />
                      <Choice
                        label="CCyB"
                        value={fmtPct(action.ccybRate, 1)}
                        highlight={action.ccybRate !== 0}
                      />
                    </div>
                  ) : (
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      Decision non disponible pour cet ancien trimestre sauvegarde.
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
