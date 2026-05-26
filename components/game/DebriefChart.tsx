'use client'

import { useMemo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useGameStore } from '@/store/gameStore'
import { fmtQuarter } from '@/lib/format'
import { computeTaylorRate } from '@/engine/models/taylorRule'
import { sound } from '@/lib/audio'

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

export function DebriefChart() {
  const [showComparison, setShowComparison] = useState(false)
  const { history, currentState, scenario } = useGameStore(
    useShallow(s => ({
      history:      s.history,
      currentState: s.currentState,
      scenario:     s.scenario,
    }))
  )

  const data = useMemo(() => {
    return [...history, currentState].map((s, index) => {
      // Calibrage du taux réel historique marocain / international selon le scénario
      let bamRate = 2.50
      const scenarioId = scenario || 'standard'
      if (scenarioId === 'inflation2022') {
        const rates = [1.50, 1.50, 2.00, 2.00, 2.50, 2.50, 3.00, 3.00, 3.00, 3.00, 3.00, 3.00, 3.00, 3.00, 3.00, 3.00, 3.00, 3.00, 3.00, 3.00, 3.00, 3.00, 3.00, 3.00, 3.00]
        bamRate = rates[index] ?? 3.00
      } else if (scenarioId === 'covid2020') {
        const rates = [2.25, 2.00, 1.50, 1.50, 1.50, 1.50, 1.50, 1.50, 1.50, 1.50, 1.50, 1.50, 1.50, 1.50, 1.50, 1.50, 1.50, 1.50, 1.50, 1.50, 1.50, 1.50, 1.50, 1.50, 1.50]
        bamRate = rates[index] ?? 1.50
      } else if (scenarioId === 'flexibilite') {
        const rates = [2.25, 2.25, 2.25, 2.50, 2.50, 2.50, 2.75, 2.75, 2.75, 2.75, 2.75, 2.75, 2.75, 2.75, 2.75, 3.00, 3.00, 3.00, 3.00, 3.00, 3.00, 3.00, 3.00, 3.00, 3.00]
        bamRate = rates[index] ?? 3.00
      } else if (scenarioId === 'volcker1979') {
        const rates = [11.0, 12.5, 14.0, 15.5, 17.5, 19.0, 20.0, 18.0]
        bamRate = rates[index] ?? 18.0
      } else if (scenarioId === 'crisis2008') {
        const rates = [3.25, 3.25, 3.00, 3.00, 3.00, 3.00, 3.25, 3.25]
        bamRate = rates[index] ?? 3.25
      } else {
        const rates = [2.50, 2.50, 2.50, 2.50, 2.50, 2.50, 2.75, 2.75, 2.75, 2.75, 2.75, 2.75, 2.75, 2.75, 2.75, 2.75, 2.75, 2.75, 2.75, 2.75, 2.75, 2.75, 2.75, 2.75, 2.75]
        bamRate = rates[index] ?? 2.75
      }

      return {
        name: fmtQuarter(s.date.year, s.date.q),
        inflation: s.inflation,
        outputGap: s.outputGap,
        policyRate: s.policyRate,
        gdpGrowth: s.gdpGrowth,
        unemployment: s.unemployment,
        target: 2,
        taylorRate: computeTaylorRate(s.inflation, s.outputGap),
        bamActualRate: bamRate,
      }
    })
  }, [history, currentState, scenario])

  const axisStyle = {
    fontSize: 10,
    fill: 'var(--text-tertiary)',
    fontFamily: 'var(--font-jetbrains)',
  }

  return (
    <div className="space-y-4">
      {/* Header avec bouton Toggler */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="label-caps" style={{ color: 'var(--text-tertiary)', margin: 0 }}>
          Trajectoire des instruments et indicateurs clés
        </p>
        <button
          type="button"
          onClick={() => {
            setShowComparison(!showComparison)
            sound.playTick()
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-all"
          style={{
            backgroundColor: showComparison ? 'rgba(92,126,146,0.12)' : 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            color: showComparison ? 'var(--accent-cool)' : 'var(--text-secondary)',
            cursor: 'pointer'
          }}
        >
          {showComparison ? '📊 Masquer les Benchmarks' : '📊 Comparer avec Taylor & CBS Réel'}
        </button>
      </div>

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
            name="Votre Taux directeur"
            stroke="var(--accent-warm)"
            strokeWidth={2.5}
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
          {showComparison && (
            <Line
              type="monotone"
              dataKey="taylorRate"
              name="Règle de Taylor (Théorique)"
              stroke="var(--accent-cool)"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="5 5"
            />
          )}
          {showComparison && (
            <Line
              type="stepAfter"
              dataKey="bamActualRate"
              name="Taux Réel Historique"
              stroke="#D8A436"
              strokeWidth={1.5}
              dot={false}
              strokeDasharray="3 3"
            />
          )}
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

