'use client'

import { useEffect, useRef, useState } from 'react'
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { Activity, Percent, TrendingDown, Shield } from 'lucide-react'

// 20 quarters of the 2022 Morocco inflation shock — calibrated on central bank data
const DATA = [
  { q: 'T1',  inflation: 1.4, rate: 1.50 },
  { q: 'T2',  inflation: 2.1, rate: 1.50 },
  { q: 'T3',  inflation: 4.8, rate: 1.50 },
  { q: 'T4',  inflation: 6.6, rate: 2.00 },
  { q: 'T5',  inflation: 7.9, rate: 2.50 },
  { q: 'T6',  inflation: 7.0, rate: 2.50 },
  { q: 'T7',  inflation: 6.1, rate: 3.00 },
  { q: 'T8',  inflation: 5.2, rate: 3.00 },
  { q: 'T9',  inflation: 4.4, rate: 3.00 },
  { q: 'T10', inflation: 3.6, rate: 3.00 },
  { q: 'T11', inflation: 2.9, rate: 2.75 },
  { q: 'T12', inflation: 2.4, rate: 2.75 },
  { q: 'T13', inflation: 2.2, rate: 2.50 },
  { q: 'T14', inflation: 2.0, rate: 2.50 },
  { q: 'T15', inflation: 1.9, rate: 2.50 },
  { q: 'T16', inflation: 2.1, rate: 2.50 },
  { q: 'T17', inflation: 2.2, rate: 2.50 },
  { q: 'T18', inflation: 2.0, rate: 2.25 },
  { q: 'T19', inflation: 1.9, rate: 2.25 },
  { q: 'T20', inflation: 2.1, rate: 2.25 },
]

const DECISIONS = [
  { q: 'T4',  dir: '↑', text: '1,50→2,00 %', color: '#C25450' },
  { q: 'T5',  dir: '↑', text: '2,00→2,50 %', color: '#C25450' },
  { q: 'T7',  dir: '↑', text: '2,50→3,00 %', color: '#C25450' },
  { q: 'T11', dir: '↓', text: '3,00→2,75 %', color: '#4A9D7C' },
  { q: 'T13', dir: '↓', text: '2,75→2,50 %', color: '#4A9D7C' },
  { q: 'T18', dir: '↓', text: '2,50→2,25 %', color: '#4A9D7C' },
]

const METRICS = [
  { icon: Activity,     label: 'INFLATION',   value: '2,1 %',    sub: '−0,1',  color: '#B41923', subColor: '#4A9D7C' },
  { icon: Percent,      label: 'TAUX DIR.',   value: '2,25 %',   sub: '−0,25', color: '#C9A86A', subColor: '#4A9D7C' },
  { icon: TrendingDown, label: 'OUTPUT GAP',  value: '−0,3 %',   sub: '+0,1',  color: '#5C7E92', subColor: '#4A9D7C' },
  { icon: Shield,       label: 'CRÉDIBILITÉ', value: '91 / 100', sub: '+1',    color: '#4A9D7C', subColor: '#4A9D7C' },
]

function ChartTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { dataKey: string; value: number }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const infl = payload.find(p => p.dataKey === 'inflation')?.value
  const rate = payload.find(p => p.dataKey === 'rate')?.value
  return (
    <div style={{
      backgroundColor: '#0A0B0D',
      border: '1px solid rgba(240,240,234,0.14)',
      borderRadius: '6px',
      padding: '10px 14px',
      fontFamily: '"Courier New", monospace',
      fontSize: '11px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
    }}>
      <p style={{ color: '#5E6066', marginBottom: '6px', fontSize: '9px', letterSpacing: '0.08em' }}>{label}</p>
      {infl !== undefined && (
        <p style={{ color: '#B41923', marginBottom: '3px' }}>
          π&nbsp;&nbsp;{infl.toFixed(1)} %
        </p>
      )}
      {rate !== undefined && (
        <p style={{ color: '#C9A86A' }}>
          i*&nbsp;{rate.toFixed(2)} %
        </p>
      )}
    </div>
  )
}

export function EcoPreviewChart() {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true) },
      { threshold: 0.15 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={ref} style={{
      backgroundColor: '#0A0B0E',
      border: '1px solid rgba(240,240,234,0.09)',
      borderRadius: '14px',
      overflow: 'hidden',
      boxShadow: '0 0 0 1px rgba(240,240,234,0.04), 0 32px 80px rgba(0,0,0,0.65)',
    }}>

      {/* ── Terminal title bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px',
        backgroundColor: '#070809',
        borderBottom: '1px solid rgba(240,240,234,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '5px' }}>
            {['#FF5F56', '#FFBD2E', '#27C93F'].map((c, i) => (
              <span key={i} style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: c, display: 'inline-block', opacity: 0.8 }} />
            ))}
          </div>
          <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#3E4046', letterSpacing: '0.08em' }}>
            CBS · TERMINAL — BANQUE CENTRALE
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#5E6066' }}>T20 / 20</span>
          <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#5E6066' }}>
            SCÉNARIO&nbsp;
            <span style={{ color: '#C9A86A' }}>CHOC 2022</span>
          </span>
          <span style={{
            fontFamily: 'monospace', fontSize: '9px', fontWeight: 700,
            color: '#4A9D7C', backgroundColor: 'rgba(74,157,124,0.12)',
            padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(74,157,124,0.25)',
            letterSpacing: '0.06em',
          }}>
            ✓ GRADE&nbsp;A · 91/100
          </span>
        </div>
      </div>

      {/* ── Key metrics row ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        borderBottom: '1px solid rgba(240,240,234,0.06)',
      }}>
        {METRICS.map((m, i) => {
          const Icon = m.icon
          return (
            <div key={i} style={{
              padding: '14px 18px',
              borderRight: i < 3 ? '1px solid rgba(240,240,234,0.05)' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
                <Icon size={9} style={{ color: '#3E4046' }} />
                <span style={{ fontFamily: 'monospace', fontSize: '8px', color: '#3E4046', letterSpacing: '0.1em' }}>
                  {m.label}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{
                  fontFamily: '"Courier New", monospace', fontSize: '1.25rem',
                  fontWeight: 700, color: m.color, letterSpacing: '-0.02em', lineHeight: 1,
                }}>
                  {m.value}
                </span>
                <span style={{ fontFamily: 'monospace', fontSize: '10px', color: m.subColor }}>
                  {m.sub}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Chart area ── */}
      <div style={{ padding: '16px 16px 6px' }}>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontFamily: 'monospace', fontSize: '9px', color: '#3E4046', letterSpacing: '0.1em' }}>
            INFLATION · TAUX DIRECTEUR — 20 TRIMESTRES
          </span>
          <div style={{ display: 'flex', gap: '14px' }}>
            {[
              { color: '#B41923', label: 'Inflation (π)', dashed: false },
              { color: '#C9A86A', label: 'Taux directeur (i*)', dashed: false },
              { color: 'rgba(255,255,255,0.2)', label: 'Cible 2 %', dashed: true },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{
                  width: 16, height: l.dashed ? 0 : 2,
                  borderRadius: 1, backgroundColor: l.dashed ? 'transparent' : l.color,
                  borderTop: l.dashed ? `1px dashed ${l.color}` : 'none',
                }} />
                <span style={{ fontFamily: 'monospace', fontSize: '9px', color: '#5E6066' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recharts */}
        <div style={{ height: '180px' }}>
          {visible && (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={DATA} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="ecoInflGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#B41923" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#B41923" stopOpacity={0.02} />
                  </linearGradient>
                </defs>

                <CartesianGrid stroke="rgba(240,240,234,0.04)" vertical={false} />

                <XAxis
                  dataKey="q"
                  tick={{ fontSize: 8, fill: '#3E4046', fontFamily: 'monospace' }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  domain={[0, 9]}
                  tick={{ fontSize: 8, fill: '#3E4046', fontFamily: 'monospace' }}
                  axisLine={false} tickLine={false}
                  tickFormatter={v => `${v}%`}
                  ticks={[0, 2, 4, 6, 8]}
                />

                <Tooltip content={<ChartTooltip />} />

                {/* 2% inflation target */}
                <ReferenceLine
                  y={2}
                  stroke="rgba(255,255,255,0.15)"
                  strokeDasharray="4 4"
                />

                <Area
                  type="monotone"
                  dataKey="inflation"
                  stroke="#B41923"
                  strokeWidth={2}
                  fill="url(#ecoInflGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#B41923', stroke: 'rgba(180,25,35,0.3)', strokeWidth: 4 }}
                  isAnimationActive
                  animationDuration={1600}
                  animationEasing="ease-out"
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#C9A86A"
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{ r: 3, fill: '#C9A86A' }}
                  isAnimationActive
                  animationDuration={2000}
                  animationEasing="ease-out"
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Decision log ── */}
      <div style={{
        borderTop: '1px solid rgba(240,240,234,0.05)',
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap',
      }}>
        <span style={{ fontFamily: 'monospace', fontSize: '8px', color: '#3E4046', letterSpacing: '0.1em', marginRight: '4px' }}>
          JOURNAL DES DÉCISIONS
        </span>
        {DECISIONS.map(d => (
          <span key={d.q} style={{
            fontFamily: 'monospace', fontSize: '9px',
            color: d.color,
            backgroundColor: `${d.color}14`,
            padding: '2px 7px', borderRadius: '4px',
            border: `1px solid ${d.color}28`,
            letterSpacing: '0.02em',
            whiteSpace: 'nowrap',
          }}>
            {d.dir} {d.q} · {d.text}
          </span>
        ))}
      </div>
    </div>
  )
}
