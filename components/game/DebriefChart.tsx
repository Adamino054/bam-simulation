'use client'

import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useGameStore } from '@/store/gameStore'
import { fmtQuarter } from '@/lib/format'

const {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Area,
  Legend,
} = require('recharts')

export function DebriefChart() {
  const { history, currentState } = useGameStore(
    useShallow(s => ({
      history:      s.history,
      currentState: s.currentState,
    }))
  )

  const data = useMemo(() => {
    return [...history, currentState].map(s => ({
      name: fmtQuarter(s.date.year, s.date.q),
      inflation: s.inflation,
      outputGap: s.outputGap,
      policyRate: s.policyRate,
      gdpGrowth: s.gdpGrowth,
      unemployment: s.unemployment,
      target: 2,
    }))
  }, [history, currentState])

  const axisStyle = {
    fontSize: 10,
    fill: 'var(--text-tertiary)',
    fontFamily: 'var(--font-jetbrains)',
  }

  return (
    <div className="space-y-4">
      {/* Chart */}
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border-subtle)"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tick={axisStyle}
            axisLine={false}
            tickLine={false}
            interval={3}
          />
          <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: '8px',
              color: 'var(--text-secondary)',
              fontSize: '12px',
            }}
            formatter={(value: number, name: string) => [value.toFixed(2) + '%', name]}
          />
          <ReferenceLine
            y={2}
            stroke="var(--accent-primary)"
            strokeDasharray="4 4"
            strokeOpacity={0.4}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
          />
          <Line
            type="monotone"
            dataKey="inflation"
            name="Inflation"
            stroke="var(--accent-primary)"
            strokeWidth={2.5}
            dot={{ r: 3, fill: 'var(--accent-primary)' }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="outputGap"
            name="Output gap"
            stroke="var(--data-info)"
            strokeWidth={2}
            dot={false}
            strokeDasharray="4 4"
          />
          <Line
            type="stepAfter"
            dataKey="policyRate"
            name="Taux directeur"
            stroke="var(--accent-warm)"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="gdpGrowth"
            name="Croissance PIB"
            stroke="var(--data-positive)"
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="2 2"
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Key metrics cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-border-subtle">
        {(() => {
          const inflationAvg = data.reduce((a, s) => a + s.inflation, 0) / data.length || 0
          const gdpAvg = data.reduce((a, s) => a + s.gdpGrowth, 0) / data.length || 0
          const unempAvg = data.reduce((a, s) => a + (s.unemployment || 0), 0) / data.length || 0
          const maxRate = Math.max(...data.map(s => s.policyRate))

          return [
            { label: 'Inflation moyenne', value: inflationAvg.toFixed(1) + '%', color: 'var(--accent-primary)' },
            { label: 'Croissance moyenne', value: gdpAvg.toFixed(1) + '%', color: 'var(--data-positive)' },
            { label: 'Chômage moyen', value: unempAvg ? unempAvg.toFixed(1) + '%' : '—', color: 'var(--data-info)' },
            { label: 'Taux max atteint', value: maxRate.toFixed(2) + '%', color: 'var(--accent-warm)' },
          ].map((item) => (
            <div key={item.label} className="text-center p-2 rounded bg-bg-elevated">
              <p className="text-xs text-text-tertiary mb-1">{item.label}</p>
              <p className="text-lg font-mono font-semibold" style={{ color: item.color }}>
                {item.value}
              </p>
            </div>
          ))
        })()}
      </div>
    </div>
  )
}
