'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  TrendingUp, Shield, Zap, BarChart3, Target, Users,
  ChevronRight, Landmark, ArrowRight, BookOpen,
} from 'lucide-react'
import { ThemeToggle } from '@/components/shell/ThemeToggle'
import { useAuthStore } from '@/store/authStore'

const TICKER_ITEMS = [
  'INFLATION  2,2 %  ▲',
  'PIB  3,2 %  ▲',
  'CHÔMAGE  11,0 %',
  'TMP  2,75 %',
  'CRÉDIBILITÉ  70',
  'SOLDE COURANT  −2,5 %',
  'CHANGE  100,0',
  'RÉSERVES  4,0 %',
]

const FEATURES = [
  {
    icon: TrendingUp,
    title: 'Politique monétaire',
    description: 'Fixez le taux directeur, ajustez les réserves obligatoires et gérez les opérations de marché comme un vrai gouverneur de banque centrale.',
  },
  {
    icon: Shield,
    title: 'Gestion de crise',
    description: "Affrontez des chocs pétroliers, des sécheresses, des fuites de capitaux et des récessions. Chaque décision compte pour stabiliser l'économie.",
  },
  {
    icon: Zap,
    title: '6 instruments',
    description: 'Taux directeur, réserves obligatoires, opérations de marché, forward guidance, intervention de change et facilité de prêt d\'urgence.',
  },
  {
    icon: BarChart3,
    title: 'Simulation réaliste',
    description: "Moteur calibré sur les données Bank Al-Maghrib : courbe de Phillips, courbe IS, canal du crédit, loi d'Okun et bien plus.",
  },
  {
    icon: Target,
    title: 'Objectif : 2 % d\'inflation',
    description: "Maintenez l'inflation proche de la cible tout en soutenant la croissance et l'emploi. Un équilibre délicat à trouver.",
  },
  {
    icon: Users,
    title: 'Suivi de performance',
    description: 'Historique complet de vos parties, scores, grades et statistiques détaillées. Améliorez-vous partie après partie.',
  },
]

const STEPS = [
  { number: '01', title: 'Créez votre profil', desc: 'Choisissez un pseudo et un mot de passe pour sauvegarder votre progression.' },
  { number: '02', title: 'Choisissez un scénario', desc: '4 scénarios disponibles : standard, choc inflationniste, COVID-2020, flexibilité du dirham.' },
  { number: '03', title: 'Prenez vos décisions', desc: 'Chaque trimestre, ajustez vos 6 instruments de politique monétaire.' },
  { number: '04', title: 'Analysez vos résultats', desc: 'Bilan détaillé avec score, comparaison Taylor et rapport de gouverneur.' },
]

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
}

export default function LandingPage() {
  const router = useRouter()
  const currentUser = useAuthStore(s => s.currentUser)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const handleCTA = () => {
    if (currentUser) {
      router.push('/dashboard')
    } else {
      router.push('/login')
    }
  }

  if (!mounted) return null

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--bg-base)', position: 'relative', overflow: 'hidden' }}
    >
      {/* ── Ambient glow ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', top: '-120px', left: '50%', transform: 'translateX(-50%)',
          width: '1200px', height: '700px',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(180,25,35,0.14) 0%, rgba(180,25,35,0.04) 40%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(240,240,234,0.04) 1px, transparent 1px)',
          backgroundSize: '32px 32px', pointerEvents: 'none', zIndex: 0,
        }}
      />

      <div className="relative flex flex-col min-h-screen" style={{ zIndex: 1 }}>

        {/* ══════ NAV ══════ */}
        <nav
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-center gap-3">
            <Landmark size={18} style={{ color: 'var(--accent-primary)' }} />
            <span className="font-editorial" style={{ color: 'var(--accent-primary)', fontSize: '1.15rem' }}>
              CBS
            </span>
            <span style={{ color: 'var(--border-default)' }}>·</span>
            <span className="label-caps hidden sm:block" style={{ color: 'var(--text-tertiary)' }}>
              Central Bank Simulator
            </span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {currentUser ? (
              <button
                onClick={() => router.push('/dashboard')}
                className="label-caps px-3 py-1.5 rounded-md transition-colors"
                style={{ backgroundColor: 'var(--accent-primary)', color: '#fff', border: 'none', cursor: 'pointer' }}
              >
                Dashboard
              </button>
            ) : (
              <button
                onClick={() => router.push('/login')}
                className="label-caps px-3 py-1.5 rounded-md transition-colors"
                style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-default)', cursor: 'pointer' }}
              >
                Se connecter
              </button>
            )}
          </div>
        </nav>

        {/* ══════ TICKER ══════ */}
        <div
          className="overflow-hidden"
          style={{ backgroundColor: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)', height: '28px' }}
        >
          <div className="flex items-center h-full whitespace-nowrap" style={{ animation: 'ticker-scroll 30s linear infinite' }}>
            {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <span key={i} className="font-mono text-[10px] font-semibold tabular mx-4" style={{ color: 'var(--text-tertiary)' }}>
                {item}
                <span className="mx-3" style={{ color: 'var(--border-subtle)' }}>·</span>
              </span>
            ))}
          </div>
        </div>

        {/* ══════ HERO ══════ */}
        <section className="flex-1 flex flex-col items-center justify-center px-6 pt-20 pb-16 max-w-5xl mx-auto w-full text-center">
          <motion.div {...fadeUp}>
            {/* Live badge */}
            <div
              className="inline-flex items-center gap-2 mb-10 px-4 py-1.5 rounded-full"
              style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-default)' }}
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse-soft" style={{ backgroundColor: 'var(--accent-primary)' }} />
              <span className="label-caps" style={{ letterSpacing: '0.12em' }}>
                Serious Game · Politique Monétaire · Maroc 2025
              </span>
            </div>
          </motion.div>

          <motion.h1
            className="font-editorial mb-6"
            style={{
              fontSize: 'clamp(3rem, 8vw, 7.5rem)',
              letterSpacing: '-0.03em',
              lineHeight: 0.9,
              color: 'var(--text-primary)',
            }}
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.1 }}
          >
            Pilotez<br />l&apos;économie<br />marocaine.
          </motion.h1>

          <motion.p
            className="text-lg mb-4 max-w-lg"
            style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.2 }}
          >
            Incarnez le gouverneur de Bank Al-Maghrib.
            <br />Cinq ans, six instruments, une cible : <strong style={{ color: 'var(--accent-primary)' }}>2&nbsp;% d&apos;inflation</strong>.
          </motion.p>

          <motion.p
            className="text-sm mb-12 max-w-xl leading-relaxed"
            style={{ color: 'var(--text-tertiary)' }}
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.3 }}
          >
            Naviguez entre stabilité des prix, croissance économique et chocs imprévisibles.
            Chaque décision a des conséquences — serez-vous à la hauteur du mandat ?
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-3"
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.4 }}
          >
            <button
              onClick={handleCTA}
              className="px-8 py-4 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, #C41923 0%, #8B131B 100%)',
                color: '#fff', border: 'none', cursor: 'pointer',
                letterSpacing: '0.06em',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2), 0 4px 20px rgba(180,25,35,0.3)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.2), 0 8px 32px rgba(180,25,35,0.45)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.2), 0 4px 20px rgba(180,25,35,0.3)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
              }}
            >
              {currentUser ? 'Accéder au tableau de bord' : 'Commencer gratuitement'}
              <ArrowRight size={16} />
            </button>
            <a
              href="#comment-ca-marche"
              className="px-8 py-4 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200"
              style={{
                backgroundColor: 'var(--bg-panel)', color: 'var(--text-primary)',
                border: '1px solid var(--border-default)', textDecoration: 'none', cursor: 'pointer',
              }}
            >
              <BookOpen size={14} />
              Comment ça marche
            </a>
          </motion.div>
        </section>

        {/* ══════ FEATURES ══════ */}
        <section className="px-6 py-20 max-w-6xl mx-auto w-full">
          <motion.div className="text-center mb-16" {...fadeUp}>
            <span className="label-caps block mb-3" style={{ color: 'var(--accent-primary)' }}>Fonctionnalités</span>
            <h2 className="font-editorial-roman text-3xl sm:text-4xl mb-4" style={{ color: 'var(--text-primary)' }}>
              Un simulateur complet
            </h2>
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
                  className="rounded-lg p-6 transition-all duration-200"
                  style={{
                    backgroundColor: 'var(--bg-panel)',
                    border: '1px solid var(--border-default)',
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(180,25,35,0.3)';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)';
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                  }}
                  {...fadeUp}
                  transition={{ ...fadeUp.transition, delay: i * 0.08 }}
                >
                  <div
                    className="w-10 h-10 rounded-md flex items-center justify-center mb-4"
                    style={{ backgroundColor: 'rgba(180,25,35,0.1)' }}
                  >
                    <Icon size={20} style={{ color: 'var(--accent-primary)' }} />
                  </div>
                  <h3 className="font-semibold text-sm mb-2" style={{ color: 'var(--text-primary)' }}>{feat.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>{feat.description}</p>
                </motion.div>
              )
            })}
          </div>
        </section>

        {/* ══════ HOW IT WORKS ══════ */}
        <section id="comment-ca-marche" className="px-6 py-20 max-w-4xl mx-auto w-full" style={{ scrollMarginTop: '80px' }}>
          <motion.div className="text-center mb-16" {...fadeUp}>
            <span className="label-caps block mb-3" style={{ color: 'var(--accent-warm)' }}>En 4 étapes</span>
            <h2 className="font-editorial-roman text-3xl sm:text-4xl mb-4" style={{ color: 'var(--text-primary)' }}>
              Comment ça marche ?
            </h2>
            <p className="text-sm max-w-lg mx-auto" style={{ color: 'var(--text-tertiary)' }}>
              Pas besoin d&apos;être économiste — le jeu est conçu pour être accessible à tous.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.number}
                className="rounded-lg p-6 flex gap-4"
                style={{
                  backgroundColor: 'var(--bg-panel)',
                  border: '1px solid var(--border-subtle)',
                }}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.1 }}
              >
                <span
                  className="font-editorial text-2xl flex-shrink-0"
                  style={{ color: 'var(--accent-primary)', opacity: 0.4 }}
                >
                  {step.number}
                </span>
                <div>
                  <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{step.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ══════ CONCEPTS ══════ */}
        <section className="px-6 py-20" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <div className="max-w-4xl mx-auto">
            <motion.div className="text-center mb-16" {...fadeUp}>
              <span className="label-caps block mb-3" style={{ color: 'var(--accent-cool)' }}>Pour tous les niveaux</span>
              <h2 className="font-editorial-roman text-3xl sm:text-4xl mb-4" style={{ color: 'var(--text-primary)' }}>
                Les concepts expliqués simplement
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  q: "C'est quoi le taux directeur ?",
                  a: "C'est le \"prix de l'argent\" que la banque centrale fixe. Quand il monte, les crédits coûtent plus cher → les gens et les entreprises empruntent moins → l'économie ralentit et l'inflation baisse. Et inversement.",
                },
                {
                  q: "C'est quoi l'inflation ?",
                  a: "C'est la hausse générale des prix. Si le pain coûtait 1 DH et coûte maintenant 1,02 DH, l'inflation est de 2 %. Bank Al-Maghrib vise 2 % par an : assez pour que l'économie avance, pas assez pour éroder le pouvoir d'achat.",
                },
                {
                  q: "Pourquoi c'est difficile ?",
                  a: "Parce que les effets de vos décisions mettent 2-3 trimestres à se manifester. Quand vous voyez l'inflation monter, il est déjà tard. Il faut anticiper. Et des chocs imprévisibles (pétrole, sécheresse) viennent tout bouleverser.",
                },
                {
                  q: "C'est quoi la crédibilité ?",
                  a: "Si les entreprises et les ménages font confiance à la banque centrale, ils n'augmentent pas leurs prix par anticipation. La crédibilité se construit lentement (en tenant ses promesses) et se perd vite (décisions erratiques).",
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  className="rounded-lg p-5"
                  style={{
                    backgroundColor: 'var(--bg-panel)',
                    border: '1px solid var(--border-subtle)',
                    borderLeft: '3px solid var(--accent-cool)',
                  }}
                  {...fadeUp}
                  transition={{ ...fadeUp.transition, delay: i * 0.08 }}
                >
                  <h3 className="font-semibold text-sm mb-2" style={{ color: 'var(--text-primary)' }}>{item.q}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>{item.a}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════ CTA FINAL ══════ */}
        <section className="px-6 py-20 text-center" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <motion.div className="max-w-lg mx-auto" {...fadeUp}>
            <h2 className="font-editorial text-4xl sm:text-5xl mb-4" style={{ color: 'var(--text-primary)' }}>
              Prêt à gouverner ?
            </h2>
            <p className="text-sm mb-8" style={{ color: 'var(--text-tertiary)' }}>
              Créez votre profil en 10 secondes et lancez votre première simulation.
            </p>
            <button
              onClick={handleCTA}
              className="px-10 py-4 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 mx-auto transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, #C41923 0%, #8B131B 100%)',
                color: '#fff', border: 'none', cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2), 0 4px 20px rgba(180,25,35,0.3)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
              }}
            >
              {currentUser ? 'Aller au dashboard' : 'Créer mon profil'}
              <ChevronRight size={16} />
            </button>
          </motion.div>
        </section>

        {/* ══════ FOOTER ══════ */}
        <footer className="px-6 py-6 text-center" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <p className="label-caps" style={{ color: 'var(--text-tertiary)' }}>
            Projet de Fin d&apos;Année 2025 · Bank Al-Maghrib · Simulateur de politique monétaire
          </p>
        </footer>
      </div>
    </div>
  )
}
