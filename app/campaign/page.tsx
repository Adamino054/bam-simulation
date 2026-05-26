'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Play, ShieldAlert, Award, Calendar, HelpCircle, FileText } from 'lucide-react'
import { CAMPAIGNS, type CampaignConfig } from '@/engine/campaigns'
import { useGameStore } from '@/store/gameStore'
import { BlockKatex, MarkdownText } from '@/components/ui/InlineKatex'
import { ThemeToggle } from '@/components/shell/ThemeToggle'

export default function CampaignPage() {
  const router = useRouter()
  const startGame = useGameStore(s => s.startGame)
  const [selectedId, setSelectedId] = useState<string>('volcker1979')

  const activeCampaign = CAMPAIGNS[selectedId]

  const handleStartMission = (id: string) => {
    // Launch campaign scenario with chosen difficulty
    startGame(id as any)
    router.push('/play')
  }

  return (
    <div
      className="min-h-screen flex flex-col font-inter transition-colors duration-200"
      style={{
        backgroundColor: 'var(--bg-base)',
        color: 'var(--text-primary)',
        backgroundImage: 'radial-gradient(circle at bottom left, rgba(var(--accent-primary-rgb), 0.03) 0%, transparent 60%)'
      }}
    >
      {/* Header briefing room */}
      <header
        className="px-6 py-4 flex items-center justify-between border-b transition-colors duration-200"
        style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-panel)' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors duration-150"
            style={{ border: '1px solid var(--border-subtle)' }}
            aria-label="Retour"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-sm font-semibold tracking-wider uppercase flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse" />
              ARCHIVES HISTORIQUES & MISSIONS
            </h1>
            <p className="text-[10px] uppercase font-mono tracking-widest text-[var(--text-tertiary)]">
              Cabinet Restreint · Scénarios de Crises Majeures
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </header>

      {/* Main split dashboard style */}
      <main className="flex-1 flex flex-col md:flex-row max-h-[calc(100vh-65px)] overflow-hidden">
        
        {/* Left pane: Mission selectors */}
        <section
          className="w-full md:w-[350px] p-6 border-b md:border-b-0 md:border-r flex flex-col gap-4 overflow-y-auto transition-colors duration-200"
          style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-panel)' }}
        >
          <div className="flex items-center gap-2 text-[var(--accent-primary)] mb-2">
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
        <section className="flex-1 p-8 overflow-y-auto flex flex-col gap-6">
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
                  <div className="border border-[var(--border-default)] bg-[var(--bg-panel)] rounded-lg p-5 transition-colors duration-200">
                    <h3 className="text-xs uppercase font-mono font-bold tracking-wider mb-2.5 text-[var(--text-primary)] flex items-center gap-1.5">
                      <FileText size={14} className="text-[var(--accent-primary)]" />
                      Contexte Historique
                    </h3>
                    <div className="text-xs leading-relaxed text-[var(--text-secondary)] space-y-3">
                      {activeCampaign.contextMarkdown.split('\n\n').map((paragraph, i) => {
                        if (paragraph.trim().startsWith('$$\\')) {
                          return <BlockKatex key={i} math={paragraph.replace(/\$\$/g, '').trim()} />
                        }
                        return <p key={i}>{paragraph}</p>
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
                  <div className="border border-[var(--border-default)] bg-[var(--bg-panel)] rounded-lg p-5 transition-colors duration-200">
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
                  <div className="border border-[var(--border-default)] bg-[var(--bg-panel)] rounded-lg p-5 transition-colors duration-200">
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
                  <span>Votre score sera évalué selon le respect strict des critères institutionnels.</span>
                </div>

                <button
                  onClick={() => handleStartMission(activeCampaign.id)}
                  className="px-6 py-3 rounded text-xs font-semibold uppercase tracking-wider bg-[var(--accent-primary)] hover:bg-[#901319] text-white transition-all duration-150 flex items-center gap-1.5"
                  style={{ cursor: 'pointer' }}
                >
                  <Play size={12} fill="white" />
                  Accepter la Mission & Commencer
                </button>
              </div>

            </motion.div>
          </AnimatePresence>
        </section>

      </main>
    </div>
  )
}
