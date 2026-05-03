'use client'

import { useMemo } from 'react'
import { useGameStore } from '@/store/gameStore'
import { Slider } from '@/components/ui/Slider'
import { Stepper } from '@/components/ui/Stepper'
import { TurnButton } from './TurnButton'
import { fmtPct, fmtBp } from '@/lib/format'
import {
  POLICY_RATE_BOUNDS,
  RESERVE_REQ_BOUNDS,
  MARKET_OPS_OPTIONS,
} from '@/lib/constants'

const BP_OPTIONS = [
  { value: -100, label: '−100' },
  { value: -75,  label: '−75' },
  { value: -50,  label: '−50' },
  { value: -25,  label: '−25' },
  { value: 0,    label: '0' },
  { value: 25,   label: '+25' },
  { value: 50,   label: '+50' },
  { value: 75,   label: '+75' },
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
  [-20]: 'Ponction 20 mds',
  [-10]: 'Ponction 10 mds',
  [0]:   'Aucune',
  [10]:  'Injection 10 mds',
  [20]:  'Injection 20 mds',
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
    currentState: s.currentState,
    pendingAction: s.pendingAction,
    setPendingAction: s.setPendingAction,
    benchmarkRate: s.benchmarkRate,
    previewOutcome: s.previewOutcome,
    isTransitioning: s.isTransitioning,
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
  const taylor = useMemo(() => benchmarkRate(), [benchmarkRate])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const preview = useMemo(() => previewOutcome(4), [previewOutcome])

  return (
    <div
      className="flex flex-col gap-4 rounded p-4 h-full"
      style={{
        backgroundColor: 'var(--bg-panel)',
        border: '1px solid var(--border-subtle)',
        opacity: isTransitioning ? 0.5 : 1,
        transition: 'opacity 0.3s ease-out',
      }}
      aria-live="polite"
    >
      {/* En-tête */}
      <div>
        <p className="label-caps" style={{ color: 'var(--accent-primary)' }}>
          Votre décision — T{currentState.quarter + 2}
        </p>
      </div>

      {/* ── Taux directeur ── */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="label-caps">Taux directeur</span>
          <span
            className="font-editorial text-xl tabular"
            style={{ color: 'var(--text-primary)' }}
          >
            {fmtPct(newPolicyRate, 2)}
          </span>
        </div>

        <Stepper
          value={pendingAction.policyRateChangeBp}
          options={BP_OPTIONS}
          onChange={v => setPendingAction({ policyRateChangeBp: v })}
          label="Variation du taux directeur en points de base"
        />

        <div className="flex items-center justify-between text-xs">
          <span style={{ color: 'var(--text-tertiary)' }}>
            Actuel : {fmtPct(currentState.policyRate, 2)}
            {pendingAction.policyRateChangeBp !== 0 && (
              <span style={{ color: pendingAction.policyRateChangeBp > 0 ? 'var(--data-negative)' : 'var(--data-positive)' }}>
                {' '}({fmtBp(pendingAction.policyRateChangeBp)})
              </span>
            )}
          </span>
          <span style={{ color: 'var(--text-tertiary)' }}>
            Taylor : {fmtPct(taylor, 2)}
          </span>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border-subtle)' }} />

      {/* ── Réserve obligatoire ── */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="label-caps">Réserve obligatoire</span>
          <span className="font-mono text-sm tabular" style={{ color: 'var(--text-primary)' }}>
            {fmtPct(currentState.reserveRequirement, 1)}
            {pendingAction.reserveRequirementChangeBp !== 0 && (
              <span style={{ color: 'var(--text-tertiary)' }}> → {fmtPct(newReserveReq, 1)}</span>
            )}
          </span>
        </div>
        <Stepper
          value={pendingAction.reserveRequirementChangeBp}
          options={RO_OPTIONS}
          onChange={v => setPendingAction({ reserveRequirementChangeBp: v })}
          label="Variation du taux de réserve obligatoire en points de base"
        />
      </div>

      <div style={{ borderTop: '1px solid var(--border-subtle)' }} />

      {/* ── Opérations de marché ── */}
      <div className="space-y-2">
        <span className="label-caps">Opérations de marché</span>
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

      <div style={{ borderTop: '1px solid var(--border-subtle)' }} />

      {/* ── Aperçu prévisionnel ── */}
      <div
        className="rounded p-3 space-y-1.5 text-xs"
        style={{ backgroundColor: 'var(--bg-elevated)' }}
      >
        <p className="label-caps">Projection à 4 trimestres</p>
        <div className="flex justify-between">
          <span style={{ color: 'var(--text-tertiary)' }}>Inflation estimée</span>
          <span className="font-mono tabular" style={{ color: 'var(--text-primary)' }}>
            {fmtPct(preview.inflation)}
          </span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: 'var(--text-tertiary)' }}>Output gap estimé</span>
          <span className="font-mono tabular" style={{ color: 'var(--text-primary)' }}>
            {fmtPct(preview.outputGap)}
          </span>
        </div>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)', marginTop: '4px' }}>
          Simulation hors nouveaux chocs. À titre indicatif.
        </p>
      </div>

      {/* ── Bouton ── */}
      <div className="mt-auto">
        <TurnButton />
      </div>
    </div>
  )
}
