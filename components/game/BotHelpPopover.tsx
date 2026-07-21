'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Compass, Check, HelpCircle, AlertCircle, ArrowRight } from 'lucide-react'
import { useGameStore } from '@/store/gameStore'
import { useAuthStore } from '@/store/authStore'
import { computeTaylorRate } from '@/engine/models/taylorRule'
import { fmtPct } from '@/lib/format'

export function BotHelpPopover() {
  const [isOpen, setIsOpen] = useState(false)
  const currentState = useGameStore(s => s.currentState)
  const pendingAction = useGameStore(s => s.pendingAction)
  const setPendingAction = useGameStore(s => s.setPendingAction)
  const currentUser = useAuthStore(s => s.currentUser)

  const pseudo = currentUser ? currentUser : 'Gouverneur'

  // 1. Calcul du taux optimal de Taylor
  const taylorRate = useMemo(() => {
    return computeTaylorRate(currentState.inflation, currentState.outputGap)
  }, [currentState.inflation, currentState.outputGap])

  // 2. Calcul du changement recommandé en points de base (-100, -50, -25, 0, 25, 50, 100)
  const recommendedChangeBp = useMemo(() => {
    const diffBp = (taylorRate - currentState.policyRate) * 100
    // Arrondir au palier de 25 le plus proche
    const rounded = Math.round(diffBp / 25) * 25
    // Clamer entre -100 et +100
    return Math.max(-100, Math.min(100, rounded))
  }, [taylorRate, currentState.policyRate])

  // 3. Déterminer l'humeur de la conjoncture (Mascot Mood)
  const botMood = useMemo(() => {
    const infDeviation = Math.abs(currentState.inflation - 2.0)
    const gapDeviation = Math.abs(currentState.outputGap)
    
    if (infDeviation > 1.5 || gapDeviation > 2.0 || currentState.nplRatio > 12) {
      return {
        status: 'critical' as const,
        color: 'var(--data-negative)',
        bgGlow: 'rgba(194, 84, 80, 0.25)',
        text: 'Alerte conjoncturelle critique',
        iconColor: '#C25450'
      }
    } else if (infDeviation > 0.6 || gapDeviation > 0.8 || currentState.nplRatio > 8) {
      return {
        status: 'warning' as const,
        color: 'var(--data-warning)',
        bgGlow: 'rgba(201, 168, 106, 0.25)',
        text: 'Tensions macroéconomiques modérées',
        iconColor: '#C9A86A'
      }
    } else {
      return {
        status: 'stable' as const,
        color: 'var(--data-positive)',
        bgGlow: 'rgba(74, 157, 124, 0.25)',
        text: 'Conjoncture équilibrée et maîtrisée',
        iconColor: '#4A9D7C'
      }
    }
  }, [currentState])

  // 4. Générer le court conseil en fonction des métriques
  const shortHint = useMemo(() => {
    if (currentState.inflation > 3.0) {
      return `L'inflation est trop haute (${currentState.inflation.toFixed(2)}%). Relever les taux aiderait à calmer les prix.`
    }
    if (currentState.inflation < 1.0) {
      return `L'inflation est trop basse (${currentState.inflation.toFixed(2)}%). Envisagez de réduire le taux directeur.`
    }
    if (currentState.outputGap < -1.5) {
      return `L'économie est en ralentissement. Une baisse de taux stimulerait l'investissement.`
    }
    return "La situation macroéconomique est globalement stable. Ajustez vos taux avec parcimonie."
  }, [currentState])

  const isTaylorApplied = pendingAction.policyRateChangeBp === recommendedChangeBp

  const handleApplyTaylor = () => {
    setPendingAction({ policyRateChangeBp: recommendedChangeBp })
  }

  const handleAskBot = () => {
    const direction = recommendedChangeBp > 0 ? 'hausser' : recommendedChangeBp < 0 ? 'baisser' : 'maintenir'
    const amt = recommendedChangeBp !== 0 ? ` de ${Math.abs(recommendedChangeBp)} pb` : ''
    const query = `Pourquoi me conseilles-tu de ${direction} le taux directeur${amt} pour ce trimestre ?`
    
    // Dispatch de l'événement pour l'Assistant CBS
    window.dispatchEvent(new CustomEvent('open-cbs-assistant', { detail: { query } }))
    setIsOpen(false)
  }

  return (
    <>
      <div 
        className="rounded-lg p-3.5 relative overflow-hidden transition-all duration-300"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.02)',
          border: `1px solid ${isOpen ? botMood.color : 'var(--border-subtle)'}`,
          backdropFilter: 'blur(10px)',
          boxShadow: isOpen ? `0 8px 32px ${botMood.bgGlow}` : 'none'
        }}
      >
        {/* Glow de fond */}
        <div 
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: botMood.bgGlow,
            filter: 'blur(20px)',
            pointerEvents: 'none'
          }}
        />

        {/* Ligne principale cliquable */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {/* Halo pulsant du robot */}
            <div className="relative flex-shrink-0">
              <div 
                className="absolute inset-0 rounded-full animate-ping"
                style={{
                  border: `2px solid ${botMood.color}`,
                  opacity: 0.4,
                  animationDuration: '2.5s'
                }}
              />
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center relative z-10"
                style={{
                  background: 'linear-gradient(135deg, #1E2026 0%, #15161C 100%)',
                  border: `1.5px solid ${botMood.color}`
                }}
              >
                <Bot size={16} style={{ color: botMood.iconColor }} />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[9px] font-bold tracking-wider uppercase" style={{ color: 'var(--text-tertiary)' }}>
                  Assistant
                </span>
                <span 
                  className="w-1.5 h-1.5 rounded-full" 
                  style={{ backgroundColor: botMood.color }}
                  title={botMood.text}
                />
              </div>
              <p className="text-xs font-semibold leading-relaxed mt-0.5" style={{ color: 'var(--text-primary)' }}>
                {shortHint}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="text-[10px] font-bold px-2 py-1 rounded transition-colors"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = botMood.color;
              (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)';
              (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
            }}
          >
            {isOpen ? 'Fermer' : 'Consulter'}
          </button>
        </div>

        {/* Détails Pop-over animés */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              <div className="mt-4 pt-3.5 border-t border-[var(--border-subtle)] flex flex-col gap-3.5">
                
                {/* 3 mini cartes d'indicateurs de conjoncture */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-black/20 p-2 rounded border border-white/5 text-center">
                    <span className="block text-[8px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-tertiary)' }}>Inflation</span>
                    <span className="block text-xs font-bold font-mono mt-0.5" style={{ color: Math.abs(currentState.inflation - 2) > 0.8 ? 'var(--data-warning)' : 'var(--text-primary)' }}>
                      {currentState.inflation.toFixed(2)}%
                    </span>
                    <span className="block text-[8px] opacity-60 mt-0.5 font-mono">cible: 2.0%</span>
                  </div>

                  <div className="bg-black/20 p-2 rounded border border-white/5 text-center">
                    <span className="block text-[8px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-tertiary)' }}>Output Gap</span>
                    <span className="block text-xs font-bold font-mono mt-0.5" style={{ color: Math.abs(currentState.outputGap) > 1.2 ? 'var(--data-warning)' : 'var(--text-primary)' }}>
                      {currentState.outputGap.toFixed(2)}%
                    </span>
                    <span className="block text-[8px] opacity-60 mt-0.5 font-mono">cible: 0.0%</span>
                  </div>

                  <div className="bg-black/20 p-2 rounded border border-white/5 text-center">
                    <span className="block text-[8px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-tertiary)' }}>Taux Taylor</span>
                    <span className="block text-xs font-bold font-mono mt-0.5" style={{ color: 'var(--accent-warm)' }}>
                      {taylorRate.toFixed(2)}%
                    </span>
                    <span className="block text-[8px] opacity-60 mt-0.5 font-mono">théorique</span>
                  </div>
                </div>

                {/* Bloc de recommandation */}
                <div className="p-3 rounded bg-white/[0.01] border border-white/[0.03] text-xs leading-relaxed">
                  <div className="flex items-center gap-1.5 font-semibold text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--accent-warm)' }}>
                    <Compass size={11} />
                    Orientation Taylor
                  </div>
                  La règle de Taylor suggère un taux directeur de **{taylorRate.toFixed(2)}%**. 
                  Pour s&apos;en approcher, nous vous conseillons d&apos;ajuster le taux de :{' '}
                  <span className="font-mono font-bold" style={{ color: recommendedChangeBp > 0 ? 'var(--data-negative)' : recommendedChangeBp < 0 ? 'var(--data-positive)' : 'var(--text-secondary)' }}>
                    {recommendedChangeBp > 0 ? `+${recommendedChangeBp}` : recommendedChangeBp} pb
                  </span>.
                </div>

                {/* Boutons d'actions */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleApplyTaylor}
                    disabled={isTaylorApplied}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded font-bold text-xs transition-all duration-200"
                    style={{
                      backgroundColor: isTaylorApplied ? 'rgba(74, 157, 124, 0.1)' : 'var(--accent-primary)',
                      border: isTaylorApplied ? '1px solid rgba(74, 157, 124, 0.3)' : 'none',
                      color: isTaylorApplied ? '#4A9D7C' : '#fff',
                      cursor: isTaylorApplied ? 'default' : 'pointer'
                    }}
                  >
                    {isTaylorApplied ? (
                      <>
                        <Check size={12} />
                        Taux Taylor appliqué
                      </>
                    ) : (
                      <>
                        Appliquer ({recommendedChangeBp > 0 ? '+' : ''}{recommendedChangeBp} pb)
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleAskBot}
                    className="py-2 px-3 rounded font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer'
                    }}
                  >
                    <HelpCircle size={12} />
                    Détails
                  </button>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
