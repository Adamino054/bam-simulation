'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, X, Sparkles, Send, Info } from 'lucide-react'
import { InlineMath, BlockMath } from 'react-katex'
import { useGameStore } from '@/store/gameStore'
import { useAuthStore } from '@/store/authStore'
import { answerCustomQuestion, ECONOMIC_GLOSSARY } from '@/engine/botMessages'
import type { GlossaryTerm } from '@/engine/botMessages'

interface AssistantBotProps {
  messages: string[]
  /** Page context for styling */
  context?: 'landing' | 'courses' | 'dashboard' | 'simulation' | 'debrief'
}

interface ChatMessage {
  sender: 'bot' | 'user'
  text: string
  timestamp: string
}

// Composant de formatage sémantique interactif pour mettre en valeur le glossaire et compiler LaTeX
function FormattedChatMessageText({ 
  text, 
  onTermClick 
}: { 
  text: string
  onTermClick: (term: string) => void 
}) {
  if (!text) return null

  // 1. Découpage par bloc mathématique $$ (BlockMath)
  const blockMathRegex = /(\$\$.*?\$\$)/g
  const blockParts = text.split(blockMathRegex)

  return (
    <>
      {blockParts.map((blockPart, blockIdx) => {
        const isBlockMath = blockPart.startsWith('$$') && blockPart.endsWith('$$')
        
        if (isBlockMath) {
          const formula = blockPart.slice(2, -2).trim()
          return (
            <div key={`block-math-${blockIdx}`} className="my-2.5 overflow-x-auto max-w-full rounded py-1 px-3.5 text-center" style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
              <BlockMath math={formula} />
            </div>
          )
        }

        // 2. Découpage par mathématiques en ligne $ (InlineMath)
        const inlineMathRegex = /(\$.*?\$)/g
        const inlineParts = blockPart.split(inlineMathRegex)

        return (
          <span key={`text-block-${blockIdx}`}>
            {inlineParts.map((inlinePart, inlineIdx) => {
              const isInlineMath = inlinePart.startsWith('$') && inlinePart.endsWith('$')
              
              if (isInlineMath) {
                const formula = inlinePart.slice(1, -1).trim()
                return (
                  <span key={`inline-math-${inlineIdx}`} className="inline-block px-1 bg-black/10 rounded font-mono text-[11.5px] text-[var(--accent-warm)]">
                    <InlineMath math={formula} />
                  </span>
                )
              }

              // 3. Découpage par termes du glossaire cliquables
              const glossaryRegex = /(taux directeur|inflation|npl|ccyb|taylor|ecart de production|output gap|credibilite|reserves de change|courbe de phillips|phillips|courbe is|is curve|canal du credit|taux debiteur|loi d'okun|okun|chomage|dette-deflation|forward guidance|anticipations)/gi
              const glossaryParts = inlinePart.split(glossaryRegex)


              return (
                <span key={`glossary-block-${inlineIdx}`}>
                  {glossaryParts.map((part, index) => {
                    const isTerm = glossaryRegex.test(part)
                    
                    if (isTerm) {
                      return (
                        <button
                          key={`term-${index}`}
                          type="button"
                          onClick={() => onTermClick(part)}
                          className="inline-flex items-center px-1.5 py-0.2 mx-0.5 rounded text-[11px] font-bold cursor-pointer transition-colors"
                          style={{
                            backgroundColor: 'rgba(201, 168, 106, 0.12)',
                            color: 'var(--accent-warm)',
                            border: '1px solid rgba(201, 168, 106, 0.25)',
                            verticalAlign: 'middle',
                            lineHeight: 1.2
                          }}
                        >
                          {part}
                        </button>
                      )
                    }

                    // 4. Découpage par markdown bold ** et italic *
                    const boldRegex = /\*\*(.*?)\*\*/g
                    const subParts = part.split(boldRegex)
                    
                    return (
                      <span key={`markdown-block-${index}`}>
                        {subParts.map((sub, subIdx) => {
                          const isBold = subIdx % 2 === 1
                          if (isBold) {
                            return (
                              <strong key={`bold-${subIdx}`} style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                                {sub}
                              </strong>
                            )
                          }
                          
                          const italicRegex = /\*(.*?)\*/g
                          const italicParts = sub.split(italicRegex)
                          return (
                            <span key={`italic-block-${subIdx}`}>
                              {italicParts.map((it, itIdx) => {
                                const isItalic = itIdx % 2 === 1
                                if (isItalic) {
                                  return <em key={`italic-${itIdx}`} style={{ fontStyle: 'italic' }}>{it}</em>
                                }
                                return it
                              })}
                            </span>
                          )
                        })}
                      </span>
                    )
                  })}
                </span>
              )
            })}
          </span>
        )
      })}
    </>
  )
}

export function AssistantBot({ messages, context = 'landing' }: AssistantBotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [hasNewMessage, setHasNewMessage] = useState(true)
  const [dismissed, setDismissed] = useState(false)
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [chatLog, setChatLog] = useState<ChatMessage[]>([])
  const [selectedTerm, setSelectedTerm] = useState<GlossaryTerm | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const lastQuarterRef = useRef<number>(-1)
  const lastProcessedMessagesRef = useRef<string[]>([])

  const currentState = useGameStore(s => s.currentState)
  const currentUser = useAuthStore(s => s.currentUser)

  const pseudo = currentUser ? currentUser : 'Gouverneur'

  // 1. Calcul de l'état d'humeur du robot (Mascot Moods)
  const botMood = useMemo(() => {
    if (!currentState || context !== 'simulation') {
      return {
        glow: 'rgba(180, 25, 35, 0.4)',
        emoji: '⚖️',
        bgGradient: 'linear-gradient(135deg, #C41923 0%, #8B131B 100%)',
        borderColor: 'rgba(255,255,255,0.15)',
        ringColor: 'var(--accent-primary)'
      }
    }
    
    const infDev = Math.abs(currentState.inflation - 2.0)
    const gapDev = Math.abs(currentState.outputGap)

    if (infDev > 1.5 || gapDev > 2.0 || currentState.nplRatio > 12) {
      return {
        glow: 'rgba(194, 84, 80, 0.55)',
        emoji: '🚨',
        bgGradient: 'linear-gradient(135deg, #C25450 0%, #7E312F 100%)',
        borderColor: 'rgba(194, 84, 80, 0.4)',
        ringColor: '#C25450'
      }
    } else if (infDev > 0.6 || gapDev > 0.8 || currentState.nplRatio > 8) {
      return {
        glow: 'rgba(201, 168, 106, 0.5)',
        emoji: '⚠️',
        bgGradient: 'linear-gradient(135deg, #C9A86A 0%, #846835 100%)',
        borderColor: 'rgba(201, 168, 106, 0.3)',
        ringColor: '#C9A86A'
      }
    } else {
      return {
        glow: 'rgba(74, 157, 124, 0.5)',
        emoji: '⚖️',
        bgGradient: 'linear-gradient(135deg, #4A9D7C 0%, #2A5A46 100%)',
        borderColor: 'rgba(74, 157, 124, 0.3)',
        ringColor: '#4A9D7C'
      }
    }
  }, [currentState, context])

  // 2. Gestion de l'historique de discussion persistant
  useEffect(() => {
    // Éviter de traiter plusieurs fois le même tableau de messages
    const serialized = JSON.stringify(messages)
    if (serialized === JSON.stringify(lastProcessedMessagesRef.current)) return
    lastProcessedMessagesRef.current = messages

    if (messages.length === 0) return

    const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    const isSimulation = context === 'simulation'
    const quarterChanged = isSimulation && currentState.quarter !== lastQuarterRef.current

    const newEntries: ChatMessage[] = []

    if (quarterChanged && lastQuarterRef.current !== -1) {
      newEntries.push({
        sender: 'bot',
        text: `🔔 **Trimestre T${currentState.quarter + 1} (${currentState.date.year} Q${currentState.date.q})**\n\nGouverneur ${pseudo}, voici mes analyses de conjoncture à cette étape :`,
        timestamp: now
      })
    }

    messages.forEach(m => {
      newEntries.push({
        sender: 'bot',
        text: m,
        timestamp: now
      })
    })

    if (isSimulation) {
      lastQuarterRef.current = currentState.quarter
    }

    setChatLog(prev => {
      // Si la liste est vide, on injecte l'accueil d'abord
      if (prev.length === 0) {
        const welcome: ChatMessage = {
          sender: 'bot',
          text: `Bonjour Gouverneur **${pseudo}** ! 💼\nJe suis **BAM Bot**, votre assistant. Posez-moi des questions sur les mécanismes ou tapez un concept clé (ex. **Taux directeur**, **NPL**) pour analyser l'économie marocaine.`,
          timestamp: now
        }
        return [welcome, ...newEntries]
      }
      return [...prev, ...newEntries]
    })

    setHasNewMessage(true)
  }, [messages, context, currentState, pseudo])

  // Initialisation par défaut si aucun message n'arrive
  useEffect(() => {
    if (chatLog.length === 0) {
      const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      setChatLog([
        {
          sender: 'bot',
          text: `Bonjour Gouverneur **${pseudo}** ! 💼\nJe suis **BAM Bot**, votre conseiller économique. Demandez-moi n'importe quelle explication ou tapez un concept (ex. **Inflation**, **Taylor**, **CCyB**) pour l'analyser.`,
          timestamp: now
        }
      ])
    }
  }, [pseudo, chatLog.length])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [chatLog, isOpen, scrollToBottom])

  // 3. Moteur de traitement d'envoi de messages
  const handleSend = useCallback((textToSend: string) => {
    if (!textToSend.trim()) return

    const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    const userMsg: ChatMessage = { sender: 'user', text: textToSend, timestamp: now }

    setChatLog(prev => [...prev, userMsg])
    setInputText('')
    setIsTyping(true)

    // Simulation de la rédaction du bot
    setTimeout(() => {
      const botResponseText = answerCustomQuestion(textToSend, currentState, pseudo)
      const botMsg: ChatMessage = {
        sender: 'bot',
        text: botResponseText,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      }
      setChatLog(prev => [...prev, botMsg])
      setIsTyping(false)
    }, 600)
  }, [currentState, pseudo])

  // 4. Écoute de l'événement système d'ouverture depuis "Bot Help"
  useEffect(() => {
    const handleOpenSystem = (e: Event) => {
      const ev = e as CustomEvent
      setIsOpen(true)
      setHasNewMessage(false)
      if (ev.detail?.query) {
        setTimeout(() => {
          handleSend(ev.detail.query)
        }, 300)
      }
    }

    window.addEventListener('open-bam-bot', handleOpenSystem)
    return () => window.removeEventListener('open-bam-bot', handleOpenSystem)
  }, [handleSend])

  if (dismissed) return null

  // Suggestions dynamiques basées sur le contexte
  const suggestions = context === 'simulation' ? [
    { label: 'Diagnostic global', query: "Comment va l'économie ?" },
    { label: 'Taux directeur ?', query: 'Taux directeur' },
    { label: 'Règle de Taylor ?', query: 'Taylor' },
    { label: 'Indicateur NPL ?', query: 'NPL' },
  ] : [
    { label: 'But du jeu ?', query: 'but' },
    { label: 'Inflation cible ?', query: 'inflation' },
    { label: 'Coussin CCyB ?', query: 'ccyb' },
    { label: 'Réserves change ?', query: 'reserves de change' },
  ]

  const handleTermClick = (termText: string) => {
    const cleanText = termText.toLowerCase().trim()
    const found = ECONOMIC_GLOSSARY.find(term => 
      term.keywords.some(k => cleanText.includes(k) || k.includes(cleanText))
    )
    if (found) {
      setSelectedTerm(found)
    }
  }

  return (
    <>
      <style>{`
        @keyframes bot-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes bot-pulse-ring {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .bot-avatar { position: relative; cursor: pointer; z-index: 9999; }
        .bot-avatar.has-message { animation: bot-bounce 2.2s ease-in-out infinite; }
        .bot-pulse-ring { position: absolute; inset: -4px; border-radius: 50%; animation: bot-pulse-ring 2.2s ease-out infinite; }
        .chat-bubble-bot { align-self: flex-start; background: var(--bg-base); padding: 9px 13px; border-radius: 14px 14px 14px 0; font-size: 12px; color: var(--text-secondary); max-width: 88%; border: 1px solid var(--border-subtle); }
        .chat-bubble-user { align-self: flex-end; background: var(--accent-primary); color: white; padding: 9px 13px; border-radius: 14px 14px 0 14px; font-size: 12px; max-width: 88%; box-shadow: 0 2px 8px rgba(180,25,35,0.25); }
      `}</style>

      <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{
                width: '390px', maxWidth: 'calc(100vw - 48px)', height: '510px', borderRadius: '16px', overflow: 'hidden', backdropFilter: 'blur(25px)',
                backgroundColor: 'var(--bg-overlay)', border: '1px solid var(--border-default)',
                boxShadow: '0 20px 64px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.04) inset', display: 'flex', flexDirection: 'column',
              }}
            >
              {/* Header du Chat */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', background: 'linear-gradient(135deg, rgba(180,25,35,0.06) 0%, rgba(201,168,106,0.03) 100%)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="w-2.5 h-2.5 rounded-full animate-pulse-soft" style={{ backgroundColor: botMood.ringColor }} />
                  <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                    BAM Bot · Conseiller
                  </span>
                </div>
                <button onClick={() => { setIsOpen(false); setSelectedTerm(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--text-tertiary)' }}><X size={15} /></button>
              </div>

              {/* Conteneur de messages */}
              <div className="chat-messages-container" style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {chatLog.map((msg, idx) => (
                  <div key={idx} className={msg.sender === 'bot' ? 'chat-bubble-bot' : 'chat-bubble-user'} style={{ wordBreak: 'break-word', whiteSpace: 'pre-line', position: 'relative' }}>
                    <p style={{ margin: 0 }}>
                      {msg.sender === 'bot' ? (
                        <FormattedChatMessageText text={msg.text} onTermClick={handleTermClick} />
                      ) : (
                        msg.text
                      )}
                    </p>
                    <span style={{ display: 'block', textAlign: 'right', fontSize: '8px', opacity: 0.5, marginTop: '5px', fontFamily: 'monospace' }}>
                      {msg.timestamp}
                    </span>
                  </div>
                ))}
                {isTyping && (
                  <div className="chat-bubble-bot" style={{ fontStyle: 'italic', color: 'var(--text-tertiary)', opacity: 0.8 }}>
                    BAM Bot analyse les indicateurs...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Fiche de Glossaire LaTeX coulissante (Slide-up) */}
              <AnimatePresence>
                {selectedTerm && (
                  <motion.div
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                    style={{
                      position: 'absolute', bottom: '94px', left: 0, right: 0, zIndex: 100,
                      backgroundColor: 'var(--bg-panel)', borderTop: '1px solid var(--accent-warm)',
                      padding: '16px', borderBottom: '1px solid var(--border-subtle)',
                      boxShadow: '0 -8px 24px rgba(0,0,0,0.3)', backdropFilter: 'blur(15px)'
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--accent-warm)] uppercase tracking-wider">
                        <Info size={13} />
                        Fiche Glossaire BAM
                      </div>
                      <button 
                        onClick={() => setSelectedTerm(null)} 
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '2px' }}
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <h4 className="font-editorial text-sm font-bold mb-1.5" style={{ color: 'var(--text-primary)' }}>{selectedTerm.name}</h4>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 10px 0' }}>
                      {selectedTerm.definition}
                    </p>
                    
                    {selectedTerm.formula && (
                      <div className="my-2 rounded py-1 px-3" style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', fontSize: '12px' }}>
                        <InlineMath math={selectedTerm.formula} />
                      </div>
                    )}
                    
                    <div className="mt-2.5 p-2 rounded" style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-subtle)' }}>
                      <span className="block text-[8px] font-bold uppercase tracking-wider opacity-60" style={{ color: 'var(--accent-warm)' }}>Conseil de simulation</span>
                      <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', margin: '2px 0 0 0', lineHeight: 1.4 }}>
                        {selectedTerm.gameTip}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Puces de suggestion */}
              <div style={{ display: 'flex', gap: '6px', padding: '10px 14px', overflowX: 'auto', borderTop: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-base)', whiteSpace: 'nowrap', scrollbarWidth: 'none' }}>
                {suggestions.map((sug, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleSend(sug.query)} 
                    style={{ fontSize: '10px', padding: '5px 10px', borderRadius: '14px', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-panel)', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.15s ease' }} 
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = botMood.ringColor; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }} 
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
                  >
                    {sug.label}
                  </button>
                ))}
              </div>

              {/* Formulaire d'envoi de messages */}
              <form onSubmit={(e) => { e.preventDefault(); handleSend(inputText) }} style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', borderTop: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-panel)' }}>
                <input 
                  type="text" 
                  placeholder="Posez une question économique..." 
                  value={inputText} 
                  onChange={(e) => setInputText(e.target.value)} 
                  style={{ flex: 1, backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', color: 'var(--text-primary)', outline: 'none', marginRight: '8px' }} 
                />
                <button 
                  type="submit" 
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', borderRadius: '50%', backgroundColor: botMood.ringColor, color: '#fff', border: 'none', cursor: 'pointer', transition: 'transform 0.15s ease, background-color 0.2s' }} 
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)' }} 
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)' }}
                >
                  <Send size={14} />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bouton Bulle Mascotte Flottante */}
        <motion.button
          className={`bot-avatar ${hasNewMessage && !isOpen ? 'has-message' : ''}`}
          onClick={() => { setIsOpen(!isOpen); setHasNewMessage(false); setSelectedTerm(null) }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.96 }}
          style={{ 
            width: '54px', height: '54px', borderRadius: '50%', background: botMood.bgGradient, border: `2.5px solid ${botMood.borderColor}`, 
            boxShadow: `0 8px 32px ${botMood.glow}, 0 0 0 1px rgba(255,255,255,0.06) inset`, display: 'flex', alignItems: 'center', 
            justifyContent: 'center', cursor: 'pointer', position: 'relative' 
          }}
        >
          {hasNewMessage && !isOpen && (
            <div className="bot-pulse-ring" style={{ border: `2px solid ${botMood.ringColor}` }} />
          )}
          <Bot size={22} color="#fff" />
          
          {/* Indicateur visuel d'humeur en temps réel (Mascot Moods) */}
          {!isOpen && (
            <span 
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow-md border"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: botMood.ringColor,
              }}
            >
              {botMood.emoji}
            </span>
          )}
        </motion.button>
      </div>
    </>
  )
}
