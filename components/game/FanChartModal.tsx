'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { X, LineChart as ChartIcon } from 'lucide-react'
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ReferenceLine, ReferenceArea, ResponsiveContainer
} from 'recharts'
import { BlockKatex } from '@/components/ui/InlineKatex'
import type { FanChartPoint } from '@/engine/monteCarlo'

interface FanChartModalProps {
  isOpen: boolean
  onClose: () => void
  data: FanChartPoint[]
}

const AXIS_STYLE = { fontSize: 9, fill: 'var(--text-tertiary)', fontFamily: 'monospace' }

export function FanChartModal({ isOpen, onClose, data }: FanChartModalProps) {
  if (!isOpen) return null

  // Custom Tooltip for the Fan Chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null

    const point = payload[0].payload as FanChartPoint

    return (
      <div
        className="rounded border p-3 shadow-2xl min-w-[200px] transition-colors duration-200"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          borderColor: 'var(--border-strong)',
          fontFamily: 'monospace',
          fontSize: '11px',
        }}
      >
        <p className="text-[9px] uppercase tracking-wider mb-2 font-semibold" style={{ color: 'var(--text-tertiary)' }}>
          {label} {point.isForecast ? '· PREVISION' : '· HISTORIQUE'}
        </p>

        {point.isForecast ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <span style={{ color: 'var(--accent-primary)' }}>Médiane (50th)</span>
              <span className="font-bold text-[var(--text-primary)]">{point.median.toFixed(2)} %</span>
            </div>
            <div className="flex justify-between items-center" style={{ color: 'var(--accent-cool)' }}>
              <span>Intervalle 50%</span>
              <span className="font-semibold text-[var(--text-primary)]">
                [{point.p50[0].toFixed(2)} ; {point.p50[1].toFixed(2)}] %
              </span>
            </div>
            <div className="flex justify-between items-center" style={{ color: 'var(--accent-warm)' }}>
              <span>Intervalle 90%</span>
              <span className="font-semibold text-[var(--text-primary)]">
                [{point.p90[0].toFixed(2)} ; {point.p90[1].toFixed(2)}] %
              </span>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-center">
            <span style={{ color: 'var(--text-secondary)' }}>Inflation réelle</span>
            <span className="font-bold text-[var(--text-primary)]">{point.inflation.toFixed(2)} %</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Background overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-4xl rounded-lg overflow-hidden border shadow-2xl flex flex-col md:flex-row max-h-[90vh] md:max-h-[80vh]"
        style={{
          backgroundColor: 'var(--bg-panel)',
          borderColor: 'var(--border-strong)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}
      >
        {/* Left Side: Chart (Premium Glassmorphism Viewport) */}
        <div className="flex-1 p-6 flex flex-col gap-4 border-b md:border-b-0 md:border-r border-[var(--border-subtle)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChartIcon size={16} className="text-[var(--accent-primary)] animate-pulse-soft" />
              <span className="label-caps font-bold tracking-widest text-[11px] text-[var(--accent-primary)]">
                Graphique en éventail · Inflation (Monte-Carlo)
              </span>
            </div>
          </div>

          {/* Chart viewport */}
          <div className="flex-1 w-full min-h-[250px] md:min-h-[320px] bg-[var(--bg-base)] rounded-md border border-[var(--border-subtle)] p-2 relative flex items-center justify-center transition-colors duration-200">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
                <CartesianGrid stroke="var(--border-subtle)" vertical={false} />
                <XAxis dataKey="quarterLabel" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border-default)' }} />

                {/* Inflation target band */}
                <ReferenceArea y1={1.5} y2={2.5} fill="#B41923" fillOpacity={0.03} strokeOpacity={0} />
                <ReferenceLine y={2} stroke="#B41923" strokeDasharray="3 3" opacity={0.25} />

                {/* Separator between History and Forecast */}
                {data.find(d => d.isForecast) && (
                  <ReferenceLine
                    x={data.find(d => d.isForecast)?.quarterLabel}
                    stroke="var(--border-strong)"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                  />
                )}

                {/* 90% Confidence Interval Area (Lightest red/accent) */}
                <Area
                  type="monotone"
                  dataKey="p90"
                  stroke="none"
                  fill="var(--accent-primary)"
                  fillOpacity={0.10}
                  connectNulls
                  name="Intervalle 90%"
                />

                {/* 50% Confidence Interval Area (Medium red/accent) */}
                <Area
                  type="monotone"
                  dataKey="p50"
                  stroke="none"
                  fill="var(--accent-primary)"
                  fillOpacity={0.22}
                  connectNulls
                  name="Intervalle 50%"
                />

                {/* Median path */}
                <Line
                  type="monotone"
                  dataKey="median"
                  stroke="var(--accent-primary)"
                  strokeWidth={2}
                  dot={(props) => {
                    const { cx, cy, payload } = props
                    if (!payload.isForecast) {
                      return <circle cx={cx} cy={cy} r={3} fill="var(--accent-primary)" stroke="none" />
                    }
                    return <circle cx={cx} cy={cy} r={3} fill="var(--bg-base)" stroke="var(--accent-primary)" strokeWidth={1.5} />
                  }}
                  name="Inflation médiane"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Chart Legend */}
          <div className="flex gap-4 flex-wrap justify-center text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-3 inline-block rounded" style={{ backgroundColor: 'var(--accent-primary)', opacity: 0.1 }} />
              <span>Intervalle 90%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-3 inline-block rounded" style={{ backgroundColor: 'var(--accent-primary)', opacity: 0.22 }} />
              <span>Intervalle 50%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 inline-block" style={{ backgroundColor: 'var(--accent-primary)' }} />
              <span>Médiane</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: 'var(--accent-primary)' }} />
              <span>Historique</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full inline-block border border-[var(--accent-primary)] bg-[var(--bg-base)]" />
              <span>Projection stochastique</span>
            </div>
          </div>
        </div>

        {/* Right Side: Educational details (Bloomberg style layout) */}
        <div className="w-full md:w-[320px] p-6 flex flex-col justify-between overflow-y-auto max-h-[350px] md:max-h-none">
          <div className="flex flex-col gap-4 text-left">
            <div>
              <h3 className="font-editorial text-lg text-[var(--text-primary)] leading-tight mb-1">
                Analyse Prédictive de Monte-Carlo
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Modèle de prévision dynamique aligné v5
              </p>
            </div>

            <SectionDivider />

            <div className="text-xs space-y-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              <p>
                Ce graphique en éventail (<strong>Fan Chart</strong>) illustre le degré d&apos;incertitude entourant l&apos;inflation future sur les 4 prochains trimestres. 
              </p>
              <p>
                L&apos;algorithme exécute <strong>100 scénarios asynchrones</strong> en appliquant un bruit gaussien de choc d&apos;offre ($u^\pi_t$) et de demande ($u^y_t$) autour de la dynamique IS/Phillips du moteur :
              </p>
              
              <BlockKatex math="u^\pi_{t+h} \sim \mathcal{N}(0; \, 0.4^2) \quad u^y_{t+h} \sim \mathcal{N}(0; \, 0.5^2)" />
              <BlockKatex math="\pi_{t+h} = c_\pi + a\pi_{t+h-1} + \kappa \tilde{y}_{t+h-1} + 0.20(\pi^e_{t+h-1}-2) + 0.12\Delta e_{t+h} + u^\pi_{t+h}" />

              <p>
                La zone la plus sombre au centre (<strong>Intervalle 50%</strong>) correspond aux percentiles 25 à 75. Elle indique que l&apos;inflation a une probabilité de 1 sur 2 de s&apos;y stabiliser. La zone plus claire (<strong>90%</strong>) couvre un spectre quasi-total d&apos;occurrences.
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded label-caps flex items-center justify-center gap-1.5 font-semibold text-xs transition-colors"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-primary)'; (e.currentTarget as HTMLElement).style.color = 'var(--accent-primary)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)' }}
            >
              Fermer l&apos;analyse
            </button>
          </div>
        </div>

        {/* Close Button (top-right) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-1 rounded hover:bg-[var(--bg-hover)] transition-colors"
          aria-label="Fermer"
        >
          <X size={16} />
        </button>
      </motion.div>
    </div>
  )
}

function SectionDivider() {
  return <div className="h-[1px] w-full" style={{ backgroundColor: 'var(--border-subtle)' }} />
}
