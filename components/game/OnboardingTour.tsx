'use client'

import React, { useState, useEffect, useLayoutEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, ChevronRight, ChevronLeft, X, Bot, Landmark, Activity, Sliders, Target, CheckCircle2 } from 'lucide-react'
import { sound } from '@/lib/audio'

interface OnboardingTourProps {
  isOpen: boolean
  onClose: () => void
}

interface OnboardingStep {
  title: string
  text: string
  icon: React.ElementType
  selector: string | null
  illustration?: string
}

const STEPS: OnboardingStep[] = [
  {
    title: 'Bienvenue au Cabinet du Wali ! 🏛️',
    text: 'Félicitations pour votre nomination en tant que Wali (Gouverneur) de la Centrale Bank Simulateur. Vous êtes désormais aux commandes de la politique monétaire du Royaume. Votre objectif fondamental est d\'assurer la stabilité des prix tout en soutenant l\'activité économique et la stabilité financière.',
    icon: Landmark,
    selector: null,
  },
  {
    title: 'Le Bulletin Économique 📊',
    text: 'Sur le panneau de gauche, suivez l\'état de la conjoncture et le respect de vos objectifs. Vous y trouverez l\'inflation (cible à 2,0%), l\'output gap (cible à 0,0%), le ratio de créances en souffrance (NPL) et le score de crédibilité de votre mandat. Gardez un œil sur ces indicateurs !',
    icon: Activity,
    selector: '#play-left-panel',
  },
  {
    title: 'Le Tableau de Bord (Dashboard) 📈',
    text: 'La zone centrale résume visuellement la trajectoire historique de votre mandat. Observez la courbe d\'inflation et la courbe de croissance du PIB. En bas, le fil d\'actualités de style Bloomberg Ticker vous informe en direct des chocs extérieurs qui menacent l\'équilibre.',
    icon: Target,
    selector: '#play-center-panel',
  },
  {
    title: 'Vos Instruments de Décision 🎛️',
    text: 'C\'est sur le panneau de droite que vous agissez ! Ajustez le taux directeur (TMP), fixez les réserves obligatoires des banques ou injectez des liquidités d\'urgence (Emergency Lending) en cas de blocage financier.',
    icon: Sliders,
    selector: '#play-right-panel',
  },
  {
    title: 'Assistant CBS : Votre Conseiller Personnel 🤖',
    text: 'Besoin d\'aide, d\'une recommandation de taux ou d\'explications sur un concept ? Cliquez à tout moment sur ma bulle en bas à droite ! Je formule des conseils en temps réel, je possède un glossaire économique complet et je peux même vous expliquer les équations de base.',
    icon: Bot,
    selector: '#play-assistant-bot',
  },
  {
    title: 'Forward Guidance & Projections 💬',
    text: 'Dans les niveaux plus avancés, vous pourrez utiliser la communication Hawkish/Dovish (Forward Guidance) pour influencer les marchés, et ouvrir la boussole théorique "Assistant" pour vérifier si vos décisions s\'alignent sur la Règle de Taylor.',
    icon: BookOpen,
    selector: '#play-right-panel',
  },
  {
    title: 'Valider le Trimestre 🚀',
    text: 'Chaque décision prend effet au trimestre suivant. Une fois vos arbitrages terminés, cliquez sur "Valider les décisions" pour avancer dans le temps, observer l\'évolution de vos courbes et affronter les chocs de l\'économie ! Bonne chance, Wali !',
    icon: CheckCircle2,
    selector: '#turn-button-container',
  }
]

export function OnboardingTour({ isOpen, onClose }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties | null>(null)

  // Calcule la position de l'élément cible pour dessiner le spotlight
  useLayoutEffect(() => {
    if (!isOpen) return

    const step = STEPS[currentStep]
    if (!step.selector) {
      setHighlightStyle(null)
      return
    }

    const updatePosition = () => {
      const el = document.querySelector(step.selector!)
      if (el) {
        const rect = el.getBoundingClientRect()
        setHighlightStyle({
          position: 'fixed',
          top: rect.top - 8,
          left: rect.left - 8,
          width: rect.width + 16,
          height: rect.height + 16,
          borderRadius: '8px',
          border: '2.5px solid var(--accent-primary)',
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.70), 0 0 25px rgba(180, 25, 35, 0.5)',
          pointerEvents: 'none',
          zIndex: 9998,
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        })
      } else {
        setHighlightStyle(null)
      }
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    return () => window.removeEventListener('resize', updatePosition)
  }, [isOpen, currentStep])

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0)
      sound.playTick()
    }
  }, [isOpen])

  if (!isOpen) return null

  const step = STEPS[currentStep]
  const Icon = step.icon

  const handleNext = () => {
    sound.playTick()
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrev = () => {
    sound.playTick()
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleComplete = () => {
    sound.playSuccess()
    localStorage.setItem('bam_onboarding_completed', 'true')
    onClose()
  }

  return (
    <>
      {/* 1. Dark Backdrop Overlay (Si pas de spotlight, on assombrit tout) */}
      <AnimatePresence>
        {!step.selector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-[2px] z-[9990]"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* 2. Spotlight Border & Overlay Box (Si target active) */}
      {highlightStyle && (
        <div style={highlightStyle} />
      )}

      {/* 3. Popover Dialog Card */}
      <div className="fixed inset-x-4 bottom-6 sm:inset-x-auto sm:bottom-8 sm:right-8 sm:left-auto md:right-12 z-[9999] flex justify-center sm:justify-end pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[420px] rounded-xl border p-5 pointer-events-auto backdrop-blur-md"
          style={{
            backgroundColor: 'var(--bg-overlay)',
            borderColor: 'var(--border-strong)',
            boxShadow: '0 20px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset',
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3 pb-3 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2 text-[var(--accent-primary)]">
              <div className="p-1.5 rounded-lg bg-[var(--accent-primary)]/10">
                <Icon size={18} />
              </div>
              <h3 className="font-editorial text-sm sm:text-base font-bold tracking-tight text-[var(--text-primary)]">
                {step.title}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors p-1 rounded-md hover:bg-white/5 cursor-pointer"
              aria-label="Passer le tutoriel"
            >
              <X size={15} />
            </button>
          </div>

          {/* Description text */}
          <div className="text-xs leading-relaxed text-[var(--text-secondary)] mb-5">
            {step.text}
          </div>

          {/* Action buttons and Step Counter */}
          <div className="flex items-center justify-between gap-4">
            {/* Step indicators dots */}
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: i === currentStep ? 'var(--accent-primary)' : 'var(--border-default)',
                    transform: i === currentStep ? 'scale(1.2)' : 'scale(1)',
                  }}
                />
              ))}
              <span className="text-[10px] font-mono text-[var(--text-tertiary)] ml-1">
                {currentStep + 1}/{STEPS.length}
              </span>
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-2.5 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 bg-transparent border border-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  <ChevronLeft size={12} />
                  Précédent
                </button>
              )}
              
              <button
                type="button"
                onClick={handleNext}
                className="px-3.5 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer bg-[var(--accent-primary)] hover:bg-[#901319] text-white"
              >
                {currentStep === STEPS.length - 1 ? 'Terminer' : 'Suivant'}
                {currentStep < STEPS.length - 1 && <ChevronRight size={12} />}
              </button>
            </div>
          </div>

          {/* Optional skip guide trigger */}
          {currentStep < STEPS.length - 1 && (
            <div className="mt-3.5 text-center">
              <button
                onClick={handleComplete}
                className="text-[9px] font-mono uppercase tracking-wider text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] transition-all bg-transparent border-none cursor-pointer"
              >
                Passer l&apos;introduction complète ➔
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </>
  )
}
