'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, FileText, ExternalLink } from 'lucide-react'
import { ThemeToggle } from '@/components/shell/ThemeToggle'

export default function AboutPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-base)' }}>
        <p className="label-caps" style={{ color: 'var(--text-tertiary)' }}>Chargement…</p>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-16 relative transition-colors duration-200"
      style={{ backgroundColor: 'var(--bg-base)' }}
    >
      {/* Premium Floating Theme Toggle */}
      <div className="absolute top-6 right-6 flex items-center gap-2">
        <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] hidden sm:inline-block">
          Thème
        </span>
        <ThemeToggle />
      </div>

      <div className="w-full max-w-2xl mx-auto">
        <p className="label-caps mb-4" style={{ color: 'var(--accent-primary)' }}>
          À propos du projet
        </p>
        <h1
          className="font-editorial-roman mb-6"
          style={{
            fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
          }}
        >
          Central Bank Simulator
        </h1>

        <div className="space-y-4 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          <p>
            Ce serious game est développé dans le cadre d'un Projet de Fin d'Année
            commandité par <strong style={{ color: 'var(--text-primary)' }}>la Banque centrale</strong>{' '}
            du Royaume du Maroc.
          </p>
          <p>
            Il constitue la composante jouable d'un moteur de simulation macroéconomique
            destiné à modéliser les mécanismes de transmission de la politique monétaire
            dans le contexte marocain.
          </p>
          <p>
            Le moteur de simulation — entièrement isolé du code d'interface — utilise
            désormais le moteur mathématique v5 : courbe IS et Phillips estimées, loi
            d'Okun trimestrielle, croissance par output gap annuel et résidus historiques.
            Quand l'utilisateur reproduit les choix BAM d'un scénario historique, le site
            retrouve les valeurs HCP validées pour l'inflation, l'output gap, la croissance
            et le chômage.
          </p>
          <p>
            Cette version web servira de support pédagogique pour illustrer les mécanismes
            de politique monétaire au grand public et aux étudiants.
          </p>
        </div>

        {/* ── Documents du projet ── */}
        <div className="mt-12">
          <p className="label-caps mb-4" style={{ color: 'var(--accent-primary)' }}>
            Documents du projet
          </p>
          <div className="grid gap-3">
            {[
              {
                href: '/docs/moteur-v5-validation.html',
                title: 'Moteur mathématique v5 — validation historique',
                desc: 'Équations actives, paramètres utilisés par le site et test de reproduction des scénarios BAM/HCP.',
              },
              {
                href: '/docs/business-model-canvas.html',
                title: 'Business Model Canvas — Éco Inclusif',
                desc: 'Le canvas complet du projet : proposition de valeur, segments, ressources et modèle économique.',
              },
              {
                href: '/docs/presentation-business-model.html',
                title: 'Présentation du Business Model',
                desc: 'La version présentation du canvas : mission d’inclusion économique et stratégie de diffusion.',
              },
              {
                href: '/docs/guide-fonctionnalites-cbs.pdf',
                title: 'Guide des fonctionnalités (PDF)',
                desc: "Toute l'application expliquée écran par écran — le document d'accueil des stagiaires.",
              },
            ].map(doc => (
              <a
                key={doc.href}
                href={doc.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-3 rounded-lg border p-4 transition-colors duration-200"
                style={{
                  borderColor: 'var(--border-subtle)',
                  backgroundColor: 'var(--bg-panel)',
                  textDecoration: 'none',
                }}
              >
                <FileText size={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
                <span className="flex-1">
                  <span className="block text-sm font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>
                    {doc.title}
                  </span>
                  <span className="block text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {doc.desc}
                  </span>
                </span>
                <ExternalLink
                  size={12}
                  className="mt-1 flex-shrink-0 opacity-40 transition-opacity duration-200 group-hover:opacity-100"
                  style={{ color: 'var(--text-tertiary)' }}
                />
              </a>
            ))}
          </div>
        </div>

        <div className="mt-10">
          <Link
            href="/"
            className="label-caps flex items-center gap-1.5 transition-colors duration-200 hover:text-[var(--text-primary)]"
            style={{ color: 'var(--text-tertiary)', textDecoration: 'none', display: 'inline-flex' }}
          >
            <ArrowLeft size={12} />
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  )
}
