'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import type { GameRecord } from '@/store/authStore'

interface ScoreProgressChartProps {
  games: GameRecord[]
}

const GRADE_COLOR: Record<string, string> = {
  A: '#4A9D7C', B: '#5C7E92', C: '#C9A86A', D: '#E8914A', F: '#C25450',
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: { score: number; grade: string; scenario: string; date: string } }[] }) {
  if (!active || !payload?.[0]) return null
  const d = payload[0].payload
  return (
    <div
      style={{
        backgroundColor: '#14161A',
        border: '1px solid rgba(240,240,234,0.10)',
        borderRadius: '6px',
        padding: '10px 14px',
        fontFamily: '"Courier New", monospace',
        fontSize: '11px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
      }}
    >
      <p style={{ color: GRADE_COLOR[d.grade] ?? '#F0F0EA', fontWeight: 700, marginBottom: '4px' }}>
        Grade {d.grade} · {d.score}/100
      </p>
      <p style={{ color: '#9A9B9B', fontSize: '10px', marginBottom: '2px' }}>{d.scenario}</p>
      <p style={{ color: '#5E6066', fontSize: '9px' }}>{d.date}</p>
    </div>
  )
}

export function ScoreProgressChart({ games }: ScoreProgressChartProps) {
  if (games.length < 2) return null

  const data = [...games]
    .reverse()
    .map((g, i) => ({
      index: i + 1,
      score: g.score,
      grade: g.grade,
      scenario: g.scenarioTitle ?? g.scenario,
      date: new Date(g.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
    }))

  const avgScore = Math.round(data.reduce((a, b) => a + b.score, 0) / data.length)

  return (
    <div style={{ width: '100%', height: '180px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 8, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#B41923" stopOpacity={0.30} />
              <stop offset="95%" stopColor="#B41923" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="rgba(240,240,234,0.04)" vertical={false} />

          <XAxis
            dataKey="date"
            tick={{ fontSize: 9, fill: '#5E6066', fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 9, fill: '#5E6066', fontFamily: 'monospace' }}
            axisLine={false}
            tickLine={false}
            ticks={[0, 25, 50, 75, 100]}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Reference lines for grade thresholds */}
          <ReferenceLine y={90} stroke="rgba(74,157,124,0.25)"  strokeDasharray="3 4" label={{ value: 'A', position: 'insideTopRight', fontSize: 8, fill: 'rgba(74,157,124,0.5)', fontFamily: 'monospace' }} />
          <ReferenceLine y={75} stroke="rgba(92,126,146,0.20)"  strokeDasharray="3 4" label={{ value: 'B', position: 'insideTopRight', fontSize: 8, fill: 'rgba(92,126,146,0.45)', fontFamily: 'monospace' }} />
          <ReferenceLine y={60} stroke="rgba(201,168,106,0.18)" strokeDasharray="3 4" label={{ value: 'C', position: 'insideTopRight', fontSize: 8, fill: 'rgba(201,168,106,0.45)', fontFamily: 'monospace' }} />
          <ReferenceLine y={avgScore} stroke="rgba(180,25,35,0.35)" strokeDasharray="5 3" />

          <Area
            type="monotone"
            dataKey="score"
            stroke="#B41923"
            strokeWidth={2}
            fill="url(#scoreGradient)"
            dot={{ r: 3.5, fill: '#B41923', strokeWidth: 0 }}
            activeDot={{ r: 5, fill: '#B41923', stroke: '#B41923', strokeWidth: 2, strokeOpacity: 0.4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
