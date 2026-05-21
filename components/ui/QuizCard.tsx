'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, ChevronRight, RotateCcw, Trophy } from 'lucide-react'
import type { QuizQuestion } from '@/engine/quizzes'

interface QuizCardProps {
  questions: QuizQuestion[]
  moduleColor: string
  onComplete: (score: number, total: number) => void
  onRetry?: () => void
}

export function QuizCard({ questions, moduleColor, onComplete, onRetry }: QuizCardProps) {
  const [currentQ, setCurrentQ] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [score, setScore] = useState(0)
  const [isFinished, setIsFinished] = useState(false)

  if (questions.length === 0) return null

  const question = questions[currentQ]
  const isCorrect = selectedAnswer === question.correctIndex
  const total = questions.length

  const handleSelect = (index: number) => {
    if (showResult) return
    setSelectedAnswer(index)
    setShowResult(true)
    if (index === question.correctIndex) {
      setScore(prev => prev + 1)
    }
  }

  const handleNext = () => {
    if (currentQ < total - 1) {
      setCurrentQ(prev => prev + 1)
      setSelectedAnswer(null)
      setShowResult(false)
    } else {
      setIsFinished(true)
      onComplete(score + (isCorrect ? 0 : 0), total) // score already updated
    }
  }

  const handleRetry = () => {
    setCurrentQ(0)
    setSelectedAnswer(null)
    setShowResult(false)
    setScore(0)
    setIsFinished(false)
    if (onRetry) {
      onRetry()
    }
  }

  // Finished state
  if (isFinished) {
    const pct = Math.round((score / total) * 100)
    const passed = pct >= 60

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          borderRadius: '12px',
          padding: '24px',
          textAlign: 'center',
          backgroundColor: 'var(--bg-elevated)',
          border: `1px solid ${passed ? moduleColor + '44' : 'var(--border-default)'}`,
        }}
      >
        <Trophy size={32} style={{ color: passed ? moduleColor : 'var(--text-tertiary)', margin: '0 auto 12px' }} />
        <p style={{ fontSize: '24px', fontWeight: 700, color: passed ? moduleColor : 'var(--text-primary)', marginBottom: '4px' }}>
          {score}/{total}
        </p>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          {pct >= 80 ? '🌟 Excellent ! Vous maîtrisez ce module.' :
           pct >= 60 ? '✅ Bien ! Vous avez les bases.' :
           '📚 Relisez le module et réessayez.'}
        </p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button
            onClick={handleRetry}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              fontSize: '11px', fontWeight: 600,
              color: 'var(--text-secondary)',
              backgroundColor: 'var(--bg-panel)',
              border: '1px solid var(--border-default)',
              borderRadius: '8px',
              padding: '8px 16px',
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={12} /> Recommencer
          </button>
        </div>
      </motion.div>
    )
  }

  return (
    <div style={{
      borderRadius: '12px',
      overflow: 'hidden',
      backgroundColor: 'var(--bg-elevated)',
      border: '1px solid var(--border-default)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        backgroundColor: `${moduleColor}08`,
      }}>
        <span style={{
          fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const,
          color: moduleColor,
        }}>
          Quiz · Question {currentQ + 1}/{total}
        </span>
        <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>
          Score : {score}/{total}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: '3px', backgroundColor: 'var(--bg-hover)' }}>
        <motion.div
          style={{ height: '100%', backgroundColor: moduleColor }}
          initial={{ width: 0 }}
          animate={{ width: `${((currentQ + (showResult ? 1 : 0)) / total) * 100}%` }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      {/* Question */}
      <div style={{ padding: '20px 16px 12px' }}>
        <AnimatePresence mode="wait">
          <motion.p
            key={question.id}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            style={{
              fontSize: '14px', fontWeight: 600,
              color: 'var(--text-primary)',
              lineHeight: 1.5, margin: 0,
            }}
          >
            {question.question}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Options */}
      <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {question.options.map((option, i) => {
          const isSelected = selectedAnswer === i
          const isCorrectOption = i === question.correctIndex
          let optionStyle: React.CSSProperties = {
            padding: '12px 14px',
            borderRadius: '8px',
            fontSize: '13px',
            lineHeight: 1.4,
            textAlign: 'left' as const,
            cursor: showResult ? 'default' : 'pointer',
            border: '1px solid var(--border-default)',
            backgroundColor: 'var(--bg-panel)',
            color: 'var(--text-secondary)',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }

          if (showResult) {
            if (isCorrectOption) {
              optionStyle = { ...optionStyle, borderColor: '#4A9D7C', backgroundColor: 'rgba(74,157,124,0.1)', color: '#4A9D7C' }
            } else if (isSelected && !isCorrectOption) {
              optionStyle = { ...optionStyle, borderColor: '#C25450', backgroundColor: 'rgba(194,84,80,0.1)', color: '#C25450' }
            } else {
              optionStyle = { ...optionStyle, opacity: 0.5 }
            }
          }

          return (
            <motion.button
              key={i}
              onClick={() => handleSelect(i)}
              style={optionStyle}
              whileHover={!showResult ? { scale: 1.01, borderColor: moduleColor + '55' } : {}}
              whileTap={!showResult ? { scale: 0.99 } : {}}
            >
              <span style={{
                width: '22px', height: '22px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '10px', fontWeight: 700,
                backgroundColor: showResult && isCorrectOption ? 'rgba(74,157,124,0.2)'
                  : showResult && isSelected ? 'rgba(194,84,80,0.2)'
                  : `${moduleColor}15`,
                color: showResult && isCorrectOption ? '#4A9D7C'
                  : showResult && isSelected ? '#C25450'
                  : moduleColor,
                flexShrink: 0,
              }}>
                {showResult && isCorrectOption ? <CheckCircle2 size={13} /> :
                 showResult && isSelected && !isCorrectOption ? <XCircle size={13} /> :
                 String.fromCharCode(65 + i)}
              </span>
              <span>{option}</span>
            </motion.button>
          )
        })}
      </div>

      {/* Explanation + Next */}
      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              padding: '12px 16px',
              borderTop: '1px solid var(--border-subtle)',
              backgroundColor: isCorrect ? 'rgba(74,157,124,0.05)' : 'rgba(194,84,80,0.05)',
            }}>
              <p style={{
                fontSize: '12px', lineHeight: 1.6,
                color: 'var(--text-secondary)', margin: '0 0 12px',
              }}>
                <span style={{ fontWeight: 700, color: isCorrect ? '#4A9D7C' : '#C25450' }}>
                  {isCorrect ? '✓ Correct !' : '✗ Incorrect.'}
                </span>
                {' '}{question.explanation}
              </p>
              <button
                onClick={handleNext}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  fontSize: '12px', fontWeight: 600,
                  color: '#fff',
                  background: `linear-gradient(135deg, ${moduleColor} 0%, ${moduleColor}dd 100%)`,
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  marginLeft: 'auto',
                }}
              >
                {currentQ < total - 1 ? 'Suivant' : 'Voir le résultat'} <ChevronRight size={12} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
