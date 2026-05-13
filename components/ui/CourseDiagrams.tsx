'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceArea,
  ComposedChart, Area,
} from 'recharts'
import { Percent, TrendingDown, MessageSquare, Globe, ArrowRight, AlertTriangle } from 'lucide-react'

const AXIS = { fontSize: 8, fill: '#5E6066', fontFamily: 'monospace' }

function MiniTooltip({ active, payload, label, unit = '%' }: {
  active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string; unit?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      backgroundColor: '#0A0B0E', border: '1px solid rgba(240,240,234,0.12)',
      borderRadius: '5px', padding: '8px 10px', fontFamily: 'monospace', fontSize: '10px',
      boxShadow: '0 6px 24px rgba(0,0,0,0.7)',
    }}>
      {label && <p style={{ color: '#5E6066', marginBottom: '4px', fontSize: '8px', letterSpacing: '0.06em' }}>{label}</p>}
      {payload.map(e => (
        <p key={e.name} style={{ color: e.color, margin: '1px 0' }}>
          {e.name}: <strong>{e.value?.toFixed(2).replace('.', ',')}{unit}</strong>
        </p>
      ))}
    </div>
  )
}

function DiagramFrame({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{
      backgroundColor: 'var(--bg-elevated)', border: `1px solid ${color}22`,
      borderLeft: `3px solid ${color}`, borderRadius: '8px', padding: '14px', marginTop: '4px',
    }}>
      <p style={{ fontFamily: 'monospace', fontSize: '8px', color, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
        ▸ Visualisation
      </p>
      {children}
    </div>
  )
}

/* ── MODULE 01 : Score Breakdown ─────────────────────────────────────────── */
export function ScoreBreakdown() {
  const items = [
    { label: 'Stabilité des prix',  sublabel: 'π proche de 2 %',    pct: 35, color: '#B41923' },
    { label: 'Croissance du PIB',   sublabel: 'ỹ proche de 0 %',    pct: 25, color: '#4A9D7C' },
    { label: 'Crédibilité BAM',     sublabel: 'Anticipations ancrées', pct: 20, color: '#5C7E92' },
    { label: 'Emploi',              sublabel: 'u proche de u*',      pct: 10, color: '#C9A86A' },
    { label: 'Stabilité financière',sublabel: 'NPL < 10 %',          pct: 10, color: '#C25450' },
  ]
  return (
    <DiagramFrame title="Pondération du score" color="#B41923">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {items.map(item => (
          <div key={item.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</span>
                <span style={{ fontSize: '9px', color: 'var(--text-tertiary)', marginLeft: '6px' }}>· {item.sublabel}</span>
              </div>
              <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: item.color }}>{item.pct} pts</span>
            </div>
            <div style={{ height: '6px', backgroundColor: 'var(--bg-hover)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: '3px', transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)',
                width: `${(item.pct / 35) * 100}%`, backgroundColor: item.color, opacity: 0.85,
              }} />
            </div>
          </div>
        ))}
      </div>
      <p style={{ fontFamily: 'monospace', fontSize: '9px', color: 'var(--text-tertiary)', marginTop: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
        Un output gap de ±1 % pendant 4 trimestres coûte ~8 pts. Une inflation &gt; 4 % coûte 20+ pts.
      </p>
    </DiagramFrame>
  )
}

/* ── MODULE 02 : Transmission Chain ─────────────────────────────────────── */
export function TransmissionChain() {
  const steps = [
    { label: 'i*', sublabel: 'Décision BAM', color: '#B41923', delay: 'T+0' },
    { label: 'TMP', sublabel: 'Marché interbancaire', color: '#C25450', delay: '+1T' },
    { label: 'i^D', sublabel: 'Taux débiteur', color: '#C9A86A', delay: '+2T' },
    { label: 'Crédit', sublabel: 'Volume bancaire', color: '#A68A4F', delay: '+3T' },
    { label: 'Demande', sublabel: 'Output gap', color: '#5C7E92', delay: '+4T' },
    { label: 'π', sublabel: 'Inflation', color: '#4A9D7C', delay: '+5T' },
  ]
  return (
    <DiagramFrame title="Canal des taux — délais de transmission" color="#B41923">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0', overflowX: 'auto', paddingBottom: '4px' }}>
        {steps.map((step, i) => (
          <div key={step.label} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <div style={{
                padding: '6px 10px', borderRadius: '6px', border: `1px solid ${step.color}40`,
                backgroundColor: `${step.color}14`, minWidth: '52px', textAlign: 'center',
              }}>
                <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: step.color }}>{step.label}</span>
              </div>
              <span style={{ fontFamily: 'monospace', fontSize: '7px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', textAlign: 'center', maxWidth: '60px' }}>{step.sublabel}</span>
              <span style={{ fontFamily: 'monospace', fontSize: '8px', color: step.color, fontWeight: 700 }}>{step.delay}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 4px', marginBottom: '22px' }}>
                <ArrowRight size={14} style={{ color: 'var(--text-tertiary)' }} />
                <span style={{ fontFamily: 'monospace', fontSize: '7px', color: 'var(--text-tertiary)' }}>λ=0,35</span>
              </div>
            )}
          </div>
        ))}
      </div>
      <p style={{ fontFamily: 'monospace', fontSize: '9px', color: 'var(--text-tertiary)', marginTop: '10px', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
        λ = 0,35 : seulement 35 % d'une hausse de BAM est transmise au taux débiteur après 2 trimestres au Maroc. Anticipez toujours 2 trimestres en avance.
      </p>
    </DiagramFrame>
  )
}

/* ── MODULE 03 : IS Curve ────────────────────────────────────────────────── */
const IS_DATA = [
  { rate: 0.5, gap: 2.4 },
  { rate: 1.0, gap: 1.7 },
  { rate: 1.5, gap: 1.0 },
  { rate: 2.0, gap: 0.4 },
  { rate: 2.5, gap: 0.0 },
  { rate: 3.0, gap: -0.6 },
  { rate: 3.5, gap: -1.1 },
  { rate: 4.0, gap: -1.7 },
  { rate: 5.0, gap: -2.4 },
]

export function ISCurveDiagram() {
  return (
    <DiagramFrame title="Courbe IS — Taux réel vs Output gap" color="#4A9D7C">
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={IS_DATA} margin={{ top: 8, right: 12, left: -14, bottom: 0 }}>
          <defs>
            <linearGradient id="isGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4A9D7C" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#4A9D7C" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(240,240,234,0.05)" vertical={false} />
          <XAxis dataKey="rate" tick={AXIS} axisLine={false} tickLine={false}
            label={{ value: 'Taux réel r (%)', position: 'insideBottomRight', offset: -6, style: { ...AXIS, fill: '#5E6066' } }}
            tickFormatter={v => `${v}%`} />
          <YAxis tick={AXIS} axisLine={false} tickLine={false}
            label={{ value: 'Output gap ỹ', angle: -90, position: 'insideLeft', style: { ...AXIS, fill: '#5E6066' } }}
            tickFormatter={v => `${v}%`} />
          <Tooltip content={<MiniTooltip />} />
          <ReferenceArea y1={-1.5} y2={1.5} fill="#4A9D7C" fillOpacity={0.05} strokeOpacity={0} />
          <ReferenceLine y={0} stroke="rgba(240,240,234,0.12)" strokeDasharray="3 3"
            label={{ value: 'ỹ=0', position: 'insideRight', style: AXIS }} />
          <ReferenceLine x={2.5} stroke="rgba(201,168,106,0.3)" strokeDasharray="3 3"
            label={{ value: 'r*=2,5%', position: 'insideTop', style: { ...AXIS, fill: '#C9A86A' } }} />
          <Area type="monotone" dataKey="gap" name="Output gap" stroke="#4A9D7C" strokeWidth={2.5}
            fill="url(#isGrad)" dot={false}
            activeDot={{ r: 4, fill: '#4A9D7C', stroke: 'rgba(74,157,124,0.3)', strokeWidth: 4 }} />
        </ComposedChart>
      </ResponsiveContainer>
      <p style={{ fontFamily: 'monospace', fontSize: '9px', color: 'var(--text-tertiary)', marginTop: '8px' }}>
        La zone verte (ỹ ∈ [−1,5 %; +1,5 %]) est la "zone de confort". En dehors, risque inflationniste ou recessif.
      </p>
    </DiagramFrame>
  )
}

/* ── MODULE 04 : Phillips Curve ──────────────────────────────────────────── */
const PHILLIPS_DATA = [
  { gap: -3.0, inflation: 1.10 },
  { gap: -2.0, inflation: 1.45 },
  { gap: -1.0, inflation: 1.75 },
  { gap: 0.0,  inflation: 2.00 },
  { gap: 1.0,  inflation: 2.25 },
  { gap: 2.0,  inflation: 2.60 },
  { gap: 3.0,  inflation: 3.10 },
  { gap: 4.0,  inflation: 3.90 },
  { gap: 5.0,  inflation: 5.00 },
]

export function PhillipsCurveDiagram() {
  return (
    <DiagramFrame title="Courbe de Phillips — Output gap vs Inflation" color="#4A9D7C">
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={PHILLIPS_DATA} margin={{ top: 8, right: 12, left: -14, bottom: 0 }}>
          <defs>
            <linearGradient id="phiGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#B41923" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#B41923" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(240,240,234,0.05)" vertical={false} />
          <XAxis dataKey="gap" tick={AXIS} axisLine={false} tickLine={false}
            tickFormatter={v => `${v}%`}
            label={{ value: 'Output gap ỹ (%)', position: 'insideBottomRight', offset: -6, style: { ...AXIS, fill: '#5E6066' } }} />
          <YAxis tick={AXIS} axisLine={false} tickLine={false}
            tickFormatter={v => `${v}%`}
            label={{ value: 'Inflation π', angle: -90, position: 'insideLeft', style: { ...AXIS, fill: '#5E6066' } }} />
          <Tooltip content={<MiniTooltip />} />
          <ReferenceArea y1={1.5} y2={2.5} fill="#4A9D7C" fillOpacity={0.08} strokeOpacity={0} />
          <ReferenceLine y={2} stroke="#4A9D7C" strokeDasharray="4 4" strokeOpacity={0.5}
            label={{ value: 'π* = 2%', position: 'insideTopRight', style: { ...AXIS, fill: '#4A9D7C' } }} />
          <ReferenceLine x={0} stroke="rgba(240,240,234,0.10)" strokeDasharray="3 3" />
          <Area type="monotone" dataKey="inflation" name="Inflation" stroke="#B41923" strokeWidth={2.5}
            fill="url(#phiGrad)" dot={false}
            activeDot={{ r: 4, fill: '#B41923', stroke: 'rgba(180,25,35,0.3)', strokeWidth: 4 }} />
        </ComposedChart>
      </ResponsiveContainer>
      <p style={{ fontFamily: 'monospace', fontSize: '9px', color: 'var(--text-tertiary)', marginTop: '8px' }}>
        κ = 0,15 : chaque point d'output gap génère +0,15 pt d'inflation. La courbe s'aplatit près de la cible (zone verte).
      </p>
    </DiagramFrame>
  )
}

/* ── MODULE 05 : Channels Diagram ────────────────────────────────────────── */
export function ChannelsDiagram() {
  const channels = [
    {
      icon: Percent,
      title: 'Canal des taux',
      desc: 'i* ↑ → i^D ↑ → Crédit cher → Investissement ↓ → Demande ↓ → π ↓',
      lag: '4–6 trimestres',
      color: '#B41923',
      strength: 'Principal',
    },
    {
      icon: AlertTriangle,
      title: 'Canal du crédit',
      desc: 'i* ↑ → NPL ↑ → Banques rationnent → Crédit ↓ même si taux inchangé',
      lag: '2–4 trimestres',
      color: '#C9A86A',
      strength: 'Modéré',
    },
    {
      icon: Globe,
      title: 'Canal du change',
      desc: "i* ↑ → Entrées capitaux → MAD s'apprécie → Import < chers → π ↓",
      lag: '2–3 trimestres',
      color: '#5C7E92',
      strength: 'Limité (MAD géré)',
    },
    {
      icon: MessageSquare,
      title: 'Canal des anticipations',
      desc: 'Communication hawkish → π^e ↓ → π ↓ sans bouger i* (Forward Guidance)',
      lag: 'Immédiat',
      color: '#4A9D7C',
      strength: 'Puissant si crédible',
    },
  ]
  return (
    <DiagramFrame title="Les 4 canaux de transmission" color="#C9A86A">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {channels.map(ch => {
          const Icon = ch.icon
          return (
            <div key={ch.title} style={{
              padding: '10px', borderRadius: '6px',
              backgroundColor: `${ch.color}0C`, border: `1px solid ${ch.color}22`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
                <Icon size={11} style={{ color: ch.color, flexShrink: 0 }} />
                <span style={{ fontSize: '10px', fontWeight: 700, color: ch.color }}>{ch.title}</span>
              </div>
              <p style={{ fontSize: '9px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '5px' }}>{ch.desc}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '7px', color: 'var(--text-tertiary)' }}>Délai : {ch.lag}</span>
                <span style={{ fontFamily: 'monospace', fontSize: '7px', color: ch.color }}>{ch.strength}</span>
              </div>
            </div>
          )
        })}
      </div>
    </DiagramFrame>
  )
}

/* ── MODULE 06 : Taylor Rule Chart ──────────────────────────────────────── */
const TAYLOR_DATA = [
  { inflation: 0,   taylor: 0.50 },
  { inflation: 1,   taylor: 2.00 },
  { inflation: 2,   taylor: 3.50 },
  { inflation: 3,   taylor: 5.00 },
  { inflation: 4,   taylor: 6.50 },
  { inflation: 5,   taylor: 8.00 },
  { inflation: 6,   taylor: 9.50 },
  { inflation: 8,   taylor: 12.50 },
]

const TAYLOR_POINTS = [
  { inflation: 6.1, bam: 3.0,  label: 'BAM 2022' },
  { inflation: 2.0, bam: 2.75, label: 'BAM 2024' },
]

export function TaylorRuleChart() {
  return (
    <DiagramFrame title="Règle de Taylor — Taux optimal vs inflation" color="#C9A86A">
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={TAYLOR_DATA} margin={{ top: 8, right: 12, left: -14, bottom: 0 }}>
          <defs>
            <linearGradient id="taylorGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#C9A86A" stopOpacity={0.22} />
              <stop offset="95%" stopColor="#C9A86A" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(240,240,234,0.05)" vertical={false} />
          <XAxis dataKey="inflation" tick={AXIS} axisLine={false} tickLine={false}
            tickFormatter={v => `${v}%`}
            label={{ value: 'Inflation π (%)', position: 'insideBottomRight', offset: -6, style: { ...AXIS, fill: '#5E6066' } }} />
          <YAxis tick={AXIS} axisLine={false} tickLine={false}
            tickFormatter={v => `${v}%`}
            label={{ value: 'Taux Taylor i*', angle: -90, position: 'insideLeft', style: { ...AXIS, fill: '#5E6066' } }} />
          <Tooltip content={<MiniTooltip />} />
          {/* ZLB */}
          <ReferenceLine y={0.5} stroke="rgba(92,126,146,0.4)" strokeDasharray="4 4"
            label={{ value: 'ZLB 0,5%', position: 'insideTopRight', style: { ...AXIS, fill: '#5C7E92' } }} />
          {/* BAM 2022 */}
          <ReferenceLine y={3.0} stroke="rgba(180,25,35,0.35)" strokeDasharray="3 3"
            label={{ value: 'BAM 2022 (3%)', position: 'insideTopLeft', style: { ...AXIS, fill: '#B41923' } }} />
          <Area type="monotone" dataKey="taylor" name="Taux de Taylor" stroke="#C9A86A" strokeWidth={2.5}
            fill="url(#taylorGrad)" dot={false}
            activeDot={{ r: 4, fill: '#C9A86A', stroke: 'rgba(201,168,106,0.3)', strokeWidth: 4 }} />
        </ComposedChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
        {TAYLOR_POINTS.map(pt => (
          <div key={pt.label} style={{
            padding: '5px 8px', borderRadius: '4px',
            backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-subtle)',
          }}>
            <span style={{ fontFamily: 'monospace', fontSize: '8px', color: 'var(--text-tertiary)' }}>
              {pt.label} : π={pt.inflation}% →{' '}
              <span style={{ color: '#C9A86A', fontWeight: 700 }}>Taylor={((0.5 + 1.5 * pt.inflation)).toFixed(1)}%</span>
              {' '}vs BAM={pt.bam}%
            </span>
          </div>
        ))}
      </div>
    </DiagramFrame>
  )
}

/* ── MODULE 07 : Shock Matrix ────────────────────────────────────────────── */
export function ShockMatrix() {
  const cells = [
    {
      label: "Choc d'offre positif",
      example: 'Bonne récolte agricole, tech',
      effect: 'π ↓ · ỹ ↑',
      response: 'Assouplir légèrement',
      color: '#4A9D7C',
      bg: 'rgba(74,157,124,0.08)',
    },
    {
      label: 'Choc de demande positif',
      example: 'Boom zone euro, IDE',
      effect: 'π ↑ · ỹ ↑',
      response: 'Resserrer prudemment',
      color: '#C9A86A',
      bg: 'rgba(201,168,106,0.08)',
    },
    {
      label: "Choc d'offre négatif ⚠",
      example: 'Pétrole, sécheresse, COVID',
      effect: 'π ↑ · ỹ ↓  →  Dilemme',
      response: 'Mesure — ne pas sur-réagir',
      color: '#C25450',
      bg: 'rgba(194,84,80,0.10)',
    },
    {
      label: 'Choc de demande négatif',
      example: 'Récession UE, COVID 2020',
      effect: 'π ↓ · ỹ ↓',
      response: 'Assouplir nettement',
      color: '#5C7E92',
      bg: 'rgba(92,126,146,0.08)',
    },
  ]

  return (
    <DiagramFrame title="Matrice des chocs macroéconomiques" color="#C25450">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        {cells.map(cell => (
          <div key={cell.label} style={{
            padding: '10px', borderRadius: '6px',
            backgroundColor: cell.bg, border: `1px solid ${cell.color}28`,
          }}>
            <p style={{ fontSize: '10px', fontWeight: 700, color: cell.color, marginBottom: '4px' }}>{cell.label}</p>
            <p style={{ fontFamily: 'monospace', fontSize: '8px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>{cell.example}</p>
            <p style={{ fontFamily: 'monospace', fontSize: '10px', color: cell.color, fontWeight: 600, marginBottom: '4px' }}>{cell.effect}</p>
            <p style={{ fontSize: '9px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>{cell.response}</p>
          </div>
        ))}
      </div>
      <p style={{ fontFamily: 'monospace', fontSize: '9px', color: 'var(--text-tertiary)', marginTop: '10px' }}>
        Le choc d'offre négatif est le pire des cas : resserrer aggrave la récession, assouplir aggrave l'inflation.
      </p>
    </DiagramFrame>
  )
}

/* ── MODULE 08 : NPL Risk Zones ─────────────────────────────────────────── */
export function NplRiskZones() {
  const zones = [
    { range: '> 15 %',   label: 'CRITIQUE',    desc: 'Krach bancaire · Krach du crédit', color: '#C25450', pct: 100 },
    { range: '12–15 %',  label: 'DANGER',      desc: 'Canal bloqué · Debt-deflation trap', color: '#E8914A', pct: 80 },
    { range: '8–12 %',   label: 'SURVEILLANCE',desc: 'Surveillance renforcée · CCyB recommandé', color: '#C9A86A', pct: 55 },
    { range: '5–8 %',    label: 'NORMAL',       desc: 'Zone de sécurité · Transmission normale', color: '#4A9D7C', pct: 28 },
    { range: '< 5 %',    label: 'OPTIMAL',      desc: 'Secteur bancaire très sain', color: '#4A9D7C', pct: 14 },
  ]

  return (
    <DiagramFrame title="Zones de risque NPL (Non-Performing Loans)" color="#5C7E92">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {zones.map(zone => (
          <div key={zone.range} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontFamily: 'monospace', fontSize: '9px', fontWeight: 700, color: zone.color, width: '48px', flexShrink: 0 }}>
              {zone.range}
            </span>
            <div style={{ flex: 1, height: '20px', backgroundColor: 'var(--bg-hover)', borderRadius: '3px', overflow: 'hidden', position: 'relative' }}>
              <div style={{
                position: 'absolute', inset: 0,
                width: `${zone.pct}%`, backgroundColor: `${zone.color}28`,
                borderRight: `2px solid ${zone.color}60`,
              }} />
              <div style={{
                position: 'absolute', inset: '0 0 0 4px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '8px',
              }}>
                <span style={{ fontFamily: 'monospace', fontSize: '8px', color: zone.color, fontWeight: 700, letterSpacing: '0.06em' }}>
                  {zone.label}
                </span>
                <span style={{ fontFamily: 'monospace', fontSize: '8px', color: 'var(--text-tertiary)' }}>
                  {zone.desc}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p style={{ fontFamily: 'monospace', fontSize: '9px', color: 'var(--text-tertiary)', marginTop: '10px', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
        Maroc 2023 : NPL ≈ 8,9 % — zone de surveillance. Le simulateur déclenche l'alerte rouge à 12 % + π &lt; 0.
      </p>
    </DiagramFrame>
  )
}
