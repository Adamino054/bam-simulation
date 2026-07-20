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
  context?: 'landing' | 'courses' | 'dashboard' | 'simulation' | 'debrief' | 'discovery' | 'choice' | 'history' | 'training' | 'campaign' | 'lab' | 'multiplayer'
}

interface ChatMessage {
  sender: 'bot' | 'user'
  text: string
  timestamp: string
  origin?: 'welcome' | 'context' | 'conversation' | 'local'
}

const CHAT_STORAGE_KEY = 'cbs-assistant-history-v1'
const MAX_STORED_MESSAGES = 60

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<ChatMessage>
  return (
    (candidate.sender === 'bot' || candidate.sender === 'user') &&
    typeof candidate.text === 'string' &&
    typeof candidate.timestamp === 'string'
  )
}

function readStoredChat(): ChatMessage[] {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(CHAT_STORAGE_KEY) ?? '[]') as unknown
    return Array.isArray(parsed) ? parsed.filter(isChatMessage).slice(-MAX_STORED_MESSAGES) : []
  } catch {
    return []
  }
}

function storeChat(messages: ChatMessage[]) {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-MAX_STORED_MESSAGES)))
  } catch {
    // Le stockage privé peut être indisponible : le chat continue simplement en mémoire.
  }
}

const GLOSSARY_SPLIT_REGEX = /(taux directeur|inflation|npl|ccyb|taylor|ecart de production|output gap|credibilite|reserves de change|courbe de phillips|phillips|courbe is|is curve|canal du credit|taux debiteur|loi d'okun|okun|chomage|dette-deflation|forward guidance|anticipations)/gi
const GLOSSARY_TERM_REGEX = /^(taux directeur|inflation|npl|ccyb|taylor|ecart de production|output gap|credibilite|reserves de change|courbe de phillips|phillips|courbe is|is curve|canal du credit|taux debiteur|loi d'okun|okun|chomage|dette-deflation|forward guidance|anticipations)$/i

function answerWithContinuityGuide(
  query: string,
  context: NonNullable<AssistantBotProps['context']>,
  state: Parameters<typeof answerCustomQuestion>[1],
  pseudo: string,
) {
  const normalized = query
    .toLocaleLowerCase('fr-FR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
  const address = pseudo.toLocaleLowerCase('fr-FR') === 'gouverneur' ? 'Gouverneur' : `Gouverneur ${pseudo}`

  if (context === 'discovery') {
    if (/activite|ensuite|conseill|parcours|decouverte/.test(normalized)) {
      return `${address}, tu peux choisir entre **Histoires** pour comprendre en douceur, **Jeux** pour pratiquer, **Mission guidée** pour décider pas à pas, et **Millionnaire** pour tester tes connaissances.\n\nCommence par **Histoires** si tu débutes, puis passe à la **Mission guidée** pour mettre les idées en pratique.`
    }
    if (/defi|challenge/.test(normalized)) {
      return `${address}, mini-défi : les prix montent vite, mais l’activité ralentit. Choisis entre **augmenter**, **maintenir** ou **baisser** le taux directeur, puis explique en une phrase le risque principal de ton choix.\n\nIndice : une décision peut aider les prix tout en freinant davantage l’activité.`
    }
  }

  if (context === 'dashboard' && /scenario|strategie|objectif|risque/.test(normalized)) {
    return `${address}, sélectionne d’abord une carte de scénario puis lis le **Briefing de mission** : il affiche le niveau de risque, les indicateurs de départ et les objectifs. Une stratégie prudente consiste à identifier le choc dominant avant de choisir un instrument, puis à avancer par petits ajustements.`
  }

  return answerCustomQuestion(query, state, pseudo).replaceAll('Gouverneur Gouverneur', 'Gouverneur')
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
  const blockMathRegex = /(\$\$[\s\S]*?\$\$)/g
  const blockParts = text.split(blockMathRegex)

  return (
    <>
      {blockParts.map((blockPart, blockIdx) => {
        const isBlockMath = blockPart.startsWith('$$') && blockPart.endsWith('$$')
        
        if (isBlockMath) {
          const formula = blockPart.slice(2, -2).trim()
          return (
            <div key={`block-math-${blockIdx}`} className="my-2.5 overflow-x-auto max-w-full rounded py-1 px-3.5 text-center" style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
              <BlockMath
                math={formula}
                renderError={() => <code>{`$$${formula}$$`}</code>}
              />
            </div>
          )
        }

        // 2. Découpage par mathématiques en ligne $ (InlineMath)
        const inlineMathRegex = /(\$[^\n$]*?\$)/g
        const inlineParts = blockPart.split(inlineMathRegex)

        return (
          <span key={`text-block-${blockIdx}`}>
            {inlineParts.map((inlinePart, inlineIdx) => {
              const isInlineMath = inlinePart.startsWith('$') && inlinePart.endsWith('$')
              
              if (isInlineMath) {
                const formula = inlinePart.slice(1, -1).trim()
                return (
                  <span key={`inline-math-${inlineIdx}`} className="inline-block px-1 bg-black/10 rounded font-mono text-[11.5px] text-[var(--accent-warm)]">
                    <InlineMath
                      math={formula}
                      renderError={() => <code>{`$${formula}$`}</code>}
                    />
                  </span>
                )
              }

              // 3. Découpage par termes du glossaire cliquables
              const glossaryParts = inlinePart.split(GLOSSARY_SPLIT_REGEX)


              return (
                <span key={`glossary-block-${inlineIdx}`}>
                  {glossaryParts.map((part, index) => {
                    const isTerm = GLOSSARY_TERM_REGEX.test(part)
                    
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
  const [aiMode, setAiMode] = useState<'ready' | 'connecting' | 'online' | 'fallback'>('ready')
  const [chatLog, setChatLog] = useState<ChatMessage[]>([])
  const [historyReady, setHistoryReady] = useState(false)
  const [selectedTerm, setSelectedTerm] = useState<GlossaryTerm | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const lastQuarterRef = useRef<number>(-1)
  const lastProcessedMessagesRef = useRef('')
  const chatLogRef = useRef<ChatMessage[]>([])
  const requestInFlightRef = useRef(false)
  const activeRequestRef = useRef<AbortController | null>(null)
  const mountedRef = useRef(true)
  const isOpenRef = useRef(false)

  const currentState = useGameStore(s => s.currentState)
  const pseudo = useAuthStore(s => {
    if (!s.currentUser) return 'Gouverneur'
    return s.players[s.currentUser]?.pseudo ?? s.currentUser
  })
  const governorLabel = pseudo.toLocaleLowerCase('fr-FR') === 'gouverneur'
    ? 'Gouverneur'
    : `Gouverneur ${pseudo}`

  const appendMessages = useCallback((entries: ChatMessage[]) => {
    setChatLog(prev => {
      const next = [...prev, ...entries].slice(-MAX_STORED_MESSAGES)
      chatLogRef.current = next
      storeChat(next)
      return next
    })
  }, [])

  useEffect(() => {
    const stored = readStoredChat()
    setChatLog(prev => {
      const next = stored.length > 0 ? stored : prev
      chatLogRef.current = next
      return next
    })
    setHistoryReady(true)
  }, [])

  useEffect(() => {
    chatLogRef.current = chatLog
    if (historyReady) storeChat(chatLog)
  }, [chatLog, historyReady])

  useEffect(() => {
    isOpenRef.current = isOpen
  }, [isOpen])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      activeRequestRef.current?.abort()
    }
  }, [])

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
    const isSimulation = context === 'simulation'
    const serialized = JSON.stringify({
      context,
      quarter: isSimulation ? currentState.quarter : null,
      messages,
    })
    if (serialized === lastProcessedMessagesRef.current) return
    lastProcessedMessagesRef.current = serialized

    if (messages.length === 0) return

    const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    const quarterChanged = isSimulation && currentState.quarter !== lastQuarterRef.current

    const newEntries: ChatMessage[] = []

    if (quarterChanged && lastQuarterRef.current !== -1) {
      newEntries.push({
        sender: 'bot',
        text: `🔔 **Trimestre T${currentState.quarter + 1} (${currentState.date.year} Q${currentState.date.q})**\n\n${governorLabel}, voici mes analyses de conjoncture à cette étape :`,
        timestamp: now,
        origin: 'context',
      })
    }

    messages.forEach(m => {
      newEntries.push({
        sender: 'bot',
        text: m,
        timestamp: now,
        origin: 'context',
      })
    })

    if (isSimulation) {
      lastQuarterRef.current = currentState.quarter
    }

    setChatLog(prev => {
      const welcome: ChatMessage = {
        sender: 'bot',
        text: `Bonjour **${governorLabel}** ! 💼\nJe suis l'**Assistant CBS**, votre conseiller. Posez-moi des questions sur les mécanismes ou tapez un concept clé (ex. **Taux directeur**, **NPL**) pour analyser l'économie marocaine.`,
        timestamp: now,
        origin: 'welcome',
      }
      const base = prev.length === 0 ? [welcome] : prev
      const entriesToAdd = isSimulation
        ? newEntries
        : newEntries.filter(entry => !base.some(existing => existing.sender === 'bot' && existing.text === entry.text))
      const next = [...base, ...entriesToAdd].slice(-MAX_STORED_MESSAGES)
      chatLogRef.current = next
      return next
    })

    if (!isOpenRef.current) setHasNewMessage(true)
  }, [messages, context, currentState, governorLabel, pseudo])

  // Initialisation par défaut si aucun message n'arrive
  useEffect(() => {
    const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    setChatLog(prev => {
      if (prev.length > 0) return prev
      const next: ChatMessage[] = [{
        sender: 'bot',
        text: `Bonjour **${governorLabel}** ! 💼\nJe suis l'**Assistant CBS**, votre conseiller économique. Demandez-moi n'importe quelle explication ou tapez un concept (ex. **Inflation**, **Taylor**, **CCyB**) pour l'analyser.`,
        timestamp: now,
        origin: 'welcome',
      }]
      chatLogRef.current = next
      return next
    })
  }, [governorLabel])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [chatLog, isOpen, scrollToBottom])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        isOpenRef.current = false
        setIsOpen(false)
        setSelectedTerm(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.requestAnimationFrame(() => inputRef.current?.focus())
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // 3. Envoi au proxy Gemini côté serveur, avec le moteur local en repli.
  const handleSend = useCallback(async (textToSend: string) => {
    const cleanText = textToSend.trim()
    if (!cleanText || requestInFlightRef.current) return

    requestInFlightRef.current = true
    const relevantHistory = chatLogRef.current
      .filter(message => message.sender === 'user' || message.origin === 'conversation' || message.origin === 'local')
      .slice(-10)
      .map(message => ({
        role: message.sender === 'user' ? 'user' as const : 'model' as const,
        text: message.text,
      }))

    const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    const userMsg: ChatMessage = { sender: 'user', text: cleanText, timestamp: now, origin: 'conversation' }

    appendMessages([userMsg])
    setInputText('')
    setIsTyping(true)
    setAiMode('connecting')

    const controller = new AbortController()
    activeRequestRef.current = controller
    const timeoutId = window.setTimeout(() => controller.abort(), 28_000)

    try {
      const hasLiveEconomy = context === 'simulation' || context === 'debrief'
      const economy = hasLiveEconomy ? {
        trimestre: `T${currentState.quarter + 1}`,
        date: `${currentState.date.year} Q${currentState.date.q}`,
        inflation: `${currentState.inflation.toFixed(2)} %`,
        croissance: `${currentState.gdpGrowth.toFixed(2)} %`,
        chomage: `${currentState.unemployment.toFixed(2)} %`,
        tauxDirecteur: `${currentState.policyRate.toFixed(2)} %`,
        ecartProduction: `${currentState.outputGap.toFixed(2)} %`,
        croissanceCredit: `${currentState.creditGrowth.toFixed(2)} %`,
        creancesDouteuses: `${currentState.nplRatio.toFixed(2)} %`,
        credibilite: `${currentState.centralBankCredibility.toFixed(0)} / 100`,
      } : undefined

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message: cleanText,
          history: relevantHistory,
          context,
          playerName: pseudo,
          economy,
        }),
        signal: controller.signal,
      })

      const payload = await response.json().catch(() => ({})) as {
        text?: string
        model?: string
        source?: string
        error?: string
      }
      if (!response.ok) throw new Error(payload.error ?? `Chat API ${response.status}`)
      if (!payload.text?.trim()) throw new Error('Réponse vide')

      const botMsg: ChatMessage = {
        sender: 'bot',
        text: payload.text.trim(),
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        origin: 'conversation',
      }
      appendMessages([botMsg])
      setAiMode('online')
      if (!isOpenRef.current) setHasNewMessage(true)
    } catch {
      if (!mountedRef.current) return
      const hasLiveEconomy = context === 'simulation' || context === 'debrief'
      const localResponse = answerWithContinuityGuide(
        cleanText,
        context,
        hasLiveEconomy ? currentState : undefined,
        pseudo,
      )
      appendMessages([{
        sender: 'bot',
        text: `${localResponse}\n\n*Mode continuité — réponse issue du guide pédagogique CBS.*`,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        origin: 'local',
      }])
      setAiMode('fallback')
      if (!isOpenRef.current) setHasNewMessage(true)
    } finally {
      window.clearTimeout(timeoutId)
      if (activeRequestRef.current === controller) activeRequestRef.current = null
      requestInFlightRef.current = false
      if (mountedRef.current) {
        setIsTyping(false)
        if (isOpenRef.current) window.requestAnimationFrame(() => inputRef.current?.focus())
      }
    }
  }, [appendMessages, context, currentState, pseudo])

  // 4. Écoute de l'événement système d'ouverture depuis "Assistant"
  useEffect(() => {
    const handleOpenSystem = (e: Event) => {
      const ev = e as CustomEvent
      isOpenRef.current = true
      setIsOpen(true)
      setHasNewMessage(false)
      if (typeof ev.detail?.query === 'string') {
        void handleSend(ev.detail.query)
      }
    }

    window.addEventListener('open-cbs-assistant', handleOpenSystem)
    return () => window.removeEventListener('open-cbs-assistant', handleOpenSystem)
  }, [handleSend])

  if (dismissed) return null

  // Suggestions dynamiques basées sur le contexte
  const suggestions = context === 'simulation' ? [
    { label: 'Diagnostic global', query: "Comment va l'économie ?" },
    { label: 'Taux directeur ?', query: 'Taux directeur' },
    { label: 'Règle de Taylor ?', query: 'Taylor' },
    { label: 'Indicateur NPL ?', query: 'NPL' },
  ] : context === 'discovery' ? [
    { label: 'Défi rapide', query: 'Donne-moi un mini-défi sur l’inflation.' },
    { label: 'Pourquoi 2 % ?', query: 'Pourquoi vise-t-on environ 2 % d’inflation ?' },
    { label: 'Taux directeur', query: 'Explique le taux directeur avec une analogie simple.' },
    { label: 'Que faire ensuite ?', query: 'Quelle activité Découverte me conseilles-tu ?' },
  ] : context === 'dashboard' || context === 'campaign' || context === 'training' || context === 'lab' ? [
    { label: 'Quel scenario ?', query: 'Aide-moi a choisir un scenario adapte a mon niveau.' },
    { label: 'Objectif mandat', query: 'Explique les objectifs de scoring du mandat.' },
    { label: 'Strategie initiale', query: 'Quelle strategie initiale adopter et pourquoi ?' },
    { label: 'Risques caches', query: 'Quels risques dois-je surveiller dans ce scenario ?' },
  ] : context === 'history' || context === 'debrief' ? [
    { label: 'Analyser scores', query: 'Analyse mes scores et donne-moi une piste de progression.' },
    { label: 'Pourquoi grade ?', query: 'Explique comment le grade est calcule.' },
    { label: 'Prochaine partie', query: 'Quel scenario rejouer pour progresser ?' },
    { label: 'Levier cle', query: 'Quel levier de politique monetaire dois-je mieux maitriser ?' },
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
              id="cbs-assistant-dialog"
              role="dialog"
              aria-modal="false"
              aria-label={context === 'discovery' ? 'Coach Découverte Floussi' : 'Assistant CBS'}
              initial={{ opacity: 0, y: 20, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{
                width: '390px', maxWidth: 'calc(100vw - 48px)', height: 'min(510px, calc(100dvh - 104px))', minHeight: '320px', borderRadius: '16px', overflow: 'hidden', backdropFilter: 'blur(25px)',
                backgroundColor: 'var(--bg-overlay)', border: '1px solid var(--border-default)',
                boxShadow: '0 20px 64px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.04) inset', display: 'flex', flexDirection: 'column',
              }}
            >
              {/* Header du Chat */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--border-subtle)', background: 'linear-gradient(135deg, rgba(180,25,35,0.06) 0%, rgba(201,168,106,0.03) 100%)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="w-2.5 h-2.5 rounded-full animate-pulse-soft" style={{ backgroundColor: botMood.ringColor }} />
                  <div>
                    <span style={{ display: 'block', fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
                      {context === 'discovery' ? 'Floussi · Coach Découverte' : 'Assistant CBS · Conseiller'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', fontSize: '8px', color: aiMode === 'fallback' ? 'var(--accent-warm)' : 'var(--text-tertiary)' }}>
                      <Sparkles size={8} />
                      {aiMode === 'connecting' ? 'Connexion sécurisée…' : aiMode === 'online' ? 'Gemini connecté' : aiMode === 'fallback' ? 'Guide CBS actif' : 'Prêt à répondre'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Fermer l’assistant"
                  onClick={() => { isOpenRef.current = false; setIsOpen(false); setSelectedTerm(null) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--text-tertiary)' }}
                >
                  <X size={15} />
                </button>
              </div>

              {/* Conteneur de messages */}
              <div
                className="chat-messages-container"
                aria-live="polite"
                aria-busy={isTyping}
                style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}
              >
                {chatLog.map((msg, idx) => (
                  <div key={idx} className={msg.sender === 'bot' ? 'chat-bubble-bot' : 'chat-bubble-user'} style={{ wordBreak: 'break-word', whiteSpace: 'pre-line', position: 'relative' }}>
                    <div style={{ margin: 0 }}>
                      {msg.sender === 'bot' ? (
                        <FormattedChatMessageText text={msg.text} onTermClick={handleTermClick} />
                      ) : (
                        msg.text
                      )}
                    </div>
                    <span style={{ display: 'block', textAlign: 'right', fontSize: '8px', opacity: 0.5, marginTop: '5px', fontFamily: 'monospace' }}>
                      {msg.timestamp}
                    </span>
                  </div>
                ))}
                {isTyping && (
                  <div className="chat-bubble-bot" style={{ fontStyle: 'italic', color: 'var(--text-tertiary)', opacity: 0.8 }}>
                    {context === 'discovery' ? 'Floussi prépare une explication simple...' : "L'Assistant CBS analyse les indicateurs..."}
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
                        Fiche Glossaire CBS
                      </div>
                      <button 
                        type="button"
                        aria-label="Fermer la fiche du glossaire"
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
                        <InlineMath
                          math={selectedTerm.formula}
                          renderError={() => <code>{`$${selectedTerm.formula}$`}</code>}
                        />
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
                    type="button"
                    disabled={isTyping}
                    onClick={() => void handleSend(sug.query)}
                    style={{ fontSize: '10px', padding: '5px 10px', borderRadius: '14px', border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-panel)', color: 'var(--text-secondary)', cursor: isTyping ? 'not-allowed' : 'pointer', opacity: isTyping ? 0.55 : 1, transition: 'all 0.15s ease' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = botMood.ringColor; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }} 
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
                  >
                    {sug.label}
                  </button>
                ))}
              </div>

              {/* Formulaire d'envoi de messages */}
              <form onSubmit={(e) => { e.preventDefault(); void handleSend(inputText) }} style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', borderTop: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-panel)' }}>
                <input 
                  ref={inputRef}
                  type="text" 
                  aria-label={context === 'discovery' ? 'Question pour Floussi' : 'Question pour l’assistant CBS'}
                  placeholder={context === 'discovery' ? 'Demande quelque chose à Floussi...' : 'Posez une question économique...'}
                  value={inputText} 
                  onChange={(e) => setInputText(e.target.value)} 
                  maxLength={1200}
                  style={{ flex: 1, backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: '8px', padding: '8px 14px', fontSize: '12px', color: 'var(--text-primary)', outline: 'none', marginRight: '8px' }} 
                />
                <button 
                  type="submit" 
                  disabled={isTyping || !inputText.trim()}
                  aria-label="Envoyer le message"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px', borderRadius: '50%', backgroundColor: botMood.ringColor, color: '#fff', border: 'none', cursor: isTyping || !inputText.trim() ? 'not-allowed' : 'pointer', opacity: isTyping || !inputText.trim() ? 0.55 : 1, transition: 'transform 0.15s ease, background-color 0.2s' }}
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
          type="button"
          aria-label={isOpen ? 'Fermer l’assistant CBS' : 'Ouvrir l’assistant CBS'}
          aria-expanded={isOpen}
          aria-controls="cbs-assistant-dialog"
          className={`bot-avatar ${hasNewMessage && !isOpen ? 'has-message' : ''}`}
          onClick={() => {
            const nextOpen = !isOpen
            isOpenRef.current = nextOpen
            setIsOpen(nextOpen)
            setHasNewMessage(false)
            setSelectedTerm(null)
          }}
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
