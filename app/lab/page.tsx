'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Play, RotateCcw, Sliders,
  LineChart as ChartIcon, HelpCircle, AlertTriangle, CloudRain, ShieldAlert, Zap
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot,
  ComposedChart, Area, ReferenceArea
} from 'recharts'
import { InlineKatex, BlockKatex, LatexText } from '@/components/ui/InlineKatex'
import { ThemeToggle } from '@/components/shell/ThemeToggle'
import { AssistantBot } from '@/components/ui/AssistantBot'
import { sound } from '@/lib/audio'
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

export default function LabPage() {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'curves' | 'fanchart'>('curves')

  // ── Structural Parameters (Synchronized with engine calibration PARAMS) ──
  const [kappa, setKappa] = useState<number>(PARAMS.kappa) // Phillips sensitivity
  const [sigma, setSigma] = useState<number>(PARAMS.sigma) // IS elasticity
  const [delta, setDelta] = useState<number>(PARAMS.delta) // openness degree
  const [beta, setBeta] = useState<number>(PARAMS.beta)   // expectations weight

  // ── Policy Instruments ──
  const [policyRate, setPolicyRate] = useState(2.75) // Central bank TMP

  // ── Economic Variables & Shocks ──
  const [inflationExpected, setInflationExpected] = useState(2.0)
  const [outputGapPrev, setOutputGapPrev] = useState(0.0)
  const [inflationPrev, setInflationPrev] = useState(2.2)
  const [externalDemand, setExternalDemand] = useState(0.0) // global GDP gap
  const [demandShock, setDemandShock] = useState(0.0)       // u^y
  const [supplyShock, setSupplyShock] = useState(0.0)       // u^pi
  const [agriShock, setAgriShock] = useState(0.0)           // agriculture shock

  // ── Math Calculations (Real-Time State) ──
  const lendingRate = useMemo(() => policyRate + 2.45, [policyRate])
  const realRate = useMemo(() => lendingRate - inflationExpected, [lendingRate, inflationExpected])

  const outputGap = useMemo(() => {
    return 0.70 * outputGapPrev - sigma * realRate + delta * externalDemand + demandShock
  }, [outputGapPrev, sigma, realRate, delta, externalDemand, demandShock])

  const inflation = useMemo(() => {
    return beta * inflationExpected + kappa * outputGap + 0.20 * agriShock + supplyShock
  }, [beta, inflationExpected, kappa, outputGap, agriShock, supplyShock])

  // ── Curves coordinates generation ──
  const isCurveData = useMemo(() => {
    const pts = []
    // Compute lending rate required for each output gap value on the IS Curve:
    // y = 0.7*y_prev - sigma*(iD - pi_e) + delta*y_ext + u_y
    // iD = pi_e + (0.7*y_prev + delta*y_ext + u_y - y) / sigma
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
    // Compute inflation for each output gap value on the Phillips Curve:
    // pi = beta*pi_e + kappa*y + 0.20*agri + u_pi
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

        // update for next step
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
    outputGap,
    inflation,
    inflationExpected,
    inflationPrev,
    demandShock,
    supplyShock,
    agriShock,
    policyRate,
    sigma,
    delta,
    externalDemand,
    beta,
    kappa,
  ])

  // ── Simulator Interactions ──
  const handleSimulateStep = () => {
    setOutputGapPrev(outputGap)
    setInflationPrev(inflation)
    // Anchoring expectations slightly towards actual inflation, shocks decaying by 40%
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
      setDemandShock(-3.0)
      setSupplyShock(3.5)
      setInflationExpected(5.0)
    } else if (type === 'oil') {
      setFlashColor('rgba(194, 84, 80, 0.25)')
      setSupplyShock(6.0)
    }
    
    setTimeout(() => {
      setIsShaking(false)
      setFlashColor(null)
    }, 600)
  }

  return (
    <div
      className="min-h-screen flex flex-col font-inter transition-colors duration-200"
      style={{
        backgroundColor: 'var(--bg-base)',
        color: 'var(--text-primary)',
        backgroundImage: 'radial-gradient(circle at top right, rgba(var(--accent-primary-rgb), 0.02) 0%, transparent 80%)'
      }}
    >
      {/* Upper Navigation Header */}
      <header
        className="px-6 py-4 flex items-center justify-between border-b transition-colors duration-200"
        style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-panel)' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors duration-150"
            style={{ border: '1px solid var(--border-subtle)' }}
            aria-label="Retour au tableau de bord"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-sm font-semibold tracking-wider uppercase flex items-center gap-2 text-[var(--text-primary)]">
              <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse" />
              LABORATOIRE MACROÉCONOMIQUE
            </h1>
            <p className="text-[10px] uppercase font-mono tracking-widest text-[var(--text-tertiary)]">
              Simulation Sandbox · Analyse IS-Phillips CBS v3.0
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded text-xs font-semibold font-mono border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] transition-colors flex items-center gap-1"
          >
            <RotateCcw size={12} />
            RESET
          </button>
        </div>
      </header>

      {/* Main Split Layout */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden max-h-[calc(100vh-65px)]">
        
        {/* Left Side: Parameters Slider Panel */}
        <section
          className="w-full lg:w-[380px] p-6 border-b lg:border-b-0 lg:border-r flex flex-col gap-6 overflow-y-auto transition-colors duration-200"
          style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-panel)' }}
        >
          <div className="flex items-center gap-2 text-[var(--accent-primary)] border-b pb-3" style={{ borderColor: 'var(--border-subtle)' }}>
            <Sliders size={16} />
            <h2 className="text-xs uppercase font-mono tracking-wider font-bold text-[var(--text-primary)]">Configuration du modèle</h2>
          </div>

          {/* Sliders Block 1: Structural Params */}
          <div className="flex flex-col gap-5">
            <h3 className="text-[10px] tracking-widest uppercase font-mono text-[var(--text-tertiary)]">Constantes Structurelles</h3>
            
            {/* Kappa slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-[var(--text-secondary)]">Pente Phillips (κ)</span>
                <span className="text-[var(--text-primary)] font-bold">{kappa.toFixed(3)}</span>
              </div>
              <input
                type="range"
                min="0.01"
                max="0.50"
                step="0.01"
                value={kappa}
                onChange={e => setKappa(parseFloat(e.target.value))}
                className="w-full h-1 bg-[var(--bg-elevated)] rounded-lg appearance-none cursor-pointer accent-[#b41923]"
              />
              <span className="text-[9px] text-[var(--text-tertiary)] italic">Sensibilité de l&apos;inflation à l&apos;écart de production.</span>
            </div>

            {/* Sigma slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-[var(--text-secondary)]">Élasticité IS (σ)</span>
                <span className="text-[var(--text-primary)] font-bold">{sigma.toFixed(3)}</span>
              </div>
              <input
                type="range"
                min="0.01"
                max="0.40"
                step="0.01"
                value={sigma}
                onChange={e => setSigma(parseFloat(e.target.value))}
                className="w-full h-1 bg-[var(--bg-elevated)] rounded-lg appearance-none cursor-pointer accent-[#b41923]"
              />
              <span className="text-[9px] text-[var(--text-tertiary)] italic">Sensibilité de la demande globale au taux d&apos;intérêt réel.</span>
            </div>

            {/* Delta slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-[var(--text-secondary)]">Degré d&apos;ouverture (δ)</span>
                <span className="text-[var(--text-primary)] font-bold">{delta.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.80"
                step="0.05"
                value={delta}
                onChange={e => setDelta(parseFloat(e.target.value))}
                className="w-full h-1 bg-[var(--bg-elevated)] rounded-lg appearance-none cursor-pointer accent-[#b41923]"
              />
              <span className="text-[9px] text-[var(--text-tertiary)] italic">Poids et impact de la demande extérieure (Zone Euro) sur le Maroc.</span>
            </div>

            {/* Beta slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-[var(--text-secondary)]">Expectations (β)</span>
                <span className="text-[var(--text-primary)] font-bold">{beta.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.50"
                max="1.00"
                step="0.02"
                value={beta}
                onChange={e => setBeta(parseFloat(e.target.value))}
                className="w-full h-1 bg-[var(--bg-elevated)] rounded-lg appearance-none cursor-pointer accent-[#b41923]"
              />
              <span className="text-[9px] text-[var(--text-tertiary)] italic">Poids des anticipations dans la formation de l&apos;inflation.</span>
            </div>
          </div>

          <div className="h-[1px]" style={{ backgroundColor: 'var(--border-subtle)' }} />

          {/* Sliders Block 2: Policy Instruments */}
          <div className="flex flex-col gap-5">
            <h3 className="text-[10px] tracking-widest uppercase font-mono text-[var(--text-tertiary)]">Politique Monétaire</h3>
            
            {/* Policy Rate slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-[var(--text-secondary)]">Taux directeur (i)</span>
                <span className="text-[var(--accent-primary)] font-bold">{policyRate.toFixed(2)} %</span>
              </div>
              <input
                type="range"
                min="0.50"
                max="15.00"
                step="0.25"
                value={policyRate}
                onChange={e => setPolicyRate(parseFloat(e.target.value))}
                className="w-full h-1 bg-[var(--bg-elevated)] rounded-lg appearance-none cursor-pointer accent-[#b41923]"
              />
            </div>
          </div>

          <div className="h-[1px]" style={{ backgroundColor: 'var(--border-subtle)' }} />

          {/* Sliders Block 3: External Shocks & State */}
          <div className="flex flex-col gap-5 pb-6">
            <h3 className="text-[10px] tracking-widest uppercase font-mono text-[var(--text-tertiary)]">Scénarios & Variables</h3>
            
            {/* Expected inflation input */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-[var(--text-secondary)]">Anticipations (π^e)</span>
                <span className="text-[var(--text-primary)]">{inflationExpected.toFixed(2)} %</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="10.0"
                step="0.1"
                value={inflationExpected}
                onChange={e => setInflationExpected(parseFloat(e.target.value))}
                className="w-full h-1 bg-[var(--bg-elevated)] rounded-lg appearance-none cursor-pointer accent-[#b41923]"
              />
            </div>

            {/* Shocks Triggers Buttons */}
            <div className="flex flex-col gap-3.5 mt-2">
              <span className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase tracking-wider">Chocs mineurs (Stochastiques)</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={triggerDemandShock}
                  className="px-2.5 py-1.5 rounded text-[10px] font-mono font-bold uppercase transition-all border hover:border-blue-500 hover:text-blue-400 bg-[var(--bg-elevated)] border-[var(--border-default)] text-[var(--text-secondary)]"
                  style={{ cursor: 'pointer' }}
                >
                  Demand Shock (+2%)
                </button>
                <button
                  type="button"
                  onClick={triggerSupplyShock}
                  className="px-2.5 py-1.5 rounded text-[10px] font-mono font-bold uppercase transition-all border hover:border-yellow-600 hover:text-yellow-500 bg-[var(--bg-elevated)] border-[var(--border-default)] text-[var(--text-secondary)]"
                  style={{ cursor: 'pointer' }}
                >
                  Supply Shock (+3%)
                </button>
                <button
                  type="button"
                  onClick={triggerAgriShock}
                  className="px-2.5 py-1.5 rounded text-[10px] font-mono font-bold uppercase transition-all border hover:border-emerald-600 hover:text-emerald-500 bg-[var(--bg-elevated)] border-[var(--border-default)] text-[var(--text-secondary)] col-span-2"
                  style={{ cursor: 'pointer' }}
                >
                  Sécheresse Agricole (-2.5%)
                </button>
              </div>

              <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '4px 0' }} />

              <span className="text-[10px] font-mono text-[var(--accent-primary)] uppercase tracking-wider font-semibold">⚠️ Chaos Sandbox - Catastrophes</span>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => triggerDisaster('drought')}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg border transition-all text-left"
                  style={{
                    backgroundColor: 'rgba(194, 84, 80, 0.05)',
                    borderColor: 'rgba(194, 84, 80, 0.25)',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(194, 84, 80, 0.6)'; e.currentTarget.style.backgroundColor = 'rgba(194, 84, 80, 0.1)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(194, 84, 80, 0.25)'; e.currentTarget.style.backgroundColor = 'rgba(194, 84, 80, 0.05)' }}
                >
                  <div className="flex items-center gap-2">
                    <CloudRain size={14} className="text-[#C25450]" />
                    <div>
                      <p className="text-[10px] font-bold font-mono text-[#C25450] m-0">SUPER SÉCHERESSE</p>
                      <p className="text-[8px] text-[var(--text-tertiary)] m-0">Agri -6.0% · Offre +4.5%</p>
                    </div>
                  </div>
                  <span className="text-xs">💥</span>
                </button>

                <button
                  type="button"
                  onClick={() => triggerDisaster('flight')}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg border transition-all text-left"
                  style={{
                    backgroundColor: 'rgba(201, 168, 106, 0.05)',
                    borderColor: 'rgba(201, 168, 106, 0.25)',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201, 168, 106, 0.6)'; e.currentTarget.style.backgroundColor = 'rgba(201, 168, 106, 0.1)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(201, 168, 106, 0.25)'; e.currentTarget.style.backgroundColor = 'rgba(201, 168, 106, 0.05)' }}
                >
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={14} className="text-[#C9A86A]" />
                    <div>
                      <p className="text-[10px] font-bold font-mono text-[#C9A86A] m-0">CRISE DE CHANGE & CAPITAUX</p>
                      <p className="text-[8px] text-[var(--text-tertiary)] m-0">Demande -3% · π^e +5%</p>
                    </div>
                  </div>
                  <span className="text-xs">💥</span>
                </button>

                <button
                  type="button"
                  onClick={() => triggerDisaster('oil')}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg border transition-all text-left"
                  style={{
                    backgroundColor: 'rgba(194, 84, 80, 0.05)',
                    borderColor: 'rgba(194, 84, 80, 0.25)',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(194, 84, 80, 0.6)'; e.currentTarget.style.backgroundColor = 'rgba(194, 84, 80, 0.1)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(194, 84, 80, 0.25)'; e.currentTarget.style.backgroundColor = 'rgba(194, 84, 80, 0.05)' }}
                >
                  <div className="flex items-center gap-2">
                    <Zap size={14} className="text-[#C25450]" />
                    <div>
                      <p className="text-[10px] font-bold font-mono text-[#C25450] m-0">CHOC PÉTROLIER GLOBAL</p>
                      <p className="text-[8px] text-[var(--text-tertiary)] m-0">Offre +6.0% (Matières prem.)</p>
                    </div>
                  </div>
                  <span className="text-xs">💥</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Right Side: Curves, Equilibrium and Simulation Panel */}
        <section className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
          
          {/* Real-time Scoreboard */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="border border-[var(--border-default)] rounded-md p-3.5 bg-[var(--bg-panel)] transition-colors duration-200">
              <span className="text-[9px] uppercase tracking-wider font-mono text-[var(--text-tertiary)]">Output gap actuel (ỹ)</span>
              <p className="text-xl font-editorial font-bold mt-1 text-[var(--text-primary)] tabular-nums">
                {outputGap > 0 ? '+' : ''}{outputGap.toFixed(2)} %
              </p>
              <div className="text-[9px] font-mono text-[var(--text-secondary)] mt-1.5">
                Demande {outputGap > 0.2 ? 'excédentaire' : outputGap < -0.2 ? 'dépressive' : 'à l\'équilibre'}
              </div>
            </div>

            <div className="border border-[var(--border-default)] rounded-md p-3.5 bg-[var(--bg-panel)] transition-colors duration-200">
              <span className="text-[9px] uppercase tracking-wider font-mono text-[var(--text-tertiary)]">Inflation observée (π)</span>
              <p className="text-xl font-editorial font-bold mt-1 tabular-nums" style={{ color: Math.abs(inflation - 2) < 0.5 ? 'var(--data-positive)' : 'var(--data-warning)' }}>
                {inflation.toFixed(2)} %
              </p>
              <div className="text-[9px] font-mono text-[var(--text-secondary)] mt-1.5">
                Cible CBS : 2.0 %
              </div>
            </div>

            <div className="border border-[var(--border-default)] rounded-md p-3.5 bg-[var(--bg-panel)] transition-colors duration-200">
              <span className="text-[9px] uppercase tracking-wider font-mono text-[var(--text-tertiary)]">Taux débiteur (i^D)</span>
              <p className="text-xl font-editorial font-bold mt-1 text-[var(--text-primary)] tabular-nums">
                {lendingRate.toFixed(2)} %
              </p>
              <div className="text-[9px] font-mono text-[var(--text-secondary)] mt-1.5">
                i ({policyRate.toFixed(2)}%) + marge (2.45%)
              </div>
            </div>

            <div className="border border-[var(--border-default)] rounded-md p-3.5 bg-[var(--bg-panel)] transition-colors duration-200">
              <span className="text-[9px] uppercase tracking-wider font-mono text-[var(--text-tertiary)]">Taux d&apos;intérêt réel (r)</span>
              <p className="text-xl font-editorial font-bold mt-1 text-[var(--text-primary)] tabular-nums">
                {realRate > 0 ? '+' : ''}{realRate.toFixed(2)} %
              </p>
              <div className="text-[9px] font-mono text-[var(--text-secondary)] mt-1.5">
                i^D - π^e ({inflationExpected.toFixed(2)}%)
              </div>
            </div>
          </div>

          {/* View Mode Toggle Tabs */}
          <div className="flex border-b border-[var(--border-subtle)] pb-1 justify-between items-end">
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setViewMode('curves')}
                className={`text-xs uppercase font-mono tracking-wider font-bold pb-2 transition-all border-b-2 bg-transparent border-none px-0 ${
                  viewMode === 'curves'
                    ? 'border-[var(--accent-primary)] text-[var(--accent-primary)] font-extrabold'
                    : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                }`}
                style={{ cursor: 'pointer' }}
              >
                Courbes d&apos;Équilibre (IS-PC)
              </button>
              <button
                type="button"
                onClick={() => setViewMode('fanchart')}
                className={`text-xs uppercase font-mono tracking-wider font-bold pb-2 transition-all border-b-2 bg-transparent border-none px-0 flex items-center gap-1.5 ${
                  viewMode === 'fanchart'
                    ? 'border-[var(--accent-primary)] text-[var(--accent-primary)] font-extrabold'
                    : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                }`}
                style={{ cursor: 'pointer' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] animate-pulse" />
                Prévisions Monte-Carlo (Fan Chart)
              </button>
            </div>
            
            {viewMode === 'fanchart' && (
              <span className="text-[9px] uppercase font-mono tracking-widest text-[var(--text-tertiary)] hidden sm:inline mb-2">
                100 Simulations Simultanées
              </span>
            )}
          </div>

          {/* Curves Section Side-by-Side with Shake and Flash */}
          <motion.div
            variants={shakeVariants}
            animate={isShaking ? "shake" : "idle"}
            className="grid grid-cols-1 xl:grid-cols-2 gap-6 relative"
          >
            {/* Flash Overlay */}
            {flashColor && (
              <div
                className="absolute inset-0 z-40 rounded-lg pointer-events-none transition-colors duration-200 animate-pulse-soft"
                style={{ backgroundColor: flashColor }}
              />
            )}

            {viewMode === 'curves' ? (
              <>
                {/* IS Curve Chart Container */}
                <div className="border border-[var(--border-default)] rounded-lg p-5 bg-[var(--bg-panel)] flex flex-col gap-3 min-h-[360px] transition-colors duration-200">
                  <div className="flex justify-between items-center border-b pb-2.5" style={{ borderColor: 'var(--border-subtle)' }}>
                    <div className="flex items-center gap-2">
                      <ChartIcon size={14} className="text-red-500 animate-pulse-soft" />
                      <span className="text-xs uppercase font-mono tracking-wider font-bold text-[var(--text-primary)]">Courbe IS (Demande Agrégée)</span>
                    </div>
                    <span title="ỹ_t = 0.7ỹ_{t-1} − σ(i^D_t − π^e_t) + δỹ*_t + u^y_t">
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
                          name="Output Gap"
                        />
                        <YAxis
                          dataKey="lendingRate"
                          type="number"
                          domain={[0, 12]}
                          tick={AXIS_STYLE}
                          tickFormatter={v => `${v}%`}
                          name="Lending Rate"
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
                        <ReferenceLine y={policyRate + 2.45 - inflationExpected} stroke="var(--border-subtle)" strokeDasharray="3 3" />
                        
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

                <div className="flex-1 w-full min-h-[220px] bg-[var(--bg-base)] rounded-md border border-[var(--border-subtle)] p-2 relative flex items-center justify-center transition-colors duration-200">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={fanChartData} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
                      <CartesianGrid stroke="var(--border-subtle)" vertical={false} />
                      <XAxis dataKey="quarterLabel" tick={AXIS_STYLE} axisLine={false} tickLine={false} />
                      <YAxis tick={AXIS_STYLE} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                      <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border-default)' }} />

                      {/* Inflation target band */}
                      <ReferenceArea y1={1.5} y2={2.5} fill="#B41923" fillOpacity={0.03} strokeOpacity={0} />
                      <ReferenceLine y={2} stroke="#B41923" strokeDasharray="3 3" opacity={0.25} />

                      {/* Separator between History and Forecast */}
                      <ReferenceLine
                        x="T (Actuel)"
                        stroke="var(--border-strong)"
                        strokeWidth={1}
                        strokeDasharray="4 4"
                      />

                      {/* 90% Confidence Interval Area */}
                      <Area
                        type="monotone"
                        dataKey="p90"
                        stroke="none"
                        fill="var(--accent-primary)"
                        fillOpacity={0.10}
                        connectNulls
                        name="Intervalle 90%"
                      />

                      {/* 50% Confidence Interval Area */}
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
                        dot={(props: any) => {
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
          </motion.div>


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
        </section>
      </main>

      <AssistantBot
        messages={["Je peux expliquer les courbes IS/Phillips, les chocs et les parametres du laboratoire."]}
        context="lab"
      />
    </div>
  )
}
