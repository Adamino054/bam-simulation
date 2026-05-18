'use client'

import { useMemo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import {
  ComposedChart, Area, Line, Bar,
  XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip,
  ReferenceLine, ReferenceArea,
  ResponsiveContainer,
} from 'recharts'
import { useGameStore } from '@/store/gameStore'
import { TOTAL_QUARTERS, FREE_MODE_QUARTERS } from '@/lib/constants'
import { fmtQuarter } from '@/lib/format'
import type { EconomicState } from '@/engine/state'

// ── Types ──────────────────────────────────────────────────────────────────
interface ChartPoint {
  name: string
  quarter: number
  inflation?: number
  outputGap?: number
  policyRate?: number
  interbankRate?: number
  lendingRate?: number
  credibility?: number
  currentAccount?: number
  npl?: number
}

type ChartTab = 'activity' | 'rates' | 'financial'

// ── Data builder ───────────────────────────────────────────────────────────
function buildData(history: EconomicState[], current: EconomicState, maxQ: number): ChartPoint[] {
  const all = [...history, current]
  const points: ChartPoint[] = Array.from({ length: maxQ }, (_, i) => ({
    name: i % 4 === 0 ? `A${Math.floor(i / 4) + 1}` : '',
    quarter: i,
  }))
  all.forEach(s => {
    if (s.quarter < maxQ) {
      points[s.quarter] = {
        ...points[s.quarter],
        name: s.quarter % 4 === 0 ? fmtQuarter(s.date.year, s.date.q) : '',
        inflation:      s.inflation,
        outputGap:      s.outputGap,
        policyRate:     s.policyRate,
        interbankRate:  s.interbankRate,
        lendingRate:    s.lendingRate,
        credibility:    s.centralBankCredibility,
        currentAccount: s.currentAccountBalance,
        npl:            s.nplRatio ?? 7,
      }
    }
  })
  return points
}

// ── Tooltip ────────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const items = payload.filter(e => e.value !== undefined && e.value !== null)
  return (
    <div style={{
      backgroundColor: '#070809',
      border: '1px solid rgba(240,240,234,0.12)',
      borderRadius: '6px',
      padding: '10px 14px',
      fontFamily: '"Courier New", monospace',
      fontSize: '11px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
      minWidth: '150px',
    }}>
      {label && (
        <p style={{ color: '#5E6066', marginBottom: '7px', fontSize: '9px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {label}
        </p>
      )}
      {items.map(entry => (
        <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '7px', lineHeight: 1.9 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: entry.color, display: 'inline-block', flexShrink: 0 }} />
          <span style={{ color: '#9A9B9B', flex: 1, fontSize: '10px' }}>{entry.name}</span>
          <span style={{ color: '#F0F0EA', fontWeight: 700, marginLeft: '10px', tabularNums: 'tabular-nums' } as React.CSSProperties}>
            {typeof entry.value === 'number'
              ? entry.name === 'Crédibilité'
                ? `${Math.round(entry.value)}`
                : `${entry.value.toFixed(2).replace('.', ',')} %`
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Legend item ────────────────────────────────────────────────────────────
function LegendItem({ color, label, dashed = false, bar = false, band = false }: {
  color: string; label: string; dashed?: boolean; bar?: boolean; band?: boolean
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
      {band ? (
        <div style={{ width: 16, height: 8, backgroundColor: `${color}18`, border: `1px solid ${color}35`, borderRadius: 2 }} />
      ) : bar ? (
        <div style={{ width: 8, height: 10, backgroundColor: `${color}40`, border: `1px solid ${color}60`, borderRadius: 2 }} />
      ) : (
        <svg width="16" height="4" style={{ flexShrink: 0 }}>
          {dashed
            ? <line x1="0" y1="2" x2="16" y2="2" stroke={color} strokeWidth="1.5" strokeDasharray="3 2" />
            : <line x1="0" y1="2" x2="16" y2="2" stroke={color} strokeWidth="2" />}
        </svg>
      )}
      <span style={{ fontFamily: 'monospace', fontSize: '9px', color: '#5E6066' }}>{label}</span>
    </div>
  )
}

const AXIS = { fontSize: 8, fill: '#5E6066', fontFamily: 'monospace' }

// ── Main component ─────────────────────────────────────────────────────────
export function EconomyChart() {
  const { history, currentState, freeMode } = useGameStore(
    useShallow(s => ({
      history:      s.history,
      currentState: s.currentState,
      freeMode:     s.freeMode,
    }))
  )

  const [activeTab, setActiveTab] = useState<ChartTab>('activity')
  const maxQ = freeMode ? FREE_MODE_QUARTERS : TOTAL_QUARTERS
  const data = useMemo(() => buildData(history, currentState, maxQ), [history, currentState, maxQ])
  const currentQ = currentState.quarter

  const tabs: { key: ChartTab; label: string }[] = [
    { key: 'activity',  label: 'Activité' },
    { key: 'rates',     label: 'Taux' },
    { key: 'financial', label: 'Financier' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

      {/* SVG gradient defs (hidden) */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <linearGradient id="ecInflGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#B41923" stopOpacity={0.28} />
            <stop offset="95%" stopColor="#B41923" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="ecGapGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#5C7E92" stopOpacity={0.20} />
            <stop offset="95%" stopColor="#5C7E92" stopOpacity={0.01} />
          </linearGradient>
          <linearGradient id="ecRateGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#B41923" stopOpacity={0.22} />
            <stop offset="95%" stopColor="#B41923" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="ecCredGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#4A9D7C" stopOpacity={0.28} />
            <stop offset="95%" stopColor="#4A9D7C" stopOpacity={0.02} />
          </linearGradient>
        </defs>
      </svg>

      {/* Tab switcher */}
      <div style={{
        display: 'flex', gap: '2px', padding: '3px',
        backgroundColor: 'var(--bg-base)', borderRadius: '7px',
        marginBottom: '14px', border: '1px solid var(--border-subtle)',
      }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1, padding: '5px 4px', borderRadius: '5px', border: 'none', cursor: 'pointer',
              fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 700,
              backgroundColor: activeTab === tab.key ? 'var(--bg-elevated)' : 'transparent',
              color: activeTab === tab.key ? 'var(--text-primary)' : 'var(--text-tertiary)',
              transition: 'all 0.15s ease',
              boxShadow: activeTab === tab.key ? '0 1px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)' : 'none',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB : Activité ── */}
      {activeTab === 'activity' && (
        <div>
          <ResponsiveContainer width="100%" height={230}>
            <ComposedChart data={data} margin={{ top: 6, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="rgba(240,240,234,0.04)" vertical={false} />
              <XAxis dataKey="name" tick={AXIS} axisLine={false} tickLine={false} interval={3} />
              <YAxis tick={AXIS} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <RechartsTooltip
                content={<ChartTooltip />}
                cursor={{ stroke: 'rgba(240,240,234,0.08)', strokeWidth: 1 }}
              />
              {/* Target comfort band */}
              <ReferenceArea y1={1.5} y2={2.5} fill="#B41923" fillOpacity={0.05} strokeOpacity={0} />
              {/* 2% target line */}
              <ReferenceLine y={2} stroke="#B41923" strokeDasharray="4 4" strokeOpacity={0.35}
                label={{ value: 'π*', position: 'insideTopRight', style: { fontSize: 8, fill: '#B41923', fontFamily: 'monospace' } }} />
              {/* Zero line for output gap */}
              <ReferenceLine y={0} stroke="rgba(240,240,234,0.06)" />
              {/* Current quarter */}
              <ReferenceLine x={data[currentQ]?.name} stroke="rgba(255,255,255,0.10)" strokeWidth={20} />
              <Area type="monotone" dataKey="inflation" name="Inflation"
                stroke="#B41923" strokeWidth={2} fill="url(#ecInflGrad)" dot={false}
                activeDot={{ r: 4, fill: '#B41923', stroke: 'rgba(180,25,35,0.3)', strokeWidth: 5 }}
                connectNulls={false} />
              <Area type="monotone" dataKey="outputGap" name="Output gap"
                stroke="#5C7E92" strokeWidth={1.5} fill="url(#ecGapGrad)" dot={false}
                activeDot={{ r: 3, fill: '#5C7E92' }}
                connectNulls={false} strokeDasharray="3 3" />
            </ComposedChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: '14px', marginTop: '8px', flexWrap: 'wrap' }}>
            <LegendItem color="#B41923" label="Inflation (π)" />
            <LegendItem color="#5C7E92" label="Output gap (ỹ)" dashed />
            <LegendItem color="#B41923" label="Cible 2% ±0,5" band />
          </div>
        </div>
      )}

      {/* ── TAB : Taux d'intérêt ── */}
      {activeTab === 'rates' && (
        <div>
          <ResponsiveContainer width="100%" height={230}>
            <ComposedChart data={data} margin={{ top: 6, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="rgba(240,240,234,0.04)" vertical={false} />
              <XAxis dataKey="name" tick={AXIS} axisLine={false} tickLine={false} interval={3} />
              <YAxis tick={AXIS} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <RechartsTooltip
                content={<ChartTooltip />}
                cursor={{ stroke: 'rgba(240,240,234,0.08)', strokeWidth: 1 }}
              />
              {/* Zero Lower Bound */}
              <ReferenceLine y={0.5} stroke="rgba(92,126,146,0.28)" strokeDasharray="4 4"
                label={{ value: 'ZLB', position: 'insideTopRight', style: { fontSize: 8, fill: '#5C7E92', fontFamily: 'monospace' } }} />
              <ReferenceLine x={data[currentQ]?.name} stroke="rgba(255,255,255,0.10)" strokeWidth={20} />
              <Area type="stepAfter" dataKey="policyRate" name="Taux directeur"
                stroke="#B41923" strokeWidth={2} fill="url(#ecRateGrad)" dot={false}
                activeDot={{ r: 4, fill: '#B41923' }}
                connectNulls={false} />
              <Line type="monotone" dataKey="interbankRate" name="TMP"
                stroke="#5C7E92" strokeWidth={1.5} dot={false}
                activeDot={{ r: 3, fill: '#5C7E92' }} connectNulls={false} />
              <Line type="monotone" dataKey="lendingRate" name="Taux débiteur"
                stroke="#C9A86A" strokeWidth={1.5} dot={false}
                activeDot={{ r: 3, fill: '#C9A86A' }} connectNulls={false} strokeDasharray="3 2" />
            </ComposedChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: '14px', marginTop: '8px', flexWrap: 'wrap' }}>
            <LegendItem color="#B41923" label="Taux directeur" />
            <LegendItem color="#5C7E92" label="TMP" />
            <LegendItem color="#C9A86A" label="Taux débiteur" dashed />
          </div>
        </div>
      )}

      {/* ── TAB : Financier ── */}
      {activeTab === 'financial' && (
        <div>
          <ResponsiveContainer width="100%" height={230}>
            <ComposedChart data={data} margin={{ top: 6, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="rgba(240,240,234,0.04)" vertical={false} />
              <XAxis dataKey="name" tick={AXIS} axisLine={false} tickLine={false} interval={3} />
              {/* Left axis: credibility 0-100 */}
              <YAxis yAxisId="cred" tick={AXIS} axisLine={false} tickLine={false}
                domain={[0, 100]} tickFormatter={v => `${v}`} />
              {/* Right axis: NPL 0-20% */}
              <YAxis yAxisId="npl" orientation="right" tick={AXIS} axisLine={false} tickLine={false}
                domain={[0, 20]} tickFormatter={v => `${v}%`} />
              <RechartsTooltip
                content={<ChartTooltip />}
                cursor={{ stroke: 'rgba(240,240,234,0.08)', strokeWidth: 1 }}
              />
              {/* Credibility thresholds */}
              <ReferenceLine yAxisId="cred" y={80} stroke="rgba(74,157,124,0.22)" strokeDasharray="3 3" />
              <ReferenceLine yAxisId="cred" y={50} stroke="rgba(201,168,106,0.22)" strokeDasharray="3 3" />
              {/* NPL danger threshold */}
              <ReferenceLine yAxisId="npl" y={12} stroke="rgba(194,84,80,0.22)" strokeDasharray="3 3"
                label={{ value: 'NPL crit.', position: 'insideTopRight', style: { fontSize: 8, fill: '#C25450', fontFamily: 'monospace' } }} />
              <ReferenceLine x={data[currentQ]?.name} stroke="rgba(255,255,255,0.10)" strokeWidth={20} />
              <Area yAxisId="cred" type="monotone" dataKey="credibility" name="Crédibilité"
                stroke="#4A9D7C" strokeWidth={2} fill="url(#ecCredGrad)" dot={false}
                activeDot={{ r: 4, fill: '#4A9D7C' }} connectNulls={false} />
              <Bar yAxisId="npl" dataKey="npl" name="NPL"
                fill="rgba(194,84,80,0.28)" stroke="rgba(194,84,80,0.55)" strokeWidth={0.5}
                radius={[2, 2, 0, 0]} maxBarSize={12} />
            </ComposedChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: '14px', marginTop: '8px', flexWrap: 'wrap' }}>
            <LegendItem color="#4A9D7C" label="Crédibilité Banque centrale (axe gauche)" />
            <LegendItem color="#C25450" label="NPL % (axe droit)" bar />
          </div>
        </div>
      )}
    </div>
  )
}
