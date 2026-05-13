'use client'

import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, Tooltip,
} from 'recharts'
import type { GameRecord } from '@/store/authStore'

interface PerformanceRadarProps {
  games: GameRecord[]
}

function score(value: number, min: number, max: number): number {
  return Math.round(Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100)))
}

function RadarTooltip({ active, payload }: { active?: boolean; payload?: { payload: { axis: string; value: number } }[] }) {
  if (!active || !payload?.[0]) return null
  const d = payload[0].payload
  return (
    <div style={{
      backgroundColor: '#14161A',
      border: '1px solid rgba(240,240,234,0.10)',
      borderRadius: '6px',
      padding: '8px 12px',
      fontFamily: '"Courier New", monospace',
      fontSize: '11px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
    }}>
      <p style={{ color: '#9A9B9B', marginBottom: '2px', fontSize: '9px', letterSpacing: '0.08em' }}>{d.axis}</p>
      <p style={{ color: '#B41923', fontWeight: 700 }}>{d.value} / 100</p>
    </div>
  )
}

export function PerformanceRadar({ games }: PerformanceRadarProps) {
  if (games.length === 0) return null

  // Average over last 5 games
  const recent = games.slice(0, 5)
  const n = recent.length

  const avgInflation   = recent.reduce((s, g) => s + g.avgInflation,   0) / n
  const avgGrowth      = recent.reduce((s, g) => s + g.avgGrowth,      0) / n
  const avgCredibility = recent.reduce((s, g) => s + g.avgCredibility, 0) / n
  const avgScore       = recent.reduce((s, g) => s + g.score,          0) / n
  const avgQuarters    = recent.reduce((s, g) => s + g.quarters,       0) / n

  // Scores per dimension
  const inflationScore   = Math.round(Math.max(0, 100 - Math.abs(avgInflation - 2) * 16))
  const growthScore      = score(avgGrowth, -3, 3)
  const credibilityScore = Math.round(Math.max(0, Math.min(100, avgCredibility)))
  const globalScore      = Math.round(avgScore)
  const enduranceScore   = Math.round(Math.min(100, (avgQuarters / 20) * 100))

  const data = [
    { axis: 'Stabilité\ndes prix', value: inflationScore   },
    { axis: 'Croissance',          value: growthScore      },
    { axis: 'Crédibilité',         value: credibilityScore },
    { axis: 'Score global',        value: globalScore      },
    { axis: 'Endurance',           value: enduranceScore   },
  ]

  const avg = Math.round(data.reduce((s, d) => s + d.value, 0) / data.length)

  return (
    <div style={{
      backgroundColor: 'var(--bg-panel)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '10px',
      padding: '16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontFamily: 'monospace', fontSize: '9px', color: 'var(--text-tertiary)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Performance multi-critères
        </span>
        <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 700 }}>
          {avg} / 100
        </span>
      </div>
      <p style={{ fontSize: '9px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
        Moyenne sur {n} dernière{n > 1 ? 's' : ''} partie{n > 1 ? 's' : ''}
      </p>

      <ResponsiveContainer width="100%" height={200}>
        <RadarChart data={data} margin={{ top: 8, right: 20, bottom: 8, left: 20 }}>
          <PolarGrid stroke="rgba(240,240,234,0.08)" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{
              fontSize: 9,
              fill: 'var(--text-tertiary)' as string,
              fontFamily: 'monospace',
            }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
            tickCount={4}
          />
          <Tooltip content={<RadarTooltip />} />
          <Radar
            name="Performance"
            dataKey="value"
            stroke="#B41923"
            fill="#B41923"
            fillOpacity={0.12}
            strokeWidth={1.5}
            dot={{ r: 3, fill: '#B41923', strokeWidth: 0 }}
          />
        </RadarChart>
      </ResponsiveContainer>

      {/* Dimension bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
        {data.map(d => (
          <div key={d.axis} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontFamily: 'monospace', fontSize: '8px', color: 'var(--text-tertiary)',
              width: '80px', flexShrink: 0, whiteSpace: 'nowrap', letterSpacing: '0.02em',
            }}>
              {d.axis.replace('\n', ' ')}
            </span>
            <div style={{ flex: 1, height: '3px', backgroundColor: 'var(--bg-hover)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: '2px',
                width: `${d.value}%`,
                backgroundColor: d.value >= 75 ? '#4A9D7C' : d.value >= 50 ? '#C9A86A' : '#C25450',
                transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)',
              }} />
            </div>
            <span style={{ fontFamily: 'monospace', fontSize: '9px', color: 'var(--text-secondary)', width: '28px', textAlign: 'right' }}>
              {d.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
