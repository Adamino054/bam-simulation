'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import {
  TrendingUp, Shield, Zap, BarChart3, Target, Users,
  ChevronRight, Landmark, ArrowRight, BookOpen,
  GraduationCap, History, Percent, Activity, Calculator,
  Network, LineChart as LineChartIcon,
} from 'lucide-react'
import { ThemeToggle } from '@/components/shell/ThemeToggle'
import { useAuthStore } from '@/store/authStore'
import { EcoPreviewChart } from '@/components/ui/EcoPreviewChart'

// ── Ticker data ─────────────────────────────────────────────────────────────
const TICKER_ITEMS = [
  'INFLATION  2,2 %  ▲', 'PIB  3,2 %  ▲', 'CHÔMAGE  11,0 %',
  'TMP  2,75 %', 'CRÉDIBILITÉ  70', 'SOLDE COURANT  −2,5 %',
  'CHANGE  100,0', 'RÉSERVES  4,0 %', 'NPL  7,5 %', 'OUTPUT GAP  0,0 %',
]

// ── Feature cards ────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: TrendingUp, title: 'Politique monétaire', color: '#B41923', description: 'Fixez le taux directeur, ajustez les réserves obligatoires et gérez les opérations de marché comme un vrai gouverneur de banque centrale.' },
  { icon: Shield,     title: 'Gestion de crise',     color: '#5C7E92', description: "Affrontez des chocs pétroliers, sécheresses, fuites de capitaux et récessions. Chaque décision a des conséquences sur l'économie réelle." },
  { icon: Zap,        title: '6 instruments',         color: '#C9A86A', description: 'Taux directeur, réserves, opérations de marché, forward guidance, intervention de change et emergency lending.' },
  { icon: BarChart3,  title: 'Simulation réaliste',   color: '#4A9D7C', description: "Moteur calibré sur les données BAM : courbe IS, courbe de Phillips, canal du crédit, loi d'Okun, règle de Taylor." },
  { icon: Target,     title: '2 % d\'inflation',       color: '#C25450', description: "Maintenez l'inflation proche de la cible tout en soutenant la croissance. Un équilibre délicat à maîtriser." },
  { icon: Users,      title: 'Suivi de performance',  color: '#C9A86A', description: 'Historique complet de vos parties, scores, grades et statistiques. Comparez-vous à la règle de Taylor.' },
]

const STEPS = [
  { number: '01', title: 'Créez votre profil',      desc: 'Choisissez un pseudo et un mot de passe pour sauvegarder votre progression et consulter votre historique.' },
  { number: '02', title: 'Choisissez un scénario',   desc: '4 scénarios disponibles : standard, choc inflationniste, COVID-2020, flexibilité du dirham.' },
  { number: '03', title: 'Prenez vos décisions',     desc: 'Chaque trimestre, ajustez vos 6 instruments de politique monétaire face aux chocs imprévisibles.' },
  { number: '04', title: 'Analysez vos résultats',   desc: 'Bilan détaillé avec score, comparaison Taylor et rapport de gouverneur personnalisé.' },
]

// ── Course modules preview ───────────────────────────────────────────────────
const COURSE_PREVIEWS = [
  { num: '01', title: 'Politique monétaire',    subtitle: 'Le mandat de BAM',          icon: Landmark,       color: '#5C7E92', category: 'Fondamentaux' },
  { num: '02', title: 'Le taux directeur',      subtitle: 'Transmission et effets',    icon: Percent,        color: '#B41923', category: 'Instruments' },
  { num: '03', title: 'Courbe IS & Output Gap', subtitle: 'Demande agrégée',           icon: LineChartIcon,  color: '#4A9D7C', category: 'Modèles' },
  { num: '04', title: 'Courbe de Phillips',     subtitle: 'Inflation & activité',      icon: Activity,       color: '#4A9D7C', category: 'Modèles' },
  { num: '05', title: 'Canaux de transmission', subtitle: '4 mécanismes d\'action',   icon: Network,        color: '#C9A86A', category: 'Mécanismes' },
  { num: '06', title: 'Règle de Taylor',        subtitle: 'Stratégie optimale',        icon: Calculator,     color: '#C9A86A', category: 'Stratégie' },
]

// ── Ambient floating metrics ─────────────────────────────────────────────────
const AMBIENT_METRICS = [
  { label: 'π = 2,2%', x: '8%',  y: '20%', delay: 0    },
  { label: 'ỹ = 0,0%', x: '88%', y: '15%', delay: 0.8  },
  { label: 'i* = 2,75%', x: '5%', y: '65%', delay: 1.6 },
  { label: 'NPL 7,5%', x: '90%', y: '60%', delay: 2.4  },
  { label: 'u = 11%',  x: '15%', y: '80%', delay: 3.2  },
  { label: 'r* = 1,5%', x: '82%', y: '80%', delay: 0.4 },
]

// ── Live stats ───────────────────────────────────────────────────────────────
const LIVE_STATS = [
  { label: 'Trimestres simulés', value: '20', suffix: '/partie', icon: BarChart3 },
  { label: 'Instruments', value: '6', suffix: ' outils', icon: Zap },
  { label: 'Scénarios',  value: '4', suffix: ' contextes', icon: Target },
  { label: 'Modules pédagogiques', value: '8', suffix: ' leçons', icon: GraduationCap },
]

// ── Framer Motion variants ───────────────────────────────────────────────────
const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
}

const stagger = (i: number, base = 0) => ({
  ...fadeUp,
  transition: { ...fadeUp.transition, delay: base + i * 0.08 },
})

// ── Counter hook ─────────────────────────────────────────────────────────────
function useCounter(target: number, duration = 1200, startOnView = true) {
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(!startOnView)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!startOnView) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true) }, { threshold: 0.1 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [startOnView])

  useEffect(() => {
    if (!started) return
    const start = performance.now()
    const raf = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - p, 3)
      setCount(Math.round(ease * target))
      if (p < 1) requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
  }, [started, target, duration])

  return { count, ref }
}

// ── Stat counter sub-component ───────────────────────────────────────────────
function StatCounter({ target, suffix, label, icon: Icon }: {
  target: number; suffix: string; label: string; icon: React.ElementType
}) {
  const { count, ref } = useCounter(target, 1000)
  return (
    <div ref={ref} className="flex flex-col items-center text-center gap-1">
      <Icon size={16} style={{ color: 'var(--accent-primary)', marginBottom: '4px' }} />
      <span className="font-editorial" style={{ fontSize: '2.2rem', color: 'var(--text-primary)', lineHeight: 1 }}>
        {count}
        <span style={{ fontSize: '1rem', color: 'var(--text-tertiary)' }}>{suffix}</span>
      </span>
      <span className="label-caps" style={{ color: 'var(--text-tertiary)', fontSize: '9px' }}>{label}</span>
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter()
  const currentUser = useAuthStore(s => s.currentUser)
  const [mounted, setMounted] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll()
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0])
  const heroY = useTransform(scrollY, [0, 300], [0, -60])

  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  const handleCTA = () => router.push(currentUser ? '/dashboard' : '/login')

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-base)', position: 'relative', overflow: 'hidden' }}>

      {/* ── CSS inline ──────────────────────────────────────────────────── */}
      <style>{`
        @keyframes float-gentle {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33%  { transform: translateY(-6px) rotate(0.5deg); }
          66%  { transform: translateY(-3px) rotate(-0.5deg); }
        }
        @keyframes shimmer-scan {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes gradient-border {
          0%, 100% { border-color: rgba(180,25,35,0.3); }
          50%       { border-color: rgba(201,168,106,0.5); }
        }
        @keyframes particle-drift {
          0%   { transform: translate(0,0) scale(1); opacity: 0.15; }
          50%  { transform: translate(10px,-15px) scale(1.1); opacity: 0.25; }
          100% { transform: translate(0,0) scale(1); opacity: 0.15; }
        }
        .ambient-metric {
          animation: float-gentle var(--dur, 6s) ease-in-out infinite;
          animation-delay: var(--delay, 0s);
        }
        .shimmer-text {
          background: linear-gradient(90deg, var(--text-primary) 0%, #C9A86A 45%, var(--text-primary) 55%, var(--text-primary) 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer-scan 4s linear infinite;
        }
        .card-hover-lift {
          transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease, border-color 0.25s ease;
        }
        .card-hover-lift:hover {
          transform: translateY(-4px) scale(1.01);
          box-shadow: 0 12px 40px rgba(0,0,0,0.35);
        }
        .nav-link {
          position: relative;
          transition: color 0.2s;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -2px; left: 0; right: 0;
          height: 1px;
          background: var(--accent-primary);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.25s ease;
        }
        .nav-link:hover::after { transform: scaleX(1); }
      `}</style>

      {/* ── Ambient background ──────────────────────────────────────────── */}
      <div aria-hidden="true" style={{ position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)', width: '1400px', height: '800px', background: 'radial-gradient(ellipse at 50% 0%, rgba(180,25,35,0.12) 0%, rgba(180,25,35,0.03) 45%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div aria-hidden="true" style={{ position: 'absolute', top: '40%', right: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(201,168,106,0.04) 0%, transparent 60%)', pointerEvents: 'none', zIndex: 0 }} />
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(240,240,234,0.035) 1px, transparent 1px)', backgroundSize: '28px 28px', pointerEvents: 'none', zIndex: 0 }} />

      <div className="relative flex flex-col min-h-screen" style={{ zIndex: 1 }}>

        {/* ══ NAV ══════════════════════════════════════════════════════════ */}
        <motion.nav
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--border-subtle)', backdropFilter: 'blur(8px)', backgroundColor: 'rgba(14,15,18,0.7)', position: 'sticky', top: 0, zIndex: 50 }}
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Landmark size={18} style={{ color: 'var(--accent-primary)' }} />
              <span className="font-editorial" style={{ color: 'var(--accent-primary)', fontSize: '1.15rem' }}>CBS</span>
              <span style={{ color: 'var(--border-default)' }}>·</span>
              <span className="label-caps hidden sm:block" style={{ color: 'var(--text-tertiary)' }}>Central Bank Simulator</span>
            </div>
            <div className="hidden md:flex items-center gap-4 ml-4" style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '16px' }}>
              <a href="/courses" className="nav-link label-caps" style={{ color: 'var(--text-tertiary)', textDecoration: 'none', fontSize: '10px' }}>
                Cours
              </a>
              {currentUser && (
                <a href="/history" className="nav-link label-caps" style={{ color: 'var(--text-tertiary)', textDecoration: 'none', fontSize: '10px' }}>
                  Historique
                </a>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {currentUser ? (
              <button onClick={() => router.push('/dashboard')} className="label-caps px-3 py-1.5 rounded-md transition-all" style={{ backgroundColor: 'var(--accent-primary)', color: '#fff', border: 'none', cursor: 'pointer' }}>
                Dashboard
              </button>
            ) : (
              <button onClick={() => router.push('/login')} className="label-caps px-3 py-1.5 rounded-md transition-all" style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-default)', cursor: 'pointer' }}>
                Se connecter
              </button>
            )}
          </div>
        </motion.nav>

        {/* ══ TICKER ════════════════════════════════════════════════════════ */}
        <div className="overflow-hidden" style={{ backgroundColor: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)', height: '26px' }}>
          <div className="flex items-center h-full whitespace-nowrap" style={{ animation: 'ticker-scroll 35s linear infinite' }}>
            {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <span key={i} className="font-mono text-[10px] font-semibold tabular mx-4" style={{ color: 'var(--text-tertiary)' }}>
                {item}<span className="mx-3" style={{ color: 'var(--border-subtle)' }}>·</span>
              </span>
            ))}
          </div>
        </div>

        {/* ══ HERO ═════════════════════════════════════════════════════════ */}
        <section ref={heroRef} className="relative flex-1 flex flex-col items-center justify-center px-6 pt-20 pb-16 max-w-5xl mx-auto w-full text-center" style={{ minHeight: '80vh' }}>

          {/* Floating ambient metrics */}
          {AMBIENT_METRICS.map((m, i) => (
            <div
              key={i}
              className="ambient-metric absolute hidden lg:block select-none pointer-events-none"
              style={{
                left: m.x, top: m.y,
                '--dur': `${5.5 + i * 0.7}s`,
                '--delay': `${m.delay}s`,
                fontFamily: 'monospace',
                fontSize: '10px',
                color: 'var(--text-tertiary)',
                opacity: 0.35,
                letterSpacing: '0.05em',
              } as React.CSSProperties}
            >
              {m.label}
            </div>
          ))}

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 mb-10 px-4 py-1.5 rounded-full" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-default)', animation: 'gradient-border 3s ease-in-out infinite' }}>
              <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse-soft" style={{ backgroundColor: 'var(--accent-primary)' }} />
              <span className="label-caps" style={{ letterSpacing: '0.12em' }}>Serious Game · Politique Monétaire · Maroc 2025</span>
            </div>
          </motion.div>

          <motion.style
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0 }}
          />

          <motion.h1
            className="font-editorial mb-6"
            style={{ fontSize: 'clamp(3.2rem, 8.5vw, 8rem)', letterSpacing: '-0.03em', lineHeight: 0.88, color: 'var(--text-primary)' }}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            Pilotez<br />
            <span className="shimmer-text">l&apos;économie</span><br />
            marocaine.
          </motion.h1>

          <motion.p
            className="text-lg mb-3 max-w-lg"
            style={{ color: 'var(--text-secondary)', lineHeight: 1.65 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            Incarnez le gouverneur de Bank Al-Maghrib.
            <br />Cinq ans, six instruments, une cible :{' '}
            <strong style={{ color: 'var(--accent-primary)' }}>2&nbsp;% d&apos;inflation</strong>.
          </motion.p>

          <motion.p
            className="text-sm mb-12 max-w-xl leading-relaxed"
            style={{ color: 'var(--text-tertiary)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.38 }}
          >
            Naviguez entre stabilité des prix, croissance et chocs imprévisibles.
            Apprenez la macroéconomie en la vivant — trimestre par trimestre.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-3 mb-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <button
              onClick={handleCTA}
              className="px-8 py-4 rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #C41923 0%, #8B131B 100%)', color: '#fff', border: 'none', cursor: 'pointer', letterSpacing: '0.06em', boxShadow: '0 1px 3px rgba(0,0,0,0.2), 0 4px 24px rgba(180,25,35,0.35)', transition: 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px) scale(1.02)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 40px rgba(180,25,35,0.5)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.2), 0 4px 24px rgba(180,25,35,0.35)' }}
            >
              {currentUser ? 'Accéder au tableau de bord' : 'Commencer gratuitement'}
              <ArrowRight size={16} />
            </button>
            <a
              href="/courses"
              className="px-8 py-4 rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
              style={{ backgroundColor: 'var(--bg-panel)', color: 'var(--text-primary)', border: '1px solid var(--border-default)', textDecoration: 'none', transition: 'all 0.2s ease' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,168,106,0.4)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)'; (e.currentTarget as HTMLElement).style.transform = '' }}
            >
              <GraduationCap size={15} />
              Cours macroéconomiques
            </a>
          </motion.div>

          <motion.a
            href="#comment-ca-marche"
            className="text-xs flex items-center gap-1.5 mx-auto"
            style={{ color: 'var(--text-tertiary)', textDecoration: 'none' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <motion.span animate={{ y: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 2 }}>↓</motion.span>
            Comment ça marche
          </motion.a>
        </section>

        {/* ══ ECO PREVIEW ══════════════════════════════════════════════════ */}
        <section className="px-6 pb-20 max-w-5xl mx-auto w-full">
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="label-caps block mb-3" style={{ color: 'var(--accent-primary)' }}>Simulateur en action</span>
            <h2 className="font-editorial-roman text-2xl sm:text-3xl mb-2" style={{ color: 'var(--text-primary)' }}>
              Choc inflationniste 2022 — résolution en 20 trimestres
            </h2>
            <p className="text-xs max-w-md mx-auto" style={{ color: 'var(--text-tertiary)', lineHeight: 1.7 }}>
              Inflation à 7,9 % · Hausses successives à 3,00 % · Retour à la cible 2 % en T14.
              C&apos;est exactement ce que vous piloterez dans le simulateur.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <EcoPreviewChart />
          </motion.div>
        </section>

        {/* ══ LIVE STATS BAR ═══════════════════════════════════════════════ */}
        <motion.section
          className="py-8 px-6"
          style={{ borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-panel)' }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6">
            {LIVE_STATS.map(stat => (
              <StatCounter
                key={stat.label}
                target={parseInt(stat.value)}
                suffix={stat.suffix}
                label={stat.label}
                icon={stat.icon}
              />
            ))}
          </div>
        </motion.section>

        {/* ══ FEATURES ═════════════════════════════════════════════════════ */}
        <section className="px-6 py-20 max-w-6xl mx-auto w-full">
          <motion.div className="text-center mb-16" {...fadeUp}>
            <span className="label-caps block mb-3" style={{ color: 'var(--accent-primary)' }}>Fonctionnalités</span>
            <h2 className="font-editorial-roman text-3xl sm:text-4xl mb-4" style={{ color: 'var(--text-primary)' }}>Un simulateur complet</h2>
            <p className="text-sm max-w-lg mx-auto" style={{ color: 'var(--text-tertiary)' }}>
              Conçu pour reproduire fidèlement les mécanismes de transmission de la politique monétaire marocaine.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((feat, i) => {
              const Icon = feat.icon
              return (
                <motion.div
                  key={feat.title}
                  className="card-hover-lift rounded-lg p-6"
                  style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-default)', cursor: 'default' }}
                  {...stagger(i, 0)}
                >
                  <div className="w-10 h-10 rounded-md flex items-center justify-center mb-4" style={{ backgroundColor: `${feat.color}18` }}>
                    <Icon size={20} style={{ color: feat.color }} />
                  </div>
                  <h3 className="font-semibold text-sm mb-2" style={{ color: 'var(--text-primary)' }}>{feat.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>{feat.description}</p>
                </motion.div>
              )
            })}
          </div>
        </section>

        {/* ══ HOW IT WORKS ═════════════════════════════════════════════════ */}
        <section id="comment-ca-marche" className="px-6 py-20 max-w-4xl mx-auto w-full" style={{ scrollMarginTop: '80px' }}>
          <motion.div className="text-center mb-16" {...fadeUp}>
            <span className="label-caps block mb-3" style={{ color: 'var(--accent-warm)' }}>En 4 étapes</span>
            <h2 className="font-editorial-roman text-3xl sm:text-4xl mb-4" style={{ color: 'var(--text-primary)' }}>Comment ça marche ?</h2>
            <p className="text-sm max-w-lg mx-auto" style={{ color: 'var(--text-tertiary)' }}>
              Accessible à tous — pas besoin d&apos;être économiste pour comprendre les fondamentaux.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.number}
                className="card-hover-lift rounded-lg p-6 flex gap-4"
                style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-subtle)' }}
                {...stagger(i, 0.05)}
              >
                <span className="font-editorial text-3xl flex-shrink-0" style={{ color: 'var(--accent-primary)', opacity: 0.35, lineHeight: 1.1 }}>{step.number}</span>
                <div>
                  <h3 className="font-semibold text-sm mb-1.5" style={{ color: 'var(--text-primary)' }}>{step.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ══ COURSES PREVIEW ══════════════════════════════════════════════ */}
        <section className="px-6 py-20" style={{ borderTop: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-panel)' }}>
          <div className="max-w-6xl mx-auto">
            <motion.div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-12" {...fadeUp}>
              <div>
                <span className="label-caps block mb-3" style={{ color: 'var(--accent-cool)' }}>Apprendre</span>
                <h2 className="font-editorial-roman text-3xl sm:text-4xl mb-2" style={{ color: 'var(--text-primary)' }}>Cours de macroéconomie</h2>
                <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>8 modules structurés pour comprendre chaque mécanisme du simulateur.</p>
              </div>
              <a
                href="/courses"
                className="mt-4 sm:mt-0 label-caps flex items-center gap-1.5 px-4 py-2 rounded-md flex-shrink-0"
                style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--accent-cool)', border: '1px solid var(--border-default)', textDecoration: 'none', transition: 'all 0.2s ease' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(92,126,146,0.4)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)' }}
              >
                Voir tous les modules <ChevronRight size={12} />
              </a>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {COURSE_PREVIEWS.map((c, i) => {
                const Icon = c.icon
                return (
                  <motion.a
                    key={c.num}
                    href="/courses"
                    className="card-hover-lift rounded-lg p-5 flex gap-4 items-start"
                    style={{ backgroundColor: 'var(--bg-elevated)', border: `1px solid var(--border-subtle)`, borderLeft: `3px solid ${c.color}`, textDecoration: 'none' }}
                    {...stagger(i, 0.05)}
                  >
                    <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: `${c.color}18` }}>
                      <Icon size={15} style={{ color: c.color }} />
                    </div>
                    <div>
                      <span className="label-caps block mb-1" style={{ color: c.color, fontSize: '8px' }}>{c.category}</span>
                      <span className="font-semibold text-xs block mb-0.5" style={{ color: 'var(--text-primary)' }}>
                        <span style={{ color: 'var(--text-tertiary)', fontFamily: 'monospace', marginRight: '4px' }}>{c.num}.</span>
                        {c.title}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{c.subtitle}</span>
                    </div>
                  </motion.a>
                )
              })}
            </div>
          </div>
        </section>

        {/* ══ CONCEPTS ═════════════════════════════════════════════════════ */}
        <section className="px-6 py-20" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <div className="max-w-4xl mx-auto">
            <motion.div className="text-center mb-16" {...fadeUp}>
              <span className="label-caps block mb-3" style={{ color: 'var(--accent-cool)' }}>Pour tous les niveaux</span>
              <h2 className="font-editorial-roman text-3xl sm:text-4xl mb-4" style={{ color: 'var(--text-primary)' }}>Les concepts expliqués simplement</h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                { q: "C'est quoi le taux directeur ?", a: "C'est le \"prix de l'argent\" que la banque centrale fixe. Quand il monte, les crédits coûtent plus cher → les gens empruntent moins → l'économie ralentit et l'inflation baisse. Et inversement.", color: '#B41923' },
                { q: "C'est quoi l'inflation ?",        a: "La hausse générale des prix. Si le pain coûtait 1 DH et coûte 1,02 DH, l'inflation est de 2 %. Bank Al-Maghrib vise 2 %/an : assez pour que l'économie avance, pas assez pour éroder le pouvoir d'achat.", color: '#4A9D7C' },
                { q: "Pourquoi c'est difficile ?",      a: "Les effets de vos décisions mettent 2-3 trimestres à se manifester. Quand vous voyez l'inflation monter, il est déjà tard. Il faut anticiper — et des chocs imprévisibles viennent tout bouleverser.", color: '#C9A86A' },
                { q: "C'est quoi la crédibilité ?",     a: "Si les entreprises font confiance à la banque centrale, elles n'augmentent pas leurs prix par anticipation. La crédibilité se construit lentement et se perd vite (décisions erratiques).", color: '#5C7E92' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  className="card-hover-lift rounded-lg p-5"
                  style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderLeft: `3px solid ${item.color}` }}
                  {...stagger(i, 0.05)}
                >
                  <h3 className="font-semibold text-sm mb-2.5" style={{ color: 'var(--text-primary)' }}>{item.q}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>{item.a}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ CTA FINAL ════════════════════════════════════════════════════ */}
        <section className="px-6 py-24 text-center" style={{ borderTop: '1px solid var(--border-subtle)', background: 'radial-gradient(ellipse at 50% 100%, rgba(180,25,35,0.08) 0%, transparent 60%)' }}>
          <motion.div className="max-w-lg mx-auto" {...fadeUp}>
            <span className="label-caps block mb-6" style={{ color: 'var(--text-tertiary)' }}>Bank Al-Maghrib · Simulateur Officiel</span>
            <h2 className="font-editorial text-4xl sm:text-5xl mb-5" style={{ color: 'var(--text-primary)', lineHeight: 0.95 }}>
              Prêt à<br />gouverner ?
            </h2>
            <p className="text-sm mb-10" style={{ color: 'var(--text-tertiary)', lineHeight: 1.7 }}>
              Créez votre profil en 10 secondes et lancez votre première simulation.<br />
              Ou commencez par les cours pour maîtriser les concepts.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleCTA}
                className="px-10 py-4 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 mx-auto sm:mx-0"
                style={{ background: 'linear-gradient(135deg, #C41923 0%, #8B131B 100%)', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.2), 0 4px 24px rgba(180,25,35,0.35)', transition: 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 40px rgba(180,25,35,0.5)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.2), 0 4px 24px rgba(180,25,35,0.35)' }}
              >
                {currentUser ? 'Aller au dashboard' : 'Créer mon profil'}
                <ChevronRight size={16} />
              </button>
              <a
                href="/courses"
                className="px-8 py-4 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 mx-auto sm:mx-0"
                style={{ backgroundColor: 'var(--bg-panel)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)', textDecoration: 'none', transition: 'all 0.2s ease' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = '' }}
              >
                <BookOpen size={14} />
                Accéder aux cours
              </a>
            </div>
          </motion.div>
        </section>

        {/* ══ FOOTER ════════════════════════════════════════════════════════ */}
        <footer className="px-6 py-6" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Landmark size={14} style={{ color: 'var(--accent-primary)' }} />
              <span className="label-caps" style={{ color: 'var(--text-tertiary)' }}>CBS · Projet de Fin d&apos;Année 2025 · Bank Al-Maghrib</span>
            </div>
            <div className="flex items-center gap-6">
              {[
                { href: '/courses', label: 'Cours' },
                { href: currentUser ? '/history' : '/login', label: 'Historique' },
                { href: '/about', label: 'À propos' },
              ].map(link => (
                <a key={link.href} href={link.href} className="label-caps nav-link" style={{ color: 'var(--text-tertiary)', textDecoration: 'none', fontSize: '9px' }}>
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </footer>

      </div>
    </div>
  )
}
