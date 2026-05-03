'use client'

import dynamic from 'next/dynamic'
import { useMemo } from 'react'
import { useGameStore } from '@/store/gameStore'
import { TOTAL_QUARTERS } from '@/lib/constants'
import { fmtQuarter } from '@/lib/format'
import type { EconomicState } from '@/engine/state'

const {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
} = require('recharts')

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
    name: '',
    quarter: i,
  }))

  all.forEach(s => {
    points[s.quarter] = {
      name: fmtQuarter(s.date.year, s.date.q),
      quarter: s.quarter,
      inflation: s.inflation,
      outputGap: s.outputGap,
      policyRate: s.policyRate,
      interbankRate: s.interbankRate,
      lendingRate: s.lendingRate,
    }
  })

  // Labels uniquement sur les 5 premières et le dernier
  return points.map((p, i) => ({
    ...p,
    name: i % 4 === 0 ? p.name || `T${i + 1}` : '',
  }))
}

function CustomTooltipContent({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded p-2.5 text-xs shadow-xl"
      style={{
        backgroundColor: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
        color: 'var(--text-secondary)',
      }}
    >
      <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span style={{ color: entry.color }}>●</span>
          <span>{entry.name} :</span>
          <span className="font-mono tabular" style={{ color: 'var(--text-primary)' }}>
            {entry.value?.toFixed(2).replace('.', ',')} %
          </span>
        </div>
      ))}
    </div>
  )
}

export function EconomyChart() {
  const { history, currentState } = useGameStore(s => ({
    history: s.history,
    currentState: s.currentState,
  }))

  const mainData  = useMemo(() => buildData(history, currentState), [history, currentState])
  const ratesData = useMemo(() => buildData(history, currentState), [history, currentState])

  const axisStyle = { fontSize: 10, fill: 'var(--text-tertiary)', fontFamily: 'var(--font-jetbrains)' }
  const gridColor = 'var(--border-subtle)'

  return (
    <div className="flex flex-col gap-4">
      {/* ── Graphe principal : inflation + output gap ── */}
      <div>
        <p className="label-caps mb-2">Inflation & output gap</p>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={mainData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke={gridColor} strokeDasharray="2 4" />
            <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} interval={3} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
            <Tooltip content={<CustomTooltipContent />} />
            <ReferenceLine
              y={2}
              stroke="var(--accent-primary)"
              strokeDasharray="4 4"
              strokeOpacity={0.5}
              label={{ value: 'Cible 2 %', position: 'right', style: axisStyle }}
            />
            <Line
              type="monotone"
              dataKey="inflation"
              name="Inflation"
              stroke="var(--accent-primary)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3 }}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="outputGap"
              name="Output gap"
              stroke="var(--data-neutral)"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="3 3"
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ── Graphe secondaire : taux ── */}
      <div>
        <p className="label-caps mb-2">Taux d'intérêt</p>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={ratesData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid stroke={gridColor} strokeDasharray="2 4" />
            <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} interval={3} />
            <YAxis tick={axisStyle} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
            <Tooltip content={<CustomTooltipContent />} />
            <Line
              type="stepAfter"
              dataKey="policyRate"
              name="Taux directeur"
              stroke="var(--accent-primary)"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="interbankRate"
              name="TMP"
              stroke="var(--accent-cool)"
              strokeWidth={1.5}
              dot={false}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="lendingRate"
              name="Taux débiteur"
              stroke="var(--data-warning)"
              strokeWidth={1.5}
              dot={false}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
