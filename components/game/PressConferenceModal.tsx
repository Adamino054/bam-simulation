'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Landmark, Newspaper, CheckCircle, ArrowRight, ShieldAlert } from 'lucide-react'
import { PRESS_CONFERENCES } from '@/engine/pressConferences'
import { useGameStore } from '@/store/gameStore'

interface PressConferenceModalProps {
  pendingPressConference: { questionId: string; year: number }
}

export function PressConferenceModal({ pendingPressConference }: PressConferenceModalProps) {
  const answerPressConference = useGameStore(s => s.answerPressConference)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const [isFlashActive, setIsFlashActive] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const question = PRESS_CONFERENCES[pendingPressConference.year]
  if (!question) return null

  // Get color or initials for reporter avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
  }

  const avatarColor =
    pendingPressConference.year === 1 ? '#B41923' :
    pendingPressConference.year === 2 ? '#5C7E92' :
    pendingPressConference.year === 3 ? '#C9A86A' :
    '#4A9D7C'

  const handleConfirm = async () => {
    if (selectedIdx === null) return
    setIsSubmitted(true)
    
    // Trigger reporter camera flash effect
    setIsFlashActive(true)
    await new Promise(r => setTimeout(r, 150))
    setIsFlashActive(false)
    await new Promise(r => setTimeout(r, 450))

    answerPressConference(selectedIdx)
  }

  return (
    <>
      {/* Camera flash visual effect */}
      <AnimatePresence>
        {isFlashActive && (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: '#ffffff',
              zIndex: 9999,
              pointerEvents: 'none',
            }}
          />
        )}
      </AnimatePresence>

      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', damping: 25, stiffness: 180 }}
          style={{
            width: '100%',
            maxWidth: '650px',
            backgroundColor: 'var(--bg-panel)',
            border: '1px solid var(--border-default)',
            borderRadius: '12px',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.5)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header Banner */}
          <div
            style={{
              padding: '16px 24px',
              borderBottom: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-elevated)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent-primary)] animate-pulse" />
              <h2
                className="font-mono text-xs font-bold tracking-widest text-[var(--text-primary)]"
                style={{ textTransform: 'uppercase' }}
              >
                CBS Direct · Conférence de Presse Annuelle
              </h2>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--text-tertiary)]">
              <Landmark size={12} />
              <span>Année {pendingPressConference.year} complétée</span>
            </div>
          </div>

          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Reporter card */}
            <div
              style={{
                display: 'flex',
                gap: '16px',
                padding: '16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {/* Initials avatar */}
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: avatarColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  boxShadow: `0 0 12px ${avatarColor}50`,
                  flexShrink: 0,
                }}
              >
                {getInitials(question.reporter)}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="text-xs font-bold text-[var(--text-primary)]">
                    {question.reporter}
                  </span>
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <Newspaper size={10} />
                    {question.media}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed italic font-serif">
                  &ldquo;{question.question}&rdquo;
                </p>
              </div>
            </div>

            {/* Answer Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h3 className="label-caps text-[10px] text-[var(--text-tertiary)] tracking-wider">
                Sélectionner votre déclaration officielle :
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {question.options.map((option, idx) => {
                  const isSelected = selectedIdx === idx
                  return (
                    <button
                      key={idx}
                      onClick={() => !isSubmitted && setSelectedIdx(idx)}
                      onMouseEnter={() => !isSubmitted && setHoveredIdx(idx)}
                      onMouseLeave={() => !isSubmitted && setHoveredIdx(null)}
                      disabled={isSubmitted}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: isSelected
                          ? '1px solid var(--accent-primary)'
                          : '1px solid var(--border-default)',
                        backgroundColor: isSelected
                          ? 'rgba(180, 25, 35, 0.08)'
                          : 'var(--bg-elevated)',
                        cursor: isSubmitted ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s ease-in-out',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'center',
                      }}
                    >
                      {/* Check dot */}
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          border: isSelected
                            ? '5px solid var(--accent-primary)'
                            : '1px solid var(--border-default)',
                          backgroundColor: isSelected ? '#ffffff' : 'transparent',
                          transition: 'all 0.15s ease',
                          flexShrink: 0,
                        }}
                      />
                      <span className="text-xs text-[var(--text-primary)] leading-normal font-medium">
                        {option.text}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Dynamic Effect Preview */}
            <div
              style={{
                minHeight: '62px',
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.01)',
                border: '1px dashed var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
            >
              {hoveredIdx !== null || selectedIdx !== null ? (
                <div>
                  <div className="flex items-center gap-1.5 text-[9px] font-mono text-[var(--accent-warm)] uppercase tracking-wider mb-1">
                    <ShieldAlert size={10} />
                    <span>Impact attendu sur les indicateurs :</span>
                  </div>
                  <p className="text-xs font-mono text-[var(--text-secondary)]">
                    {question.options[hoveredIdx !== null ? hoveredIdx : selectedIdx!].effectsDescription}
                  </p>
                </div>
              ) : (
                <p className="text-[11px] text-[var(--text-tertiary)] text-center font-mono">
                  Survolez une déclaration pour afficher les prévisions d&apos;impact.
                </p>
              )}
            </div>

            {/* Action button */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: '4px',
              }}
            >
              <button
                onClick={handleConfirm}
                disabled={selectedIdx === null || isSubmitted}
                className="px-6 py-2.5 rounded font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all duration-200"
                style={{
                  backgroundColor: selectedIdx === null || isSubmitted
                    ? 'var(--bg-elevated)'
                    : 'var(--accent-primary)',
                  color: selectedIdx === null || isSubmitted
                    ? 'var(--text-tertiary)'
                    : '#ffffff',
                  border: 'none',
                  cursor: selectedIdx === null || isSubmitted ? 'not-allowed' : 'pointer',
                  boxShadow: selectedIdx === null || isSubmitted
                    ? 'none'
                    : '0 4px 16px rgba(180, 25, 35, 0.3)',
                }}
              >
                {isSubmitted ? (
                  <>
                    <CheckCircle size={14} className="animate-pulse" />
                    Transmission en cours…
                  </>
                ) : (
                  <>
                    Transmettre la déclaration officielle
                    <ArrowRight size={13} />
                  </>
                )}
              </button>
            </div>

          </div>
        </motion.div>
      </div>
    </>
  )
}
