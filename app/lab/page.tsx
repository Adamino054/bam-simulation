'use client'

import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Play, RotateCcw, Sliders,
  LineChart as ChartIcon, HelpCircle
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot
} from 'recharts'
import { InlineKatex, BlockKatex } from '@/components/ui/InlineKatex'
import { ThemeToggle } from '@/components/shell/ThemeToggle'

const AXIS_STYLE = { fontSize: 10, fill: 'var(--text-tertiary)', fontFamily: 'monospace' }

export default function LabPage() {
  const router = useRouter()

  // ── Structural Parameters ──
  const [kappa, setKappa] = useState(0.15) // Phillips sensitivity
  const [sigma, setSigma] = useState(0.12) // IS elasticity
  const [delta, setDelta] = useState(0.30) // openness degree
  const [beta, setBeta] = useState(0.95)   // expectations weight

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
  }

  const triggerDemandShock = () => {
    setDemandShock(2.0) // +2% Demand Shock
  }

  const triggerSupplyShock = () => {
    setSupplyShock(3.0) // +3% Oil/Import Shock
  }

  const triggerAgriShock = () => {
    setAgriShock(-2.5) // Negative agricultural harvest shock (-2.5%)
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
              Simulation Sandbox · Analyse IS-Phillips de BAM v3.0
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
            <div className="flex flex-col gap-2 mt-2">
              <span className="text-[10px] font-mono text-[var(--text-tertiary)]">Injecter des chocs asynchrones :</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={triggerDemandShock}
                  className="px-2.5 py-1.5 rounded text-[10px] font-mono font-bold uppercase transition-colors border hover:border-blue-500 hover:text-blue-400 bg-[var(--bg-elevated)] border-[var(--border-default)] text-[var(--text-secondary)]"
                >
                  Demand Shock (+2%)
                </button>
                <button
                  onClick={triggerSupplyShock}
                  className="px-2.5 py-1.5 rounded text-[10px] font-mono font-bold uppercase transition-colors border hover:border-yellow-600 hover:text-yellow-500 bg-[var(--bg-elevated)] border-[var(--border-default)] text-[var(--text-secondary)]"
                >
                  Supply Shock (+3%)
                </button>
                <button
                  onClick={triggerAgriShock}
                  className="px-2.5 py-1.5 rounded text-[10px] font-mono font-bold uppercase transition-colors border hover:border-emerald-600 hover:text-emerald-500 bg-[var(--bg-elevated)] border-[var(--border-default)] text-[var(--text-secondary)] col-span-2"
                >
                  Sécheresse Agricole (-2.5%)
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
                Cible BAM : 2.0 %
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

          {/* Curves Section Side-by-Side */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            
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
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <ReferenceLine x={0} stroke="var(--border-strong)" />
                    <ReferenceLine y={policyRate + 2.45 - inflationExpected} stroke="var(--border-subtle)" strokeDasharray="3 3" />
                    
                    {/* The IS curve line */}
                    <Line
                      type="monotone"
                      dataKey="lendingRate"
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
                {"Axe Y : Taux débiteur ($i^D$) | Axe X : Ecart de production (\\tilde{y}). La droite descend quand la sensibilité \\sigma augmente (fléchissement)."}
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
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <ReferenceLine x={0} stroke="var(--border-strong)" />
                    <ReferenceLine y={2.0} stroke="#B41923" strokeDasharray="4 4" opacity={0.3} label={{ value: 'Cible 2%', fill: '#B41923', fontSize: 9, position: 'insideTopRight' }} />

                    {/* The PC curve line */}
                    <Line
                      type="monotone"
                      dataKey="inflation"
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
                {"Axe Y : Inflation observée ($\\pi$) | Axe X : Ecart de production (\\tilde{y}). Plus la pente \\kappa est élevée, plus l'inflation réagit à la demande."}
              </p>
            </div>
          </div>

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
                  {"La courbe IS (Investment-Savings) traduit la demande de biens et services. La relation liant l'output gap $\\tilde{y}_t$ aux taux d'intérêt s'écrit :"}
                </p>
                <BlockKatex math="\tilde{y}_t = 0.70 \tilde{y}_{t-1} - \sigma (i^D_t - \pi^e_t) + \delta \tilde{y}^*_t + u^y_t" />
                <p className="mt-3">
                  En augmentant le curseur $\sigma$, vous observez que la droite de demande s&apos;aplatit, illustrant une économie extrêmement sensible au coût de financement. À l&apos;inverse, un $\sigma$ très bas caractérise un canal de transmission du crédit rigide.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-[var(--text-primary)] mb-2 uppercase font-mono text-[10px]">2. Le compromis inflation-activité de Phillips</h4>
                <p className="mb-3">
                  La courbe de Phillips traduit la dynamique de l&apos;offre. L&apos;inflation observée $\pi_t$ dépend positivement des anticipations de prix et des tensions productives :
                </p>
                <BlockKatex math="\pi_t = \beta \pi^e_t + \kappa \tilde{y}_t + 0.20 s^{agri}_t + u^\pi_t" />
                <p className="mt-3">
                  Le coefficient $\kappa$ représente la rigidité nominale des salaires et des prix. Si $\kappa$ est élevé (pente forte), le moindre écart de production positif déclenchera une spirale inflationniste (cas des économies en surchauffe).
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
