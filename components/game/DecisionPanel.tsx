'use client'

import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useGameStore } from '@/store/gameStore'
import { Stepper } from '@/components/ui/Stepper'
import { TurnButton } from './TurnButton'
import { fmtPct, fmtBp } from '@/lib/format'
import { POLICY_RATE_BOUNDS, RESERVE_REQ_BOUNDS, MARKET_OPS_OPTIONS } from '@/lib/constants'
import { computeTaylorRate } from '@/engine/models/taylorRule'
import { simulateN } from '@/engine/simulator'

const RATE_CHANGE_OPTIONS = [
  { value: -100, label: '−100' },
  { value: -50,  label: '−50' },
  { value: -25,  label: '−25' },
  { value: 0,    label: '0' },
  { value: 25,   label: '+25' },
  { value: 50,   label: '+50' },
  { value: 100,  label: '+100' },
]

const RO_OPTIONS = [
  { value: -100, label: '−100' },
  { value: -50,  label: '−50' },
  { value: 0,    label: '0' },
  { value: 50,   label: '+50' },
  { value: 100,  label: '+100' },
]

const MARKET_OPS_LABELS: Record<number, string> = {
  [-20]: '−20 mds',
  [-10]: '−10 mds',
  [0]:   'Neutre',
  [10]:  '+10 mds',
  [20]:  '+20 mds',
}

function SectionDivider() {
  return <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '0 -1rem' }} />
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="label-caps" style={{ color: 'var(--text-tertiary)' }}>
      {children}
    </p>
  )
}

export function DecisionPanel() {
  const {
    currentState,
    pendingAction,
    activeShocks,
    seed,
    setPendingAction,
    isTransitioning,
  } = useGameStore(
    useShallow(s => ({
      currentState:     s.currentState,
      pendingAction:    s.pendingAction,
      activeShocks:     s.activeShocks,
      seed:             s.seed,
      setPendingAction: s.setPendingAction,
      isTransitioning:  s.isTransitioning,
    }))
  )

  const newPolicyRate = Math.max(
    POLICY_RATE_BOUNDS.min,
    currentState.policyRate + pendingAction.policyRateChangeBp / 100,
  )
  const newReserveReq = Math.max(
    0,
    currentState.reserveRequirement + pendingAction.reserveRequirementChangeBp / 100,
  )

  const taylor = useMemo(
    () => computeTaylorRate(currentState.inflation, currentState.outputGap),
    [currentState],
  )
  const preview = useMemo(
    () => simulateN(currentState, pendingAction, activeShocks, 4, seed + 50000),
    [currentState, pendingAction, activeShocks, seed],
  )

  const taylorDiff = newPolicyRate - taylor

  return (
    <div
      className="rounded-md overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-panel)',
        border: '1px solid var(--border-default)',
        opacity: isTransitioning ? 0.6 : 1,
        transition: 'opacity 0.3s ease-out',
      }}
      aria-live="polite"
    >
      {/* En-tête */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          background: 'linear-gradient(to right, rgba(180,25,35,0.06), transparent)',
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-1.5 h-1.5 rounded-full animate-pulse-soft"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          />
          <span className="label-caps" style={{ color: 'var(--accent-primary)', letterSpacing: '0.1em' }}>
            Décision — T{currentState.quarter + 2}
          </span>
        </div>
        <span className="label-caps" style={{ color: 'var(--text-tertiary)' }}>
          en bp
        </span>
      </div>

      <div className="px-4 py-4 flex flex-col gap-5">

        {/* ── Taux directeur ── */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <SectionLabel>Taux directeur</SectionLabel>
            <div className="text-right">
              <span
                className="font-editorial tabular block"
                style={{ fontSize: '1.5rem', color: 'var(--text-primary)', lineHeight: 1 }}
              >
                {fmtPct(newPolicyRate, 2)}
              </span>
              {pendingAction.policyRateChangeBp !== 0 && (
                <span
                  className="label-caps"
                  style={{
                    color: pendingAction.policyRateChangeBp > 0
                      ? 'var(--data-negative)'
                      : 'var(--data-positive)',
                  }}
                >
                  {fmtBp(pendingAction.policyRateChangeBp)}
                </span>
              )}
            </div>
          </div>

          <Stepper
            value={pendingAction.policyRateChangeBp}
            options={RATE_CHANGE_OPTIONS}
            onChange={v => setPendingAction({ policyRateChangeBp: v })}
            label="Variation du taux directeur en bp"
          />

          {/* Taylor benchmark */}
          <div
            className="flex items-center justify-between px-2.5 py-1.5 rounded"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderLeft: `2px solid ${
                Math.abs(taylorDiff) > 1 ? 'var(--data-warning)'
                : Math.abs(taylorDiff) >= 0.1 ? 'var(--border-strong)'
                : 'var(--data-positive)'
              }`,
            }}
          >
            <span className="label-caps">Règle de Taylor</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs tabular" style={{ color: 'var(--text-secondary)' }}>
                {fmtPct(taylor, 2)}
              </span>
              {Math.abs(taylorDiff) >= 0.1 && (
                <span
                  className="label-caps"
                  style={{ color: Math.abs(taylorDiff) > 1 ? 'var(--data-warning)' : 'var(--text-tertiary)' }}
                >
                  {taylorDiff > 0 ? '+' : ''}{(taylorDiff * 100).toFixed(0)} bp
                </span>
              )}
            </div>
          </div>
        </div>

        <SectionDivider />

        {/* ── Réserve obligatoire ── */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <SectionLabel>Réserve obligatoire</SectionLabel>
            <span className="font-mono text-sm tabular" style={{ color: 'var(--text-primary)' }}>
              {fmtPct(currentState.reserveRequirement, 1)}
              {pendingAction.reserveRequirementChangeBp !== 0 && (
                <span style={{ color: 'var(--text-tertiary)' }}>
                  {' → '}{fmtPct(newReserveReq, 1)}
                </span>
              )}
            </span>
          </div>
          <Stepper
            value={pendingAction.reserveRequirementChangeBp}
            options={RO_OPTIONS}
            onChange={v => setPendingAction({ reserveRequirementChangeBp: v })}
            label="Variation du taux de réserve obligatoire en bp"
          />
        </div>

        <SectionDivider />

        {/* ── Opérations de marché ── */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <SectionLabel>Opérations de marché</SectionLabel>
            <span className="label-caps" style={{ color: 'var(--text-tertiary)' }}>
              mds MAD
            </span>
          </div>
          <Stepper
            value={pendingAction.marketOperationsBnMad}
            options={MARKET_OPS_OPTIONS.map(v => ({
              value: v,
              label: MARKET_OPS_LABELS[v] ?? String(v),
            }))}
            onChange={v => setPendingAction({ marketOperationsBnMad: v })}
            label="Opérations de marché en milliards MAD"
          />
        </div>

        <SectionDivider />

        {/* ── Projection ── */}
        <div
          className="rounded flex flex-col gap-2 overflow-hidden"
          style={{
            border: '1px solid var(--border-subtle)',
            background: 'linear-gradient(135deg, var(--bg-elevated) 0%, var(--bg-panel) 100%)',
          }}
        >
          <div
            className="px-3 py-2 flex items-center justify-between"
            style={{ borderBottom: '1px solid var(--border-subtle)' }}
          >
            <p className="label-caps">Projection +4 trimestres</p>
            <span className="label-caps" style={{ color: 'var(--text-tertiary)', fontSize: '9px' }}>indicatif</span>
          </div>
          <div className="px-3 pb-2.5 grid grid-cols-2 gap-y-2">
            {[
              { label: 'Inflation',    value: fmtPct(preview.inflation),   color: Math.abs(preview.inflation - 2) < 0.5 ? 'var(--data-positive)' : 'var(--data-warning)' },
              { label: 'Output gap',  value: fmtPct(preview.outputGap),   color: 'var(--text-primary)' },
              { label: 'Taux débit.', value: fmtPct(preview.lendingRate), color: 'var(--text-primary)' },
            ].map(row => (
              <>
                <span key={`${row.label}-l`} className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{row.label}</span>
                <span key={`${row.label}-v`} className="text-xs font-mono tabular text-right" style={{ color: row.color }}>{row.value}</span>
              </>
            ))}
          </div>
        </div>

        {/* ── Bouton ── */}
        <TurnButton />

      </div>
    </div>
  )
}
