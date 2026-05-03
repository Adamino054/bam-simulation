'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useGameStore } from '@/store/gameStore'
import { fmtPct, fmtQuarter } from '@/lib/format'

interface HistoryDrawerProps {
  open: boolean
  onClose: () => void
}

export function HistoryDrawer({ open, onClose }: HistoryDrawerProps) {
  const history = useGameStore(s => s.history)

  // Fermer sur Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className="fixed top-0 left-0 bottom-0 z-40 flex flex-col overflow-hidden transition-transform duration-300"
        style={{
          width: '360px',
          backgroundColor: 'var(--bg-panel)',
          borderRight: '1px solid var(--border-default)',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
        }}
        role="dialog"
        aria-label="Historique des trimestres"
        aria-modal={open}
      >
        {/* En-tête */}
        <div
          className="flex items-center justify-between p-4"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <span className="label-caps" style={{ color: 'var(--text-secondary)' }}>
            Historique
          </span>
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

        {/* Table */}
        <div className="flex-1 overflow-y-auto p-3">
          {history.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Aucun trimestre passé.
            </p>
          ) : (
            <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Trimestre', 'Inflation', 'PIB', 'Chômage', 'Taux dir.'].map(h => (
                    <th
                      key={h}
                      className="text-left pb-2 label-caps"
                      style={{ borderBottom: '1px solid var(--border-subtle)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...history].reverse().map((s, i) => (
                  <tr
                    key={s.quarter}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      opacity: i === 0 ? 1 : 0.75 - i * 0.02,
                    }}
                  >
                    <td className="py-2" style={{ color: 'var(--text-tertiary)' }}>
                      {fmtQuarter(s.date.year, s.date.q)}
                    </td>
                    <td className="py-2 tabular" style={{
                      color: Math.abs(s.inflation - 2) < 0.5 ? 'var(--data-positive)' : 'var(--data-warning)',
                    }}>
                      {fmtPct(s.inflation)}
                    </td>
                    <td className="py-2 tabular" style={{
                      color: s.gdpGrowth > 0 ? 'var(--data-positive)' : 'var(--data-negative)',
                    }}>
                      {fmtPct(s.gdpGrowth)}
                    </td>
                    <td className="py-2 tabular" style={{ color: 'var(--text-secondary)' }}>
                      {fmtPct(s.unemployment)}
                    </td>
                    <td className="py-2 tabular" style={{ color: 'var(--text-secondary)' }}>
                      {fmtPct(s.policyRate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}
