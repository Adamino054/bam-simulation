'use client'

import { useMemo } from 'react'
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
} = require('recharts')

export function DebriefChart() {
  const history = useGameStore(s => s.history)
  const currentState = useGameStore(s => s.currentState)

  const data = useMemo(() => {
    return [...history, currentState].map(s => ({
      name: fmtQuarter(s.date.year, s.date.q),
      inflation: s.inflation,
      outputGap: s.outputGap,
      policyRate: s.policyRate,
    }))
  }, [history, currentState])

  const axisStyle = {
    fontSize: 10,
    fill: 'var(--text-tertiary)',
    fontFamily: 'var(--font-jetbrains)',
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid
          stroke="var(--border-subtle)"
          strokeDasharray="2 4"
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
            borderRadius: '4px',
            color: 'var(--text-secondary)',
            fontSize: '12px',
          }}
        />
        <ReferenceLine
          y={2}
          stroke="var(--accent-primary)"
          strokeDasharray="4 4"
          strokeOpacity={0.4}
        />
        <Line
          type="monotone"
          dataKey="inflation"
          name="Inflation"
          stroke="var(--accent-primary)"
          strokeWidth={2}
          dot={{ r: 2 }}
        />
        <Line
          type="monotone"
          dataKey="outputGap"
          name="Output gap"
          stroke="var(--data-neutral)"
          strokeWidth={1.5}
          dot={false}
          strokeDasharray="3 3"
        />
        <Line
          type="stepAfter"
          dataKey="policyRate"
          name="Taux directeur"
          stroke="var(--accent-cool)"
          strokeWidth={1.5}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
