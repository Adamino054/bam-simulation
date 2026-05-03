'use client'

import { useMemo } from 'react'
import { useGameStore } from '@/store/gameStore'
import { Stepper } from '@/components/ui/Stepper'
import { TurnButton } from './TurnButton'
import { fmtPct, fmtBp } from '@/lib/format'
import { POLICY_RATE_BOUNDS, RESERVE_REQ_BOUNDS, MARKET_OPS_OPTIONS } from '@/lib/constants'

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
    setPendingAction,
    benchmarkRate,
    previewOutcome,
    isTransitioning,
  } = useGameStore(s => ({
    currentState:     s.currentState,
    pendingAction:    s.pendingAction,
    setPendingAction: s.setPendingAction,
    benchmarkRate:    s.benchmarkRate,
    previewOutcome:   s.previewOutcome,
    isTransitioning:  s.isTransitioning,
  }))

  const newPolicyRate = Math.max(
    POLICY_RATE_BOUNDS.min,
    currentState.policyRate + pendingAction.policyRateChangeBp / 100,
  )
  const newReserveReq = Math.max(
    0,
    currentState.reserveRequirement + pendingAction.reserveRequirementChangeBp / 100,
  )

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const taylor  = useMemo(() => benchmarkRate(), [benchmarkRate])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const preview = useMemo(() => previewOutcome(4), [previewOutcome])

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
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <span className="label-caps" style={{ color: 'var(--accent-primary)', letterSpacing: '0.1em' }}>
          Décision — T{currentState.quarter + 2}
        </span>
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
            style={{ backgroundColor: 'var(--bg-elevated)' }}
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
          className="rounded px-3 py-2.5 flex flex-col gap-2"
          style={{ backgroundColor: 'var(--bg-elevated)' }}
        >
          <p className="label-caps">Projection à +4 trimestres</p>
          <div className="grid grid-cols-2 gap-y-1.5">
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Inflation</span>
            <span className="text-xs font-mono tabular text-right" style={{ color: 'var(--text-primary)' }}>
              {fmtPct(preview.inflation)}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Output gap</span>
            <span className="text-xs font-mono tabular text-right" style={{ color: 'var(--text-primary)' }}>
              {fmtPct(preview.outputGap)}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Taux débiteur</span>
            <span className="text-xs font-mono tabular text-right" style={{ color: 'var(--text-primary)' }}>
              {fmtPct(preview.lendingRate)}
            </span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)', fontSize: '10px' }}>
            Hors nouveaux chocs. À titre indicatif.
          </p>
        </div>

        {/* ── Bouton ── */}
        <TurnButton />

      </div>
    </div>
  )
}
