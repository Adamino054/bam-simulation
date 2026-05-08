'use client'

import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ReferenceLine,
} from 'recharts'
import { useGameStore } from '@/store/gameStore'
import { TOTAL_QUARTERS } from '@/lib/constants'
import { fmtQuarter } from '@/lib/format'
import type { EconomicState } from '@/engine/state'

interface ChartPoint {
  name: string
  quarter: number
  inflation?: number
  outputGap?: number
  policyRate?: number
  interbankRate?: number
  lendingRate?: number
}

function buildData(history: EconomicState[], current: EconomicState): ChartPoint[] {
  const all = [...history, current]
  const points: ChartPoint[] = Array.from({ length: TOTAL_QUARTERS }, (_, i) => ({
    name: i % 4 === 0 ? `T${i + 1}` : '',
    quarter: i,
  }))

  all.forEach(s => {
    points[s.quarter] = {
      ...points[s.quarter],
      name: s.quarter % 4 === 0 ? fmtQuarter(s.date.year, s.date.q) : '',
      inflation:     s.inflation,
      outputGap:     s.outputGap,
      policyRate:    s.policyRate,
      interbankRate: s.interbankRate,
      lendingRate:   s.lendingRate,
    }
  })

  return points
}

interface TooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded px-3 py-2 text-xs shadow-lg"
      style={{
        backgroundColor: '#1C1F26',
        border: '1px solid rgba(240,240,234,0.12)',
        color: '#9A9B9B',
        fontFamily: 'var(--font-inter)',
      }}
    >
      {label && (
        <p className="mb-1.5 font-medium" style={{ color: '#F0F0EA' }}>{label}</p>
      )}
      {payload.map(entry => (
        <div key={entry.name} className="flex items-center gap-2 leading-5">
          <span style={{ color: entry.color, fontSize: '8px' }}>●</span>
          <span style={{ color: '#9A9B9B' }}>{entry.name}</span>
          <span className="ml-auto pl-4 font-mono tabular" style={{ color: '#F0F0EA' }}>
            {entry.value?.toFixed(2).replace('.', ',')} %
          </span>
        </div>
      ))}
    </div>
  )
}

const AXIS_STYLE = {
  fontSize: 9,
  fill: '#5E6066',
  fontFamily: 'monospace',
}

export function EconomyChart() {
  const { history, currentState } = useGameStore(
    useShallow(s => ({
      history:      s.history,
      currentState: s.currentState,
    }))
  )

  const data = useMemo(
    () => buildData(history, currentState),
    [history, currentState],
  )

  return (
    <div className="flex flex-col gap-5">
      {/* ── Inflation & output gap ── */}
      <div>
        <p className="label-caps mb-3">Inflation & output gap</p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
            <CartesianGrid
              stroke="rgba(240,240,234,0.05)"
              strokeDasharray="3 5"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={AXIS_STYLE}
              axisLine={false}
              tickLine={false}
              interval={3}
            />
            <YAxis
              tick={AXIS_STYLE}
              axisLine={false}
              tickLine={false}
              width={28}
              tickFormatter={v => `${v}%`}
            />
            <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(240,240,234,0.08)' }} />
            <ReferenceLine
              y={2}
              stroke="#B41923"
              strokeDasharray="4 4"
              strokeOpacity={0.4}
              label={{
                value: 'Cible',
                position: 'right',
                style: { ...AXIS_STYLE, fill: '#B41923', fontSize: 8 },
              }}
            />
            <Line
              type="monotone"
              dataKey="inflation"
              name="Inflation"
              stroke="#B41923"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, fill: '#B41923' }}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="outputGap"
              name="Output gap"
              stroke="#5E6066"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="3 3"
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ── Taux d'intérêt ── */}
      <div>
        <p className="label-caps mb-3">Taux d'intérêt</p>
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={data} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
            <CartesianGrid
              stroke="rgba(240,240,234,0.05)"
              strokeDasharray="3 5"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={AXIS_STYLE}
              axisLine={false}
              tickLine={false}
              interval={3}
            />
            <YAxis
              tick={AXIS_STYLE}
              axisLine={false}
              tickLine={false}
              width={28}
              tickFormatter={v => `${v}%`}
            />
            <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(240,240,234,0.08)' }} />
            <Line
              type="stepAfter"
              dataKey="policyRate"
              name="Taux directeur"
              stroke="#B41923"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="interbankRate"
              name="TMP"
              stroke="#5C7E92"
              strokeWidth={1.5}
              dot={false}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="lendingRate"
              name="Taux débiteur"
              stroke="#C9A86A"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="2 2"
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Légende manuelle */}
        <div className="flex items-center gap-4 mt-2">
          {[
            { color: '#B41923', label: 'Taux directeur', dash: false },
            { color: '#5C7E92', label: 'TMP',            dash: false },
            { color: '#C9A86A', label: 'Taux débiteur',  dash: true },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-1.5">
              <svg width="20" height="4" viewBox="0 0 20 4">
                {item.dash
                  ? <line x1="0" y1="2" x2="20" y2="2" stroke={item.color} strokeWidth="1.5" strokeDasharray="3 2" />
                  : <line x1="0" y1="2" x2="20" y2="2" stroke={item.color} strokeWidth="2" />
                }
              </svg>
              <span className="label-caps">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
