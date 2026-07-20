'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Play, RotateCcw, Sliders,
  LineChart as ChartIcon, HelpCircle, AlertTriangle, CloudRain, ShieldAlert, Zap,
  GraduationCap, LayoutDashboard, Users, LogOut, FileText, Calendar, Award
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot,
  ComposedChart, Area, ReferenceArea
} from 'recharts'
import { InlineKatex, BlockKatex, LatexText, MarkdownText } from '@/components/ui/InlineKatex'
import { ThemeToggle } from '@/components/shell/ThemeToggle'
import { AssistantBot } from '@/components/ui/AssistantBot'
import { sound } from '@/lib/audio'
import { useAuthStore } from '@/store/authStore'
import { useGameStore } from '@/store/gameStore'
import { CAMPAIGNS } from '@/engine/campaigns'
import { PARAMS } from '@/engine/parameters'

const AXIS_STYLE = { fontSize: 10, fill: 'var(--text-tertiary)', fontFamily: 'monospace' }

function nextGaussian(mean = 0, stdDev = 1): number {
  const u = 1 - Math.random()
  const v = Math.random()
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
  return z * stdDev + mean
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
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
        {label} {point.isForecast ? '· PREVISION' : '· ACTUEL/HISTORIQUE'}
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

// ── SUB-COMPONENT: LABORATOIRE SANDBOX ──
function LabView() {
  const [viewMode, setViewMode] = useState<'curves' | 'fanchart'>('curves')

  // Structural Parameters (Synchronized with engine calibration PARAMS)
  const [kappa, setKappa] = useState<number>(PARAMS.kappa) // Phillips sensitivity
  const [sigma, setSigma] = useState<number>(PARAMS.sigma) // IS elasticity
  const [delta, setDelta] = useState<number>(PARAMS.delta) // openness degree
  const [beta, setBeta] = useState<number>(PARAMS.beta)   // expectations weight

  // Policy Instruments
  const [policyRate, setPolicyRate] = useState(2.75) // Central bank TMP

  // Economic Variables & Shocks
  const [inflationExpected, setInflationExpected] = useState(2.0)
  const [outputGapPrev, setOutputGapPrev] = useState(0.0)
  const [inflationPrev, setInflationPrev] = useState(2.2)
  const [externalDemand, setExternalDemand] = useState(0.0) // global GDP gap
  const [demandShock, setDemandShock] = useState(0.0)       // u^y
  const [supplyShock, setSupplyShock] = useState(0.0)       // u^pi
  const [agriShock, setAgriShock] = useState(0.0)           // agriculture shock

  // Math Calculations (Real-Time State)
  const lendingRate = useMemo(() => policyRate + 2.45, [policyRate])
  const realRate = useMemo(() => lendingRate - inflationExpected, [lendingRate, inflationExpected])

  const outputGap = useMemo(() => {
    return 0.70 * outputGapPrev - sigma * realRate + delta * externalDemand + demandShock
  }, [outputGapPrev, sigma, realRate, delta, externalDemand, demandShock])

  const inflation = useMemo(() => {
    return beta * inflationExpected + kappa * outputGap + 0.20 * agriShock + supplyShock
  }, [beta, inflationExpected, kappa, outputGap, agriShock, supplyShock])

  // Curves coordinates generation
  const isCurveData = useMemo(() => {
    const pts = []
    for (let y = -4; y <= 4; y += 0.5) {
      const iD = inflationExpected + (0.7 * outputGapPrev + delta * externalDemand + demandShock - y) / sigma
      pts.push({
        outputGap: y,
        lendingRate: Math.max(0, Math.min(15, iD)),
      })
    }
    return pts
  }, [inflationExpected, outputGapPrev, delta, externalDemand, demandShock, sigma])

  const pcCurveData = useMemo(() => {
    const pts = []
    for (let y = -4; y <= 4; y += 0.5) {
      const pi = beta * inflationExpected + kappa * y + 0.20 * agriShock + supplyShock
      pts.push({
        outputGap: y,
        inflation: pi,
      })
    }
    return pts
  }, [beta, inflationExpected, kappa, agriShock, supplyShock])

  const fanChartData = useMemo(() => {
    const runsCount = 100
    const forecastHorizon = 4
    const SIGMA_INFLATION = 0.4
    const SIGMA_OUTPUT_GAP = 0.5

    const paths: number[][] = Array.from({ length: runsCount }, () => [])

    for (let run = 0; run < runsCount; run++) {
      let simOutputGapPrev = outputGap
      let simInflationExpected = inflationExpected
      let simDemandShock = demandShock
      let simSupplyShock = supplyShock
      let simAgriShock = agriShock

      for (let h = 0; h < forecastHorizon; h++) {
        const supplyNoise = nextGaussian(0, SIGMA_INFLATION)
        const demandNoise = nextGaussian(0, SIGMA_OUTPUT_GAP)

        const totalDemandShock = simDemandShock * 0.6 + demandNoise
        const totalSupplyShock = simSupplyShock * 0.6 + supplyNoise
        const totalAgriShock = simAgriShock * 0.5

        const simLendingRate = policyRate + 2.45
        const simRealRate = simLendingRate - simInflationExpected

        const simOutputGap = 0.70 * simOutputGapPrev - sigma * simRealRate + delta * externalDemand + totalDemandShock
        const simInflation = beta * simInflationExpected + kappa * simOutputGap + 0.20 * totalAgriShock + totalSupplyShock

        paths[run].push(simInflation)

        simInflationExpected = 0.8 * simInflationExpected + 0.2 * simInflation
        simOutputGapPrev = simOutputGap
        simDemandShock = simDemandShock * 0.6
        simSupplyShock = simSupplyShock * 0.6
        simAgriShock = simAgriShock * 0.5
      }
    }

    const forecastPoints = []
    for (let h = 0; h < forecastHorizon; h++) {
      const values = paths.map(p => p[h])
      values.sort((a, b) => a - b)

      const p5 = values[4]
      const p95 = values[94]
      const p25 = values[24]
      const p75 = values[74]
      const median = values[49]

      forecastPoints.push({
        quarterLabel: `T+${h + 1}`,
        isForecast: true,
        inflation: median,
        p50: [p25, p75] as [number, number],
        p90: [p5, p95] as [number, number],
        median: median,
      })
    }

    const historyPoints = [
      {
        quarterLabel: 'T-1',
        isForecast: false,
        inflation: inflationPrev,
        p50: [inflationPrev, inflationPrev] as [number, number],
        p90: [inflationPrev, inflationPrev] as [number, number],
        median: inflationPrev,
      },
      {
        quarterLabel: 'T (Actuel)',
        isForecast: false,
        inflation: inflation,
        p50: [inflation, inflation] as [number, number],
        p90: [inflation, inflation] as [number, number],
        median: inflation,
      }
    ]

    return [...historyPoints, ...forecastPoints]
  }, [
    outputGap, inflation, inflationExpected, inflationPrev, demandShock, supplyShock,
    agriShock, policyRate, sigma, delta, externalDemand, beta, kappa
  ])

  const handleSimulateStep = () => {
    setOutputGapPrev(outputGap)
    setInflationPrev(inflation)
    setInflationExpected(prev => 0.8 * prev + 0.2 * inflation)
    setDemandShock(prev => prev * 0.6)
    setSupplyShock(prev => prev * 0.6)
    setAgriShock(prev => prev * 0.5)
  }

  const handleReset = () => {
    setKappa(0.15)
    setSigma(0.12)
    setDelta(0.30)
    setBeta(0.95)
    setPolicyRate(2.75)
    setInflationExpected(2.0)
    setOutputGapPrev(0.0)
    setInflationPrev(2.2)
    setExternalDemand(0.0)
    setDemandShock(0.0)
    setSupplyShock(0.0)
    setAgriShock(0.0)
    setViewMode('curves')
  }

  const triggerDemandShock = () => {
    setDemandShock(2.0)
    sound.playTick()
  }

  const triggerSupplyShock = () => {
    setSupplyShock(3.0)
    sound.playTick()
  }

  const triggerAgriShock = () => {
    setAgriShock(-2.5)
    sound.playTick()
  }

  const [isShaking, setIsShaking] = useState(false)
  const [flashColor, setFlashColor] = useState<string | null>(null)

  const shakeVariants = {
    shake: {
      x: [0, -12, 12, -12, 12, -6, 6, -3, 3, 0],
      y: [0, 6, -6, 6, -6, 3, -3, 1, -1, 0],
      transition: { duration: 0.55 }
    },
    idle: {}
  }

  const triggerDisaster = (type: 'drought' | 'flight' | 'oil') => {
    setIsShaking(true)
    sound.playAlert()
    
    if (type === 'drought') {
      setFlashColor('rgba(194, 84, 80, 0.25)')
      setAgriShock(-6.0)
      setSupplyShock(4.5)
    } else if (type === 'flight') {
      setFlashColor('rgba(201, 168, 106, 0.25)')
      setDemandShock(-4.0)
      setSupplyShock(2.5)
    } else if (type === 'oil') {
      setFlashColor('rgba(180, 25, 35, 0.25)')
      setSupplyShock(6.5)
      setDemandShock(-1.5)
    }

    setTimeout(() => {
      setIsShaking(false)
      setFlashColor(null)
    }, 600)
  }

  return (
    <motion.div
      variants={shakeVariants}
      animate={isShaking ? 'shake' : 'idle'}
      className="flex flex-col lg:flex-row gap-6 relative"
    >
      {/* Ambient disaster flash overlay */}
      {flashColor && (
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none rounded-xl transition-all duration-300"
          style={{ backgroundColor: flashColor, zIndex: 10 }}
        />
      )}

      {/* ── LEFT: INTERACTIVE SLIDERS PANEL ── */}
      <section
        className="w-full lg:w-[350px] border border-[var(--border-default)] rounded-lg p-5 flex flex-col gap-6 bg-[var(--bg-panel)] transition-colors duration-200"
        style={{ zIndex: 2 }}
      >
        <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="flex items-center gap-2 text-[var(--accent-primary)]">
            <Sliders size={16} />
            <h2 className="text-xs uppercase font-mono tracking-wider font-bold">Panneau de Contrôle</h2>
          </div>
          <button
            onClick={handleReset}
            className="px-2.5 py-1 rounded text-[10px] font-semibold font-mono border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] transition-colors flex items-center gap-1"
          >
            <RotateCcw size={10} /> RESET
          </button>
        </div>

        {/* 1. Instruments de Politique */}
        <div className="flex flex-col gap-4">
          <h3 className="text-[10px] tracking-widest uppercase font-mono text-[var(--text-tertiary)] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" />
            1. Levier Monétaire Directeur
          </h3>

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-[var(--text-primary)]">
                <LatexText text="Taux directeur ($i^*_t$)" />
              </span>
              <span className="font-bold text-[var(--accent-primary)] font-mono">{policyRate.toFixed(2)} %</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="8.0"
              step="0.25"
              value={policyRate}
              onChange={e => setPolicyRate(parseFloat(e.target.value))}
              className="slider w-full accent-[#B41923]"
            />
            <div className="flex justify-between text-[9px] text-[var(--text-tertiary)] font-mono">
              <span>0.5% (Accommodant)</span>
              <span>8.0% (Restrictif)</span>
            </div>
          </div>
        </div>

        {/* 2. Paramètres Structurels */}
        <div className="flex flex-col gap-4 border-t pt-4" style={{ borderColor: 'var(--border-subtle)' }}>
          <h3 className="text-[10px] tracking-widest uppercase font-mono text-[var(--text-tertiary)] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <LatexText text="2. Paramètres Élastiques ($IS$ & $PC$)" />
          </h3>

          {/* Elasticity IS (sigma) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-[var(--text-primary)]">
                <LatexText text="Élasticité $IS$ ($\\sigma$)" />
              </span>
              <span className="font-bold text-emerald-500 font-mono">{sigma.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.02"
              max="0.50"
              step="0.01"
              value={sigma}
              onChange={e => setSigma(parseFloat(e.target.value))}
              className="slider w-full accent-emerald-500"
            />
            <div className="text-[9px] text-[var(--text-tertiary)] font-mono leading-tight">
              Aplatit la droite de demande (Sensibilité au coût du crédit réel).
            </div>
          </div>

          {/* Phillips Slope (kappa) */}
          <div className="flex flex-col gap-1.5 mt-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-[var(--text-primary)]">
                <LatexText text="Sensibilité Phillips ($\\kappa$)" />
              </span>
              <span className="font-bold text-emerald-500 font-mono">{kappa.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.60"
              step="0.01"
              value={kappa}
              onChange={e => setKappa(parseFloat(e.target.value))}
              className="slider w-full accent-emerald-500"
            />
            <div className="text-[9px] text-[var(--text-tertiary)] font-mono leading-tight">
              Pente de l&apos;offre (Réactivité de l&apos;inflation à l&apos;écart de production).
            </div>
          </div>

          {/* Openness degree (delta) */}
          <div className="flex flex-col gap-1.5 mt-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-[var(--text-primary)]">
                <LatexText text="Degré d'ouverture ($\\delta$)" />
              </span>
              <span className="font-bold text-emerald-500 font-mono">{delta.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.60"
              step="0.05"
              value={delta}
              onChange={e => setDelta(parseFloat(e.target.value))}
              className="slider w-full accent-emerald-500"
            />
          </div>

          {/* Expectations weight (beta) */}
          <div className="flex flex-col gap-1.5 mt-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-[var(--text-primary)]">
                <LatexText text="Poids anticipations ($\\beta$)" />
              </span>
              <span className="font-bold text-emerald-500 font-mono">{beta.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.50"
              max="0.99"
              step="0.01"
              value={beta}
              onChange={e => setBeta(parseFloat(e.target.value))}
              className="slider w-full accent-emerald-500"
            />
          </div>
        </div>

        {/* 3. Injecter des Chocs */}
        <div className="flex flex-col gap-3 border-t pt-4" style={{ borderColor: 'var(--border-subtle)' }}>
          <h3 className="text-[10px] tracking-widest uppercase font-mono text-[var(--text-tertiary)] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            3. Chocs Conjoncturels & Sinistres
          </h3>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={triggerDemandShock}
              className="flex-1 py-2 text-[10px] font-bold font-mono tracking-wider uppercase border border-[var(--border-default)] rounded bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] transition-colors flex items-center justify-center gap-1"
            >
              <Zap size={10} className="text-amber-400" /> +Demande
            </button>
            <button
              onClick={triggerSupplyShock}
              className="flex-1 py-2 text-[10px] font-bold font-mono tracking-wider uppercase border border-[var(--border-default)] rounded bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] transition-colors flex items-center justify-center gap-1"
            >
              <CloudRain size={10} className="text-blue-400" /> +Offre
            </button>
            <button
              onClick={triggerAgriShock}
              className="flex-1 py-2 text-[10px] font-bold font-mono tracking-wider uppercase border border-[var(--border-default)] rounded bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] transition-colors flex items-center justify-center gap-1"
            >
              🌾 Sécheresse
            </button>
          </div>

          <div className="flex flex-col gap-1.5 mt-2 border-t pt-3" style={{ borderColor: 'var(--border-subtle)' }}>
            <span className="text-[9px] uppercase font-mono text-[var(--text-tertiary)]">Sinistres Majeurs Systémiques</span>
            <button
              onClick={() => triggerDisaster('drought')}
              className="w-full py-2 text-[10px] font-bold uppercase rounded border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all text-left px-3 flex items-center justify-between"
            >
              <span>🚨 Sécheresse Historique Extrême</span>
              <span>🌾</span>
            </button>
            <button
              onClick={() => triggerDisaster('flight')}
              className="w-full py-2 text-[10px] font-bold uppercase rounded border-amber-500/20 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all text-left px-3 flex items-center justify-between"
            >
              <span>🚨 Fuite brutale des capitaux (Risk-Off)</span>
              <span>💸</span>
            </button>
            <button
              onClick={() => triggerDisaster('oil')}
              className="w-full py-2 text-[10px] font-bold uppercase rounded border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all text-left px-3 flex items-center justify-between"
            >
              <span>🚨 Triple choc d&apos;offre pétrolier</span>
              <span>🛢️</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── RIGHT: VISUALIZATIONS SECTION ── */}
      <main className="flex-1 flex flex-col gap-6">
        {/* Toggle View Mode */}
        <div className="flex justify-between items-center p-3 rounded-lg border bg-[var(--bg-panel)] border-[var(--border-default)] transition-colors duration-200">
          <div className="flex gap-1.5 p-0.5 rounded bg-[var(--bg-base)] border border-[var(--border-subtle)]">
            <button
              onClick={() => setViewMode('curves')}
              className="px-4 py-1.5 rounded text-xs font-semibold transition-all"
              style={{
                backgroundColor: viewMode === 'curves' ? 'var(--accent-primary)' : 'transparent',
                color: viewMode === 'curves' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              📈 Courbes IS & Phillips
            </button>
            <button
              onClick={() => setViewMode('fanchart')}
              className="px-4 py-1.5 rounded text-xs font-semibold transition-all flex items-center gap-1.5"
              style={{
                backgroundColor: viewMode === 'fanchart' ? 'var(--accent-primary)' : 'transparent',
                color: viewMode === 'fanchart' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              🔮 Projections Fan Chart
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--text-tertiary)]">Output Gap:</span>
              <span className={`font-bold ${outputGap >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                {outputGap.toFixed(2)} %
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--text-tertiary)]">Inflation:</span>
              <span className={`font-bold ${Math.abs(inflation - 2.0) <= 0.5 ? 'text-emerald-500' : 'text-amber-500'}`}>
                {inflation.toFixed(2)} %
              </span>
            </div>
          </div>
        </div>

        {viewMode === 'curves' ? (
          <>
            {/* Split Curves Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* IS Curve Chart Container */}
              <div className="border border-[var(--border-default)] rounded-lg p-5 bg-[var(--bg-panel)] flex flex-col gap-3 min-h-[360px] transition-colors duration-200">
                <div className="flex justify-between items-center border-b pb-2.5" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="flex items-center gap-2">
                    <ChartIcon size={14} className="text-[#B41923] animate-pulse-soft" />
                    <span className="text-xs uppercase font-mono tracking-wider font-bold text-[var(--text-primary)]">Courbe IS (Demande/Activité)</span>
                  </div>
                  <span title="ỹ_t = ρỹ_{t-1} − σ(i^D_t − π^e_t) + δỹ*_t + u^y_t">
                    <HelpCircle size={14} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer" />
                  </span>
                </div>

                <div className="flex-1 w-full min-h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={isCurveData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid stroke="var(--border-subtle)" vertical />
                      <XAxis
                        dataKey="outputGap"
                        type="number"
                        domain={[-4, 4]}
                        tick={AXIS_STYLE}
                        tickFormatter={v => `${v}%`}
                      />
                      <YAxis
                        dataKey="lendingRate"
                        type="number"
                        domain={[0, 10]}
                        tick={AXIS_STYLE}
                        tickFormatter={v => `${v}%`}
                      />
                      <Tooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        formatter={(value: any, name: any) => {
                          if (name === 'lendingRate' || name === 'Taux débiteur') {
                            return [`${Number(value).toFixed(2)} %`, 'Taux débiteur']
                          }
                          return [value, name]
                        }}
                      />
                      <ReferenceLine x={0} stroke="var(--border-strong)" />
                      <ReferenceLine y={lendingRate} stroke="var(--border-strong)" strokeDasharray="3 3" />

                      {/* The IS curve line */}
                      <Line
                        type="monotone"
                        dataKey="lendingRate"
                        name="Taux débiteur"
                        stroke="#B41923"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={false}
                      />

                      {/* Active Equilibrium dot */}
                      <ReferenceDot
                        x={outputGap}
                        y={lendingRate}
                        r={6}
                        fill="#B41923"
                        stroke="#ffffff"
                        strokeWidth={1.5}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[10px] font-mono text-[var(--text-tertiary)] text-center leading-relaxed">
                  <LatexText text="Axe Y : Taux débiteur ($i^D_t$) | Axe X : Écart de production ($\\tilde{y}_t$). La droite descend quand la sensibilité $\\sigma$ augmente (fléchissement)." />
                </p>
              </div>

              {/* Phillips Curve Chart Container */}
              <div className="border border-[var(--border-default)] rounded-lg p-5 bg-[var(--bg-panel)] flex flex-col gap-3 min-h-[360px] transition-colors duration-200">
                <div className="flex justify-between items-center border-b pb-2.5" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="flex items-center gap-2">
                    <ChartIcon size={14} className="text-emerald-500 animate-pulse-soft" />
                    <span className="text-xs uppercase font-mono tracking-wider font-bold text-[var(--text-primary)]">Courbe de Phillips (Offre/Inflation)</span>
                  </div>
                  <span title="π_t = βπ^e_t + κỹ_t + u^π_t">
                    <HelpCircle size={14} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer" />
                  </span>
                </div>

                <div className="flex-1 w-full min-h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={pcCurveData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid stroke="var(--border-subtle)" vertical />
                      <XAxis
                        dataKey="outputGap"
                        type="number"
                        domain={[-4, 4]}
                        tick={AXIS_STYLE}
                        tickFormatter={v => `${v}%`}
                      />
                      <YAxis
                        dataKey="inflation"
                        type="number"
                        domain={[0, 8]}
                        tick={AXIS_STYLE}
                        tickFormatter={v => `${v}%`}
                      />
                      <Tooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        formatter={(value: any, name: any) => {
                          if (name === 'inflation' || name === 'Inflation') {
                            return [`${Number(value).toFixed(2)} %`, 'Inflation']
                          }
                          return [value, name]
                        }}
                      />
                      <ReferenceLine x={0} stroke="var(--border-strong)" />
                      <ReferenceLine y={2.0} stroke="#B41923" strokeDasharray="4 4" opacity={0.3} label={{ value: 'Cible 2%', fill: '#B41923', fontSize: 9, position: 'insideTopRight' }} />

                      {/* The PC curve line */}
                      <Line
                        type="monotone"
                        dataKey="inflation"
                        name="Inflation"
                        stroke="#4A9D7C"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={false}
                      />

                      {/* Active Equilibrium dot */}
                      <ReferenceDot
                        x={outputGap}
                        y={inflation}
                        r={6}
                        fill="#4A9D7C"
                        stroke="#ffffff"
                        strokeWidth={1.5}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[10px] font-mono text-[var(--text-tertiary)] text-center leading-relaxed">
                  <LatexText text="Axe Y : Inflation observée ($\\pi_t$) | Axe X : Écart de production ($\\tilde{y}_t$). Plus la pente $\\kappa$ est élevée, plus l'inflation réagit à la demande." />
                </p>
              </div>
            </div>
          </>
        ) : (
          /* Monte-Carlo Fan Chart Container */
          <div className="col-span-1 xl:col-span-2 border border-[var(--border-default)] rounded-lg p-5 bg-[var(--bg-panel)] flex flex-col gap-3 min-h-[360px] transition-colors duration-200">
            <div className="flex justify-between items-center border-b pb-2.5" style={{ borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center gap-2">
                <ChartIcon size={14} className="text-[var(--accent-primary)] animate-pulse-soft" />
                <span className="text-xs uppercase font-mono tracking-wider font-bold text-[var(--text-primary)]">
                  Analyse de Sensibilité stochastique · Monte-Carlo
                </span>
              </div>
              <span title="Prévisions stochastiques à 4 trimestres par tirage gaussien sur la courbe IS & PC.">
                <HelpCircle size={14} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer" />
              </span>
            </div>

            <div className="flex-1 w-full min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={fanChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid stroke="var(--border-subtle)" vertical />
                  <XAxis dataKey="quarterLabel" tick={AXIS_STYLE} />
                  <YAxis type="number" domain={[-1, 9]} tick={AXIS_STYLE} tickFormatter={v => `${v}%`} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={2.0} stroke="#B41923" strokeDasharray="4 4" opacity={0.3} label={{ value: 'Cible 2%', fill: '#B41923', fontSize: 9, position: 'insideTopRight' }} />

                  {/* 90% confidence interval band */}
                  <Area
                    type="monotone"
                    dataKey="p90"
                    stroke="none"
                    fill="var(--accent-primary)"
                    opacity={0.10}
                    connectNulls
                  />

                  {/* 50% confidence interval band */}
                  <Area
                    type="monotone"
                    dataKey="p50"
                    stroke="none"
                    connectNulls
                    fill="var(--accent-primary)"
                    opacity={0.22}
                  />

                  {/* Median prediction path */}
                  <Line
                    type="monotone"
                    dataKey="median"
                    stroke="var(--accent-primary)"
                    strokeWidth={2}
                    dot={{ r: 3, strokeWidth: 1 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Chart Legend */}
            <div className="flex gap-4 flex-wrap justify-center text-[10px] font-mono mt-1" style={{ color: 'var(--text-secondary)' }}>
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
                <span>Historique / Actuel</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full inline-block border border-[var(--accent-primary)] bg-[var(--bg-base)]" />
                <span>Projection stochastique</span>
              </div>
            </div>
          </div>
        )}

        {/* Interactive Simulation Console */}
        <div className="border border-[var(--border-default)] rounded-lg p-5 bg-[var(--bg-panel)] flex flex-col md:flex-row items-center justify-between gap-4 transition-colors duration-200">
          <div>
            <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-[var(--text-primary)]">Console Dynamique Sandbox</h3>
            <p className="text-[10px] text-[var(--text-secondary)] mt-1 max-w-xl">
              Simulez le passage du temps stochastique pour observer comment la production et l&apos;inflation reviennent à leur état d&apos;équilibre sous l&apos;action de la forward guidance et de la dissipation naturelle des chocs injectés.
            </p>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={handleSimulateStep}
              className="flex-1 md:flex-none px-4 py-2.5 rounded text-xs font-semibold uppercase tracking-wider bg-[var(--accent-primary)] hover:bg-[#901319] text-white transition-colors flex items-center justify-center gap-1.5"
              style={{ cursor: 'pointer' }}
            >
              <Play size={12} fill="white" />
              Simuler 1 trimestre
            </button>
          </div>
        </div>

        {/* Educational Formula Block */}
        <div className="border border-[var(--border-default)] rounded-lg p-5 bg-[var(--bg-panel)] flex flex-col gap-4 transition-colors duration-200">
          <h3 className="text-xs uppercase font-mono font-bold text-[var(--text-primary)] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Modélisation Académique des Mécanismes
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs leading-relaxed text-[var(--text-secondary)]">
            <div>
              <h4 className="font-semibold text-[var(--text-primary)] mb-2 uppercase font-mono text-[10px]">1. La transmission de l&apos;élasticité IS</h4>
              <p className="mb-3">
                <LatexText text="La courbe IS (Investment-Savings) traduit la demande de biens et services. La relation liant l'output gap $\tilde{y}_t$ aux taux d'intérêt s'écrit :" />
              </p>
              <BlockKatex math="\tilde{y}_t = 0.70 \tilde{y}_{t-1} - \sigma (i^D_t - \pi^e_t) + \delta \tilde{y}^*_t + u^y_t" />
              <p className="mt-3">
                <LatexText text="En augmentant le curseur $\sigma$, vous observez que la droite de demande s'aplatit, illustrant une économie extrêmement sensible au coût de financement. À l'inverse, un $\sigma$ très bas caractérise un canal de transmission du crédit rigide." />
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-[var(--text-primary)] mb-2 uppercase font-mono text-[10px]">2. Le compromis inflation-activité de Phillips</h4>
              <p className="mb-3">
                <LatexText text="La courbe de Phillips traduit la dynamique de l'offre. L'inflation observée $\pi_t$ dépend positivement des anticipations de prix et des tensions productives :" />
              </p>
              <BlockKatex math="\pi_t = \beta \pi^e_t + \kappa \tilde{y}_t + 0.20 s^{agri}_t + u^\pi_t" />
              <p className="mt-3">
                <LatexText text="Le coefficient $\kappa$ représente la rigidité nominale des salaires et des prix. Si $\kappa$ est élevé (pente forte), le moindre écart de production positif déclenchera une spirale inflationniste (cas des économies en surchauffe)." />
              </p>
            </div>
          </div>
        </div>
      </main>
    </motion.div>
  )
}

// ── SUB-COMPONENT: HISTORICAL CAMPAIGNS ──
function CampaignView() {
  const router = useRouter()
  const startGame = useGameStore(s => s.startGame)
  const [selectedId, setSelectedId] = useState<string>('volcker1979')
  const [isStarting, setIsStarting] = useState(false)

  const activeCampaign = CAMPAIGNS[selectedId]

  const handleStartMission = async (id: string) => {
    if (isStarting) return
    setIsStarting(true)
    await startGame(id as any)
    router.push('/play')
  }

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Left pane: Mission selectors */}
      <section
        className="w-full md:w-[350px] p-5 border border-[var(--border-default)] rounded-lg flex flex-col gap-4 bg-[var(--bg-panel)] transition-colors duration-200"
      >
        <div className="flex items-center gap-2 text-[var(--accent-primary)] mb-2 border-b pb-3" style={{ borderColor: 'var(--border-subtle)' }}>
          <ShieldAlert size={16} />
          <h2 className="text-xs uppercase font-mono tracking-wider font-bold">Sélectionner une Crise</h2>
        </div>

        <div className="flex flex-col gap-3">
          {Object.values(CAMPAIGNS).map((campaign) => {
            const isActive = selectedId === campaign.id
            return (
              <button
                key={campaign.id}
                onClick={() => setSelectedId(campaign.id)}
                className="w-full text-left rounded-lg p-4 transition-all duration-200"
                style={{
                  backgroundColor: isActive ? 'rgba(var(--accent-primary-rgb), 0.08)' : 'var(--bg-elevated)',
                  border: isActive ? '1px solid rgba(var(--accent-primary-rgb), 0.4)' : '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                }}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[var(--bg-base)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                    Crise
                  </span>
                  <span className="text-[9px] font-mono" style={{ color: 'var(--text-tertiary)' }}>
                    T = {campaign.duration} Quarters
                  </span>
                </div>
                <h3 className="font-editorial text-base text-[var(--text-primary)] font-bold leading-tight mb-1">
                  {campaign.title}
                </h3>
                <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                  {campaign.description}
                </p>
              </button>
            )
          })}
        </div>

        <div className="mt-auto border-t border-[var(--border-subtle)] pt-4 text-[10px] font-mono text-[var(--text-tertiary)] leading-relaxed">
          💡 **Mode Campagne** : Ces missions institutionnelles désactivent la randomisation stochastique par défaut en faveur de calibrations de chocs historiques strictes.
        </div>
      </section>

      {/* Right pane: Classified Briefing Details */}
      <section className="flex-1 border border-[var(--border-default)] rounded-lg p-6 bg-[var(--bg-panel)] transition-colors duration-200">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCampaign.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-6"
          >
            {/* Mission Header Banner */}
            <div className="border-b border-[var(--border-subtle)] pb-5">
              <span className="label-caps font-mono tracking-widest text-xs uppercase" style={{ color: 'var(--accent-primary)' }}>
                Briefing Officiel · Confidentiel CBS
              </span>
              <h2 className="font-editorial text-3xl font-bold mt-1 text-[var(--text-primary)] leading-tight">
                {activeCampaign.title}
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                {activeCampaign.subtitle}
              </p>
            </div>

            {/* Sub grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              
              {/* Briefing summary */}
              <div className="xl:col-span-2 flex flex-col gap-4">
                <div className="border border-[var(--border-default)] bg-[var(--bg-base)] rounded-lg p-5 transition-colors duration-200">
                  <h3 className="text-xs uppercase font-mono font-bold tracking-wider mb-2.5 text-[var(--text-primary)] flex items-center gap-1.5">
                    <FileText size={14} className="text-[var(--accent-primary)]" />
                    Contexte Historique
                  </h3>
                  <div className="text-xs leading-relaxed text-[var(--text-secondary)] space-y-3">
                    {activeCampaign.contextMarkdown.split('\n\n').map((paragraph, i) => {
                      if (paragraph.trim().startsWith('$$\\')) {
                        return <BlockKatex key={i} math={paragraph.replace(/\$\$/g, '').trim()} />
                      }
                      return <p key={i}><LatexText text={paragraph} /></p>
                    })}
                  </div>
                </div>

                {/* Victory/Defeat criteria */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-[var(--data-positive)]/20 bg-[var(--data-positive)]/5 rounded-lg p-4 transition-colors duration-200">
                    <h4 className="text-xs uppercase font-mono font-bold tracking-wider text-[var(--data-positive)] mb-2">
                      ✓ Conditions de Victoire
                    </h4>
                    <div className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      <MarkdownText text={activeCampaign.winConditionsMarkdown} />
                    </div>
                  </div>

                  <div className="border border-[var(--data-negative)]/20 bg-[var(--data-negative)]/5 rounded-lg p-4 transition-colors duration-200">
                    <h4 className="text-xs uppercase font-mono font-bold tracking-wider text-[var(--data-negative)] mb-2">
                      ✗ Facteurs d&apos;Échec
                    </h4>
                    <div className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      <MarkdownText text={activeCampaign.lossConditionsMarkdown} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar details */}
              <div className="flex flex-col gap-4">
                {/* Starting stats */}
                <div className="border border-[var(--border-default)] bg-[var(--bg-base)] rounded-lg p-5 transition-colors duration-200">
                  <h3 className="text-xs uppercase font-mono font-bold tracking-wider mb-3 text-[var(--text-primary)] flex items-center gap-1.5">
                    <Calendar size={14} className="text-[var(--accent-primary)]" />
                    État de Départ (Q0)
                  </h3>
                  <div className="flex flex-col gap-3">
                    {activeCampaign.startingKpi.map((kpi, i) => (
                      <div key={i} className="border-b border-[var(--border-subtle)] pb-2 last:border-b-0 last:pb-0">
                        <span className="text-[10px] text-[var(--text-tertiary)] font-mono">{kpi.label}</span>
                        <div className="flex justify-between items-center mt-0.5">
                          <span className="text-sm font-bold text-[var(--text-primary)] font-mono">{kpi.value}</span>
                          <span className="text-[8px] text-[var(--text-secondary)] font-mono">{kpi.hint}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Academic goals */}
                <div className="border border-[var(--border-default)] bg-[var(--bg-base)] rounded-lg p-5 transition-colors duration-200">
                  <h3 className="text-xs uppercase font-mono font-bold tracking-wider mb-2.5 text-[var(--text-primary)] flex items-center gap-1.5">
                    <Award size={14} className="text-[var(--accent-primary)]" />
                    Objectifs Formalisés
                  </h3>
                  <div className="flex flex-col gap-3 font-mono text-[10px]">
                    {activeCampaign.goals.map((g, i) => (
                      <div key={i} className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-2 last:border-b-0">
                        <span className="text-[var(--text-secondary)]">{g.label}</span>
                        <span className="text-[var(--text-primary)] font-bold">{g.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* Action area */}
            <div className="border-t border-[var(--border-subtle)] pt-6 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                <HelpCircle size={14} />
                <span>Votre score sera évalué selon le respect strict des critères de mandat.</span>
              </div>

              <button
                onClick={() => handleStartMission(activeCampaign.id)}
                disabled={isStarting}
                className="px-6 py-3 rounded text-xs font-semibold uppercase tracking-wider bg-[var(--accent-primary)] hover:bg-[#901319] text-white transition-all duration-150 flex items-center gap-1.5"
                style={{ cursor: isStarting ? 'wait' : 'pointer', opacity: isStarting ? 0.8 : 1 }}
              >
                <Play size={12} fill="white" />
                {isStarting ? 'Synchronisation BKAM...' : 'Accepter la Mission & Commencer'}
              </button>
            </div>

          </motion.div>
        </AnimatePresence>
      </section>
    </div>
  )
}

// ── MAIN SCREEN: ENTRAÎNEMENT ──
export default function TrainingPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'lab' | 'campaign'>('lab')

  const currentUser = useAuthStore(s => s.currentUser)
  const player = useAuthStore(s => s.getCurrentPlayer())
  const logout = useAuthStore(s => s.logout)

  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const tab = params.get('tab')
      if (tab === 'lab' || tab === 'campaign') {
        setActiveTab(tab)
      }
    }
  }, [])

  if (!mounted) return null

  return (
    <div
      className="min-h-screen flex flex-col font-inter transition-colors duration-200"
      style={{
        backgroundColor: 'var(--bg-base)',
        color: 'var(--text-primary)',
        backgroundImage: 'radial-gradient(circle at bottom left, rgba(var(--accent-primary-rgb), 0.03) 0%, transparent 60%)'
      }}
    >
      {/* ══════ NAV BAR ══════ */}
      <nav
        className="flex items-center justify-between px-6"
        style={{ height: '52px', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-base)' }}
      >
        <div className="flex items-center gap-3">
          <a href="/" className="font-editorial text-sm" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>CBS</a>
          <span style={{ color: 'var(--border-default)' }}>·</span>
          <a href="/courses" className="label-caps flex items-center gap-1" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '11px' }}>
            <GraduationCap size={12} /> Cours
          </a>
          <span style={{ color: 'var(--border-default)' }}>·</span>
          <a href="/training" className="label-caps flex items-center gap-1 font-bold text-[var(--text-primary)]" style={{ textDecoration: 'none', fontSize: '11px' }}>
            <Sliders size={12} style={{ color: 'var(--accent-cool)' }} /> Entraînement
          </a>
          <span style={{ color: 'var(--border-default)' }}>·</span>
          <a href="/dashboard" className="label-caps flex items-center gap-1" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '11px' }}>
            <LayoutDashboard size={12} style={{ color: 'var(--accent-warm)' }} /> Simulation
          </a>
          {player && (
            <>
              <span style={{ color: 'var(--border-default)' }}>·</span>
              <a href="/players" className="label-caps flex items-center gap-1" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '11px' }}>
                <Users size={12} /> Joueurs
              </a>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          {player && (
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              {player.pseudo}
            </span>
          )}
          <ThemeToggle />
          {currentUser ? (
            <button
              onClick={() => { logout(); router.push('/') }}
              className="flex items-center gap-1.5 label-caps transition-colors"
              style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <LogOut size={12} />
              Déconnexion
            </button>
          ) : (
            <button
              onClick={() => router.push('/login')}
              className="label-caps px-3 py-1.5 rounded-md"
              style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-default)', cursor: 'pointer' }}
            >
              Se connecter
            </button>
          )}
        </div>
      </nav>

      {/* ── Sub Header with Tab Switcher ── */}
      <header
        className="px-6 py-6 border-b transition-colors duration-200"
        style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-panel)' }}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-sm font-semibold tracking-wider uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--accent-cool)] animate-pulse" />
              ESPACE D&apos;ENTRAÎNEMENT MONÉTAIRE
            </h1>
            <p className="text-[10px] uppercase font-mono tracking-widest text-[var(--text-tertiary)] mt-0.5">
              CBS serious game · Laboratoire Sandbox & Scénarios Classés
            </p>
          </div>

          {/* Segmented Control Selector */}
          <div className="flex rounded-lg overflow-hidden p-0.5 bg-[var(--bg-base)] border border-[var(--border-default)] self-start md:self-auto">
            <button
              onClick={() => setActiveTab('lab')}
              className="px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5"
              style={{
                backgroundColor: activeTab === 'lab' ? 'var(--accent-cool)' : 'transparent',
                color: activeTab === 'lab' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Sliders size={12} />
              Laboratoire Sandbox
            </button>
            <button
              onClick={() => setActiveTab('campaign')}
              className="px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5"
              style={{
                backgroundColor: activeTab === 'campaign' ? 'var(--accent-cool)' : 'transparent',
                color: activeTab === 'campaign' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <ShieldAlert size={12} />
              Crises Historiques
            </button>
          </div>
        </div>
      </header>

      {/* ── Main View Panel ── */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'lab' ? (
            <motion.div
              key="lab-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <LabView />
            </motion.div>
          ) : (
            <motion.div
              key="campaign-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <CampaignView />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AssistantBot
        messages={["Je peux expliquer les formules, les chocs et les scenarios de l'espace entrainement."]}
        context="training"
      />
    </div>
  )
}
