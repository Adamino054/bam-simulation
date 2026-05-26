'use client'

import { useMemo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingDown, Minus, TrendingUp, ChevronDown } from 'lucide-react'
import { useGameStore } from '@/store/gameStore'
import { Stepper } from '@/components/ui/Stepper'
import { TurnButton } from './TurnButton'
import { fmtPct, fmtBp } from '@/lib/format'
import { POLICY_RATE_BOUNDS, FX_INTERVENTION_OPTIONS, EMERGENCY_LENDING_OPTIONS, MARKET_OPS_OPTIONS, CCYB_OPTIONS } from '@/lib/constants'
import { computeTaylorRate } from '@/engine/models/taylorRule'
import { simulateN } from '@/engine/simulator'
import type { CommunicationStance } from '@/engine/state'
import { isInstrumentVisible, getLevelConfig } from '@/engine/difficulty'
import { BotHelpPopover } from './BotHelpPopover'
import { generateInflationFanChart } from '@/engine/monteCarlo'
import { FanChartModal } from './FanChartModal'

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

const FX_LABELS: Record<number, string> = {
  [-10]: '−10 mds',
  [0]:   'Neutre',
  [10]:  '+10 mds',
  [20]:  '+20 mds',
  [30]:  '+30 mds',
}

const EMERGENCY_LABELS: Record<number, string> = {
  [0]:  'Inactif',
  [5]:  '5 mds',
  [10]: '10 mds',
  [20]: '20 mds',
}

const CCYB_LABELS: Record<number, string> = {
  [0]:   'Désactivé',
  [0.5]: '0,5 %',
  [1.0]: '1,0 %',
  [1.5]: '1,5 %',
  [2.0]: '2,0 %',
  [2.5]: '2,5 %',
}

const GUIDANCE_OPTIONS: { value: CommunicationStance; label: string; sublabel: string; icon: typeof TrendingDown; tint: string }[] = [
  { value: 'dovish',  label: 'Accommodant', sublabel: 'Signal accommodant', icon: TrendingDown, tint: 'rgba(74, 157, 124, 0.15)' },
  { value: 'neutral', label: 'Neutre',      sublabel: 'Neutre',             icon: Minus,        tint: 'transparent' },
  { value: 'hawkish', label: 'Restrictif',  sublabel: 'Ancre les anticipations', icon: TrendingUp, tint: 'rgba(194, 84, 80, 0.15)' },
]

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

function AccordionSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 transition-colors"
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          background: 'linear-gradient(to right, rgba(180,25,35,0.04), transparent)',
        }}
      >
        <span className="label-caps" style={{ color: 'var(--accent-primary)', letterSpacing: '0.08em', fontSize: '11px' }}>
          {title}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 0 : -90 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={12} style={{ color: 'var(--text-tertiary)' }} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-4 py-4 flex flex-col gap-5">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function DecisionPanel() {
  const [isFanChartOpen, setIsFanChartOpen] = useState(false)

  const {
    currentState,
    pendingAction,
    activeShocks,
    seed,
    scenario,
    setPendingAction,
    isTransitioning,
    difficultyLevel,
    history,
  } = useGameStore(
    useShallow(s => ({
      currentState:     s.currentState,
      pendingAction:    s.pendingAction,
      activeShocks:     s.activeShocks,
      seed:             s.seed,
      scenario:         s.scenario,
      setPendingAction: s.setPendingAction,
      isTransitioning:  s.isTransitioning,
      difficultyLevel:  s.difficultyLevel,
      history:          s.history,
    }))
  )

  const newPolicyRate = Math.max(
    POLICY_RATE_BOUNDS.min,
    currentState.policyRate + pendingAction.policyRateChangeBp / 100,
  )

  const levelConfig = getLevelConfig(difficultyLevel)
  const showTaylorHint = levelConfig.showTaylorHint

  const taylor = useMemo(
    () => computeTaylorRate(currentState.inflation, currentState.outputGap),
    [currentState],
  )
  const preview = useMemo(
    () => simulateN(currentState, pendingAction, activeShocks, 4, seed + 50000, scenario ?? undefined),
    [currentState, pendingAction, activeShocks, seed, scenario],
  )

  const fanChartData = useMemo(() => {
    return generateInflationFanChart(
      currentState,
      history,
      pendingAction,
      activeShocks,
      seed,
      scenario ?? undefined
    )
  }, [currentState, history, pendingAction, activeShocks, seed, scenario])

  const taylorDiff = newPolicyRate - taylor
  const taylorAlignment = Math.max(0, Math.min(100, 100 - Math.abs(taylorDiff) * 40))

  // Emergency lending availability check
  const hasFinancialShock = activeShocks.some(s => s.type === 'financial')
  const emergencyAvailable = currentState.liquidityNeed > 100 || hasFinancialShock

  // Projection items with color coding
  const projectionItems = [
    {
      label: 'Inflation',
      value: fmtPct(preview.inflation),
      color: Math.abs(preview.inflation - 2) < 0.5 ? 'var(--data-positive)' : Math.abs(preview.inflation - 2) < 1.5 ? 'var(--data-warning)' : 'var(--data-negative)',
    },
    {
      label: 'Output gap',
      value: fmtPct(preview.outputGap),
      color: Math.abs(preview.outputGap) < 0.5 ? 'var(--data-positive)' : Math.abs(preview.outputGap) < 1.5 ? 'var(--data-warning)' : 'var(--data-negative)',
    },
    {
      label: 'Taux débit.',
      value: fmtPct(preview.lendingRate),
      color: 'var(--text-primary)',
    },
    {
      label: 'Chômage',
      value: fmtPct(preview.unemployment),
      color: preview.unemployment > 12 ? 'var(--data-negative)' : preview.unemployment > 10 ? 'var(--data-warning)' : 'var(--data-positive)',
    },
    {
      label: 'Crédibilité',
      value: `${Math.round(preview.centralBankCredibility)}`,
      color: preview.centralBankCredibility > 70 ? 'var(--data-positive)' : preview.centralBankCredibility > 40 ? 'var(--data-warning)' : 'var(--data-negative)',
    },
    {
      label: 'Solde courant',
      value: fmtPct(preview.currentAccountBalance),
      color: preview.currentAccountBalance > -4 ? 'var(--data-positive)' : preview.currentAccountBalance > -6 ? 'var(--data-warning)' : 'var(--data-negative)',
    },
  ]

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
          {levelConfig.visibleInstruments.length} instrument{levelConfig.visibleInstruments.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Assistant CBS Pop-it de Décision */}
      <div 
        className="p-3 bg-black/10 border-b border-[var(--border-subtle)]"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.01) 0%, transparent 100%)'
        }}
      >
        <BotHelpPopover />
      </div>

      {/* ══ Section 1: Taux & Liquidité ══ */}
      <AccordionSection title="TAUX & LIQUIDITÉ">
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
          {showTaylorHint && (
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
          )}
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
                  {' → '}{fmtPct(Math.max(0, currentState.reserveRequirement + pendingAction.reserveRequirementChangeBp / 100), 1)}
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

        {/* ── Emergency Lending Facility ── */}
        {isInstrumentVisible('emergencyLendingBnMad', difficultyLevel) && (
          <>
            <SectionDivider />
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <SectionLabel>Facilité de prêt d&apos;urgence</SectionLabel>
                <span className="label-caps" style={{ color: 'var(--text-tertiary)' }}>
                  mds MAD
                </span>
              </div>
              {emergencyAvailable ? (
                <Stepper
                  value={pendingAction.emergencyLendingBnMad}
                  options={EMERGENCY_LENDING_OPTIONS.map(v => ({
                    value: v,
                    label: EMERGENCY_LABELS[v] ?? String(v),
                  }))}
                  onChange={v => setPendingAction({ emergencyLendingBnMad: v })}
                  label="Facilité de prêt d'urgence en milliards MAD"
                />
              ) : (
                <div
                  className="px-2.5 py-2 rounded text-xs"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    color: 'var(--text-tertiary)',
                    border: '1px solid var(--border-subtle)',
                  }}
                  title="Aucune tension de liquidité détectée"
                >
                  Aucune tension de liquidité détectée
                </div>
              )}
            </div>
          </>
        )}
      </AccordionSection>

      {/* ══ Section 2: Communication & Change ══ */}
      {(isInstrumentVisible('communicationStance', difficultyLevel) || isInstrumentVisible('fxInterventionBnMad', difficultyLevel)) && (
        <AccordionSection title="COMMUNICATION & CHANGE">
          {/* ── Forward Guidance ── */}
          {isInstrumentVisible('communicationStance', difficultyLevel) && (
            <div className="flex flex-col gap-3">
              <SectionLabel>Forward guidance</SectionLabel>
              <div
                className="flex gap-[2px] p-[3px] rounded-md"
                role="group"
                aria-label="Forward guidance"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {GUIDANCE_OPTIONS.map(opt => {
                  const isActive = pendingAction.communicationStance === opt.value
                  const Icon = opt.icon
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => setPendingAction({ communicationStance: opt.value })}
                      className="flex-1 flex flex-col items-center gap-1 rounded py-2 px-1 transition-all duration-100"
                      style={{
                        backgroundColor: isActive ? opt.tint : 'transparent',
                        border: isActive ? '1px solid var(--border-strong)' : '1px solid transparent',
                        cursor: 'pointer',
                      }}
                    >
                      <Icon
                        size={14}
                        style={{
                          color: isActive
                            ? opt.value === 'dovish' ? 'var(--data-positive)'
                              : opt.value === 'hawkish' ? 'var(--data-negative)'
                              : 'var(--text-secondary)'
                            : 'var(--text-tertiary)',
                        }}
                      />
                      <span
                        className="text-[11px] font-semibold uppercase tracking-wider"
                        style={{
                          color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                        }}
                      >
                        {opt.label}
                      </span>
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-center" style={{ color: 'var(--text-secondary)' }}>
                {GUIDANCE_OPTIONS.find(o => o.value === pendingAction.communicationStance)?.sublabel}
              </p>
            </div>
          )}

          {isInstrumentVisible('communicationStance', difficultyLevel) && isInstrumentVisible('fxInterventionBnMad', difficultyLevel) && (
            <SectionDivider />
          )}

          {/* ── FX Intervention ── */}
          {isInstrumentVisible('fxInterventionBnMad', difficultyLevel) && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <SectionLabel>Intervention change</SectionLabel>
                <span className="label-caps" style={{ color: 'var(--text-tertiary)' }}>
                  mds MAD
                </span>
              </div>
              <Stepper
                value={pendingAction.fxInterventionBnMad}
                options={FX_INTERVENTION_OPTIONS.map(v => ({
                  value: v,
                  label: FX_LABELS[v] ?? String(v),
                }))}
                onChange={v => setPendingAction({ fxInterventionBnMad: v })}
                label="Intervention sur le marché des changes en milliards MAD"
              />
            </div>
          )}
        </AccordionSection>
      )}

      {/* ══ Section 3: Macroprudentiel ══ */}
      {isInstrumentVisible('ccybRate', difficultyLevel) && (
        <AccordionSection title="MACROPRUDENTIEL">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <SectionLabel>Coussin en capital (CCyB)</SectionLabel>
              <span className="label-caps" style={{ color: 'var(--text-tertiary)' }}>
                % RWA
              </span>
            </div>
            <Stepper
              value={pendingAction.ccybRate ?? 0}
              options={CCYB_OPTIONS.map(v => ({
                value: v,
                label: CCYB_LABELS[v] ?? String(v),
              }))}
              onChange={v => setPendingAction({ ccybRate: v })}
              label="Coussin de fonds propres contracyclique"
              compact
            />
          </div>
        </AccordionSection>
      )}

      {/* ══ Projections & Actions ══ */}
      <div className="px-4 py-4 flex flex-col gap-4">
        {/* Confiance Taylor meter */}
        {showTaylorHint && (
          <>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="label-caps">Confiance Taylor</span>
                <span className="font-mono text-xs tabular" style={{
                  color: taylorAlignment > 70 ? 'var(--data-positive)' : taylorAlignment > 40 ? 'var(--data-warning)' : 'var(--data-negative)',
                }}>
                  {Math.round(taylorAlignment)} %
                </span>
              </div>
              <div className="h-1 rounded-full" style={{ backgroundColor: 'var(--bg-hover)' }}>
                <div
                  className="h-1 rounded-full transition-all duration-300"
                  style={{
                    width: `${taylorAlignment}%`,
                    backgroundColor: taylorAlignment > 70 ? 'var(--data-positive)' : taylorAlignment > 40 ? 'var(--data-warning)' : 'var(--data-negative)',
                  }}
                />
              </div>
            </div>

            <SectionDivider />
          </>
        )}

        {/* ── 6-variable projection ── */}
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
            <span className="label-caps" style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>indicatif</span>
          </div>
          <div className="px-3 pb-2.5 grid grid-cols-2 gap-y-2 gap-x-4">
            {projectionItems.map(row => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{row.label}</span>
                <span className="text-xs font-mono tabular" style={{ color: row.color }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsFanChartOpen(true)}
          className="w-full py-2 px-3 rounded flex items-center justify-center gap-2 text-xs font-semibold tracking-wider transition-all"
          style={{
            background: 'linear-gradient(to right, rgba(180, 25, 35, 0.12), rgba(180, 25, 35, 0.04))',
            border: '1px solid rgba(180, 25, 35, 0.25)',
            color: 'var(--accent-primary)',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(to right, rgba(180, 25, 35, 0.2), rgba(180, 25, 35, 0.08))'
            e.currentTarget.style.borderColor = 'var(--accent-primary)'
            e.currentTarget.style.boxShadow = '0 0 8px rgba(180, 25, 35, 0.15)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(to right, rgba(180, 25, 35, 0.12), rgba(180, 25, 35, 0.04))'
            e.currentTarget.style.borderColor = 'rgba(180, 25, 35, 0.25)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <TrendingUp size={14} className="animate-pulse-soft" />
          Prévisions Monte-Carlo
        </button>

        {/* ── Bouton ── */}
        <TurnButton />

        <FanChartModal
          isOpen={isFanChartOpen}
          onClose={() => setIsFanChartOpen(false)}
          data={fanChartData}
        />
      </div>
    </div>
  )
}
