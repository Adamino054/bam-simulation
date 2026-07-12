'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Check, HandCoins, HelpCircle, PieChart, RotateCcw, Scissors, Trophy, Users, X } from 'lucide-react'
import { DiscoveryHeader } from '@/components/discovery/DiscoveryHeader'
import { Confetti } from '@/components/discovery/Confetti'
import { useAuthStore } from '@/store/authStore'
import { useDiscoveryStore } from '@/store/discoveryStore'
import { sound } from '@/lib/audio'

type Topic = 'Macro' | 'Portefeuille' | 'Cours' | 'Banque centrale' | 'Commerce'

interface MillionQuestion {
  id: string
  topic: Topic
  question: string
  options: [string, string, string, string]
  answer: number
  explanation: string
  friend: string
}

const MONEY_LADDER = [
  100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 125000, 250000, 500000, 1000000,
]

const SAFETY_LEVELS = [4, 9, 12]

const QUESTIONS: MillionQuestion[] = [
  {
    id: 'inflation',
    topic: 'Macro',
    question: "Quand l'inflation reste trop élevée, quel outil une banque centrale utilise-t-elle souvent en premier ?",
    options: ['Baisser le taux directeur', 'Monter le taux directeur', 'Supprimer les impôts', 'Augmenter les subventions'],
    answer: 1,
    explanation: "Un taux directeur plus élevé rend le crédit plus cher, ralentit la demande et aide à calmer la hausse des prix.",
    friend: "Le chatbot pense au levier le plus classique contre l'inflation : rendre l'argent plus cher.",
  },
  {
    id: 'diversification',
    topic: 'Portefeuille',
    question: 'Pourquoi diversifier un portefeuille ?',
    options: ['Pour garantir un gain', 'Pour réduire le risque lié à un seul actif', 'Pour éviter toute perte', 'Pour acheter seulement des actions'],
    answer: 1,
    explanation: "La diversification répartit les risques : une mauvaise performance peut être compensée par d'autres actifs.",
    friend: "Je chercherais la réponse qui parle de ne pas mettre tout le risque au même endroit.",
  },
  {
    id: 'obligation',
    topic: 'Cours',
    question: "Une obligation représente principalement...",
    options: ["Une part d'entreprise", 'Une dette émise par un emprunteur', 'Une monnaie numérique', 'Un impôt futur'],
    answer: 1,
    explanation: "Acheter une obligation revient à prêter de l'argent à un État ou à une entreprise contre des intérêts.",
    friend: "Le mot-clé ici est dette : l'obligation est un prêt structuré.",
  },
  {
    id: 'gdp',
    topic: 'Macro',
    question: 'Le PIB mesure surtout...',
    options: ["La production de biens et services d'un pays", 'La richesse de chaque citoyen', 'Le niveau exact des prix', 'Le taux de change'],
    answer: 0,
    explanation: "Le PIB additionne la valeur produite dans une économie sur une période donnée.",
    friend: "Je voterais pour la réponse qui parle de production totale dans le pays.",
  },
  {
    id: 'risk-return',
    topic: 'Portefeuille',
    question: 'En finance, le couple rendement-risque signifie généralement que...',
    options: ['Le rendement élevé est toujours gratuit', 'Le risque et le rendement attendu sont souvent liés', 'Le risque empêche tout rendement', 'Le rendement ne dépend jamais du risque'],
    answer: 1,
    explanation: "Un rendement attendu plus élevé vient souvent avec une incertitude plus forte.",
    friend: "La bonne logique est l'équilibre : plus d'espoir de gain demande souvent plus de risque.",
  },
  {
    id: 'unemployment',
    topic: 'Macro',
    question: 'Si le chômage monte fortement, cela signale souvent...',
    options: ['Une économie en surchauffe', 'Une demande ou une activité trop faible', 'Une inflation garantie à 0 %', 'Une monnaie automatiquement plus forte'],
    answer: 1,
    explanation: "Un chômage élevé indique souvent que les entreprises produisent ou recrutent moins.",
    friend: "Je regarderais la réponse qui relie l'emploi au niveau d'activité économique.",
  },
  {
    id: 'exchange-rate',
    topic: 'Commerce',
    question: "Une dépréciation de la monnaie nationale rend souvent les exportations...",
    options: ['Plus chères pour les clients étrangers', 'Moins compétitives', 'Moins chères pour les clients étrangers', 'Interdites'],
    answer: 2,
    explanation: "Quand une monnaie baisse, les acheteurs étrangers paient souvent moins cher les produits du pays.",
    friend: "Je pense au prix vu depuis l'étranger : monnaie plus faible, produits plus accessibles.",
  },
  {
    id: 'liquidity',
    topic: 'Portefeuille',
    question: "La liquidité d'un actif désigne sa capacité à...",
    options: ['Être vendu rapidement sans grosse perte de prix', 'Rapporter toujours un coupon', 'Être protégé contre toute crise', 'Éviter les taxes'],
    answer: 0,
    explanation: "Un actif liquide se revend facilement, avec peu d'écart entre le prix voulu et le prix obtenu.",
    friend: "Je choisis la revente facile : c'est le cœur de la liquidité.",
  },
  {
    id: 'central-bank-target',
    topic: 'Banque centrale',
    question: "L'objectif principal d'une banque centrale moderne est souvent...",
    options: ['Financer toutes les entreprises', "Stabiliser les prix et soutenir l'équilibre macroéconomique", 'Fixer le salaire de chacun', 'Choisir les actions gagnantes'],
    answer: 1,
    explanation: "La stabilité des prix protège le pouvoir d'achat et donne un cadre plus prévisible aux décisions.",
    friend: "Le mandat tourne autour des prix, de la confiance et de l'équilibre économique.",
  },
  {
    id: 'budget-deficit',
    topic: 'Cours',
    question: "Un déficit budgétaire signifie que l'État...",
    options: ['Dépense moins que ses recettes', 'Dépense plus que ses recettes', "N'a aucune dette", 'Ne prélève aucun impôt'],
    answer: 1,
    explanation: "Un déficit apparaît quand les dépenses publiques dépassent les recettes sur une période.",
    friend: "Je retiens : déficit = sorties supérieures aux entrées.",
  },
  {
    id: 'stock',
    topic: 'Portefeuille',
    question: "Acheter une action, c'est acheter...",
    options: ["Une petite part de propriété d'une entreprise", "Une dette garantie par l'État", 'Un billet de banque', 'Un contrat de travail'],
    answer: 0,
    explanation: "Une action donne une part du capital, avec un potentiel de gain mais aussi un risque de perte.",
    friend: "Le chatbot voit l'action comme une part de propriété, pas comme une dette.",
  },
  {
    id: 'supply-shock',
    topic: 'Macro',
    question: "Une hausse brutale du prix du pétrole est plutôt...",
    options: ["Un choc d'offre", 'Un choc de productivité positif', "Une baisse automatique de l'inflation", 'Une politique monétaire'],
    answer: 0,
    explanation: "Le pétrole plus cher augmente les coûts de production et peut pousser les prix vers le haut.",
    friend: "Je pense au coût de production : c'est typiquement un choc d'offre.",
  },
  {
    id: 'compound-interest',
    topic: 'Cours',
    question: 'Les intérêts composés signifient que...',
    options: ['Les intérêts gagnent eux-mêmes des intérêts', 'Les intérêts disparaissent chaque année', 'Le taux devient toujours nul', 'Le capital ne change jamais'],
    answer: 0,
    explanation: "Avec les intérêts composés, les gains réinvestis accélèrent la progression dans le temps.",
    friend: "La réponse puissante est celle où les intérêts travaillent à leur tour.",
  },
  {
    id: 'recession',
    topic: 'Macro',
    question: 'Une récession correspond généralement à...',
    options: ["Une phase de baisse ou de contraction de l'activité", 'Une inflation toujours supérieure à 20 %', 'Une hausse garantie de la bourse', 'Une disparition du commerce'],
    answer: 0,
    explanation: "La récession décrit une économie qui recule ou tourne nettement au ralenti.",
    friend: "Je choisirais la réponse qui parle de contraction de l'activité.",
  },
  {
    id: 'real-rate',
    topic: 'Banque centrale',
    question: "Le taux d'intérêt réel est approximativement...",
    options: ["Le taux nominal moins l'inflation", 'Le taux nominal plus le chômage', 'Le PIB divisé par la dette', 'La croissance moins les exportations'],
    answer: 0,
    explanation: "Le taux réel corrige le taux affiché de l'effet de l'inflation sur le pouvoir d'achat.",
    friend: "Le mot réel veut dire corrigé de l'inflation.",
  },
]

function shuffle<T>(items: T[]) {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('fr-FR').format(value) + ' MAD'
}

function safeAmount(level: number) {
  if (level >= 13) return MONEY_LADDER[12]
  if (level >= 10) return MONEY_LADDER[9]
  if (level >= 5) return MONEY_LADDER[4]
  return 0
}

function audienceVotes(answer: number) {
  const correct = 55 + Math.floor(Math.random() * 23)
  const rest = 100 - correct
  const shares = [0, 0, 0, 0]
  shares[answer] = correct
  const wrong = [0, 1, 2, 3].filter(i => i !== answer)
  const a = Math.floor(rest * 0.5)
  const b = Math.floor(rest * 0.3)
  shares[wrong[0]] = a
  shares[wrong[1]] = b
  shares[wrong[2]] = 100 - correct - a - b
  return shares
}

export default function MillionairePage() {
  const router = useRouter()
  const currentUser = useAuthStore(s => s.currentUser)
  const addXp = useDiscoveryStore(s => s.addXp)
  const unlockBadge = useDiscoveryStore(s => s.unlockBadge)

  const [mounted, setMounted] = useState(false)
  const [runId, setRunId] = useState(0)
  const [questions, setQuestions] = useState<MillionQuestion[]>(() => shuffle(QUESTIONS).slice(0, 15))
  const [level, setLevel] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [status, setStatus] = useState<'playing' | 'won' | 'lost' | 'walked'>('playing')
  const [hiddenOptions, setHiddenOptions] = useState<number[]>([])
  const [friendAdvice, setFriendAdvice] = useState<string | null>(null)
  const [audience, setAudience] = useState<number[] | null>(null)
  const [used, setUsed] = useState({ friend: false, fifty: false, audience: false })
  const [revealedOptions, setRevealedOptions] = useState(0)
  const introPlayed = useRef(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (mounted && !currentUser) router.push('/login')
  }, [mounted, currentUser, router])

  useEffect(() => {
    if (!mounted || !currentUser || introPlayed.current) return
    introPlayed.current = true
    sound.playMillionIntro()
  }, [mounted, currentUser])

  useEffect(() => {
    if (!mounted || !currentUser || status !== 'playing') return
    setRevealedOptions(0)
    sound.playQuestionReveal()

    const timers = [0, 1, 2, 3].map(i => window.setTimeout(() => {
      setRevealedOptions(count => Math.max(count, i + 1))
      sound.playOptionReveal(i)
    }, 450 + i * 260))

    return () => timers.forEach(window.clearTimeout)
  }, [mounted, currentUser, runId, level, status])

  useEffect(() => {
    if (status === 'won') sound.playMillionWin()
  }, [status])

  const question = questions[level]
  const currentAmount = MONEY_LADDER[level]
  const securedAmount = safeAmount(level)
  const wonAmount = status === 'won' ? MONEY_LADDER[MONEY_LADDER.length - 1] : status === 'walked' ? (level === 0 ? 0 : MONEY_LADDER[level - 1]) : status === 'lost' ? securedAmount : 0

  const answerLetters = useMemo(() => ['A', 'B', 'C', 'D'], [])

  const resetGame = () => {
    sound.playTick()
    setQuestions(shuffle(QUESTIONS).slice(0, 15))
    setRunId(id => id + 1)
    setLevel(0)
    setPicked(null)
    setStatus('playing')
    setHiddenOptions([])
    setFriendAdvice(null)
    setAudience(null)
    setUsed({ friend: false, fifty: false, audience: false })
  }

  const finish = (result: 'won' | 'lost' | 'walked', amount: number) => {
    const xp = result === 'won' ? 250 : Math.max(20, Math.round(amount / 4000))
    addXp(xp)
    if (result === 'won') unlockBadge('millionnaire')
    setStatus(result)
  }

  const choose = (index: number) => {
    if (picked !== null || hiddenOptions.includes(index) || status !== 'playing') return
    setPicked(index)
    const correct = index === question.answer
    if (correct) {
      sound.playMillionCorrect()
      window.setTimeout(() => {
        if (level + 1 >= MONEY_LADDER.length) {
          finish('won', MONEY_LADDER[MONEY_LADDER.length - 1])
        } else {
          setLevel(v => v + 1)
          setPicked(null)
          setHiddenOptions([])
          setFriendAdvice(null)
          setAudience(null)
        }
      }, 850)
    } else {
      sound.playFailure()
      window.setTimeout(() => finish('lost', securedAmount), 850)
    }
  }

  const useFriend = () => {
    if (used.friend || picked !== null) return
    sound.playTick()
    setUsed(prev => ({ ...prev, friend: true }))
    setFriendAdvice(`${question.friend} Je choisirais ${answerLetters[question.answer]} avec environ ${78 + Math.floor(Math.random() * 14)} % de confiance.`)
  }

  const useFifty = () => {
    if (used.fifty || picked !== null) return
    sound.playTick()
    const wrong = shuffle([0, 1, 2, 3].filter(i => i !== question.answer)).slice(0, 2)
    setUsed(prev => ({ ...prev, fifty: true }))
    setHiddenOptions(wrong)
  }

  const useAudience = () => {
    if (used.audience || picked !== null) return
    sound.playTick()
    setUsed(prev => ({ ...prev, audience: true }))
    setAudience(audienceVotes(question.answer))
  }

  if (!mounted || !currentUser || !question) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-base)' }}>
        <p className="label-caps" style={{ color: 'var(--text-tertiary)' }}>Chargement...</p>
      </div>
    )
  }

  const gameOver = status !== 'playing'

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-base)' }}>
      <DiscoveryHeader />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-7 pb-16">
        <div className="grid lg:grid-cols-[1fr_300px] gap-5 items-start">
          <section
            className="relative overflow-hidden rounded-2xl p-5 sm:p-7"
            style={{
              background: 'radial-gradient(circle at 50% 0%, rgba(201,168,106,0.15), transparent 34%), var(--bg-panel)',
              border: '1px solid var(--border-default)',
              boxShadow: '0 14px 50px rgba(0,0,0,0.12)',
            }}
          >
            {status === 'won' && <Confetti count={60} />}

            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <p className="label-caps mb-1" style={{ color: 'var(--accent-warm)' }}>Quiz économie globale</p>
                <h1 className="font-editorial text-3xl sm:text-4xl m-0" style={{ color: 'var(--text-primary)' }}>
                  Qui veut gagner le million ?
                </h1>
              </div>
              <div
                className="rounded-xl px-4 py-3 text-right"
                style={{ backgroundColor: 'rgba(201,168,106,0.1)', border: '1px solid rgba(201,168,106,0.3)' }}
              >
                <p className="label-caps m-0" style={{ color: 'var(--text-tertiary)' }}>Question {level + 1} / 15</p>
                <p className="font-mono text-lg font-bold tabular m-0" style={{ color: 'var(--accent-warm)' }}>
                  {formatMoney(currentAmount)}
                </p>
              </div>
            </div>

            <div
              className="rounded-2xl p-4 mb-5"
              style={{ backgroundColor: 'rgba(92,126,146,0.08)', border: '1px dashed rgba(92,126,146,0.35)' }}
            >
              <div className="flex items-start gap-3">
                <HelpCircle size={20} className="shrink-0 mt-0.5" style={{ color: 'var(--accent-cool)' }} />
                <div>
                  <p className="label-caps mb-1" style={{ color: 'var(--accent-cool)' }}>Tuto rapide</p>
                  <p className="text-xs leading-relaxed m-0" style={{ color: 'var(--text-secondary)' }}>
                    Réponds aux 15 questions pour atteindre le million. Une erreur termine la partie, mais les paliers
                    sécurisés à {formatMoney(MONEY_LADDER[4])}, {formatMoney(MONEY_LADDER[9])} et {formatMoney(MONEY_LADDER[12])}
                    protègent une partie de tes gains. Tu peux aussi partir avec tes gains avant de répondre.
                  </p>
                  <div className="grid sm:grid-cols-3 gap-2 mt-3">
                    <div className="rounded-xl px-3 py-2 text-[11px]" style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                      <Bot size={13} className="inline mr-1" style={{ color: '#5C7E92' }} /> Ami chatbot : donne un conseil.
                    </div>
                    <div className="rounded-xl px-3 py-2 text-[11px]" style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                      <Scissors size={13} className="inline mr-1" style={{ color: '#C9A86A' }} /> 50:50 : retire deux mauvaises réponses.
                    </div>
                    <div className="rounded-xl px-3 py-2 text-[11px]" style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                      <Users size={13} className="inline mr-1" style={{ color: '#4A9D7C' }} /> Public : affiche un vote indicatif.
                    </div>
                  </div>
                  <p className="text-[11px] leading-relaxed mt-3 mb-0" style={{ color: 'var(--text-tertiary)' }}>
                    Chaque aide est utilisable une seule fois par partie. Quand elle est utilisée, elle apparaît barrée.
                  </p>
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {gameOver ? (
                <motion.div
                  key="end"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-10"
                >
                  <div className="text-6xl mb-4">{status === 'won' ? '🏆' : status === 'walked' ? '💼' : '🎓'}</div>
                  <h2 className="font-editorial-roman text-2xl mb-2" style={{ color: 'var(--text-primary)' }}>
                    {status === 'won' ? 'Million atteint !' : status === 'walked' ? 'Tu repars avec tes gains.' : 'Partie terminée.'}
                  </h2>
                  <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                    Gain final : <strong style={{ color: 'var(--accent-warm)' }}>{formatMoney(wonAmount)}</strong>
                  </p>
                  <p className="text-xs max-w-lg mx-auto mb-6" style={{ color: 'var(--text-tertiary)' }}>
                    {status === 'won'
                      ? 'Tu as traversé macroéconomie, portefeuille, cours et banque centrale sans tomber.'
                      : `La bonne réponse était ${answerLetters[question.answer]}. ${question.explanation}`}
                  </p>
                  <div className="flex justify-center gap-3 flex-wrap">
                    <button onClick={resetGame} className="px-5 py-3 rounded-xl text-xs font-bold inline-flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #C41923 0%, #8B131B 100%)', color: '#fff', border: 'none', cursor: 'pointer' }}>
                      <RotateCcw size={15} /> Rejouer
                    </button>
                    <button onClick={() => router.push('/decouverte')} className="px-5 py-3 rounded-xl text-xs font-bold" style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)', cursor: 'pointer' }}>
                      Retour découverte
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={`${runId}-${question.id}`}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -18 }}
                  transition={{ duration: 0.28 }}
                >
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <span className="label-badge" style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--accent-cool)' }}>
                      {question.topic}
                    </span>
                    {securedAmount > 0 && (
                      <span className="label-badge" style={{ backgroundColor: 'rgba(74,157,124,0.12)', color: '#4A9D7C' }}>
                        Palier sécurisé : {formatMoney(securedAmount)}
                      </span>
                    )}
                  </div>

                  <div
                    className="rounded-2xl p-5 sm:p-6 mb-5 text-center"
                    style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-subtle)' }}
                  >
                    <HelpCircle size={28} className="mx-auto mb-3" style={{ color: 'var(--accent-warm)' }} />
                    <h2 className="text-lg sm:text-xl font-semibold leading-snug m-0" style={{ color: 'var(--text-primary)' }}>
                      {question.question}
                    </h2>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3 mb-5">
                    {question.options.map((option, index) => {
                      const hidden = hiddenOptions.includes(index)
                      const revealed = index < revealedOptions
                      const isPicked = picked === index
                      const showCorrect = picked !== null && index === question.answer
                      const showWrong = isPicked && index !== question.answer
                      return (
                        <button
                          key={option}
                          disabled={!revealed || hidden || picked !== null}
                          onClick={() => choose(index)}
                          className="min-h-[72px] rounded-xl px-4 py-3 text-left text-sm font-semibold transition-all"
                          style={{
                            opacity: !revealed ? 0 : hidden ? 0.18 : 1,
                            transform: revealed ? 'translateY(0)' : 'translateY(10px)',
                            backgroundColor: showCorrect ? 'rgba(74,157,124,0.16)' : showWrong ? 'rgba(194,84,80,0.14)' : 'var(--bg-elevated)',
                            border: `1.5px solid ${showCorrect ? '#4A9D7C' : showWrong ? '#C25450' : 'var(--border-default)'}`,
                            color: showCorrect ? '#4A9D7C' : showWrong ? '#C25450' : 'var(--text-primary)',
                            cursor: !revealed || hidden || picked !== null ? 'default' : 'pointer',
                          }}
                        >
                          <span className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-mono text-xs" style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-default)', color: 'var(--accent-warm)' }}>
                              {answerLetters[index]}
                            </span>
                            <span>{hidden ? 'Réponse annulée' : option}</span>
                            {showCorrect && <Check size={17} className="ml-auto" />}
                            {showWrong && <X size={17} className="ml-auto" />}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  <div className="grid sm:grid-cols-3 gap-2.5 mb-4">
                    <button onClick={useFriend} disabled={used.friend || picked !== null} className="relative overflow-hidden rounded-xl px-3 py-3 text-xs font-bold inline-flex items-center justify-center gap-2" style={{ backgroundColor: used.friend ? 'var(--bg-base)' : 'rgba(92,126,146,0.12)', color: used.friend ? 'var(--text-tertiary)' : '#5C7E92', border: '1px solid rgba(92,126,146,0.28)', cursor: used.friend ? 'default' : 'pointer', textDecorationLine: used.friend ? 'line-through' : 'none', textDecorationThickness: '2px' }}>
                      {used.friend && <span aria-hidden="true" className="absolute left-3 right-3 top-1/2 h-[2px]" style={{ backgroundColor: 'currentColor', opacity: 0.75, transform: 'rotate(-8deg)' }} />}
                      <Bot size={15} /> Ami chatbot
                    </button>
                    <button onClick={useFifty} disabled={used.fifty || picked !== null} className="relative overflow-hidden rounded-xl px-3 py-3 text-xs font-bold inline-flex items-center justify-center gap-2" style={{ backgroundColor: used.fifty ? 'var(--bg-base)' : 'rgba(201,168,106,0.12)', color: used.fifty ? 'var(--text-tertiary)' : '#C9A86A', border: '1px solid rgba(201,168,106,0.3)', cursor: used.fifty ? 'default' : 'pointer', textDecorationLine: used.fifty ? 'line-through' : 'none', textDecorationThickness: '2px' }}>
                      {used.fifty && <span aria-hidden="true" className="absolute left-3 right-3 top-1/2 h-[2px]" style={{ backgroundColor: 'currentColor', opacity: 0.75, transform: 'rotate(-8deg)' }} />}
                      <Scissors size={15} /> 50:50
                    </button>
                    <button onClick={useAudience} disabled={used.audience || picked !== null} className="relative overflow-hidden rounded-xl px-3 py-3 text-xs font-bold inline-flex items-center justify-center gap-2" style={{ backgroundColor: used.audience ? 'var(--bg-base)' : 'rgba(74,157,124,0.12)', color: used.audience ? 'var(--text-tertiary)' : '#4A9D7C', border: '1px solid rgba(74,157,124,0.28)', cursor: used.audience ? 'default' : 'pointer', textDecorationLine: used.audience ? 'line-through' : 'none', textDecorationThickness: '2px' }}>
                      {used.audience && <span aria-hidden="true" className="absolute left-3 right-3 top-1/2 h-[2px]" style={{ backgroundColor: 'currentColor', opacity: 0.75, transform: 'rotate(-8deg)' }} />}
                      <Users size={15} /> Public
                    </button>
                  </div>

                  {(friendAdvice || audience) && (
                    <div className="grid md:grid-cols-2 gap-3 mb-4">
                      {friendAdvice && (
                        <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-subtle)' }}>
                          <p className="label-caps mb-1" style={{ color: '#5C7E92' }}>Avis du chatbot</p>
                          <p className="text-xs leading-relaxed m-0" style={{ color: 'var(--text-secondary)' }}>{friendAdvice}</p>
                        </div>
                      )}
                      {audience && (
                        <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-subtle)' }}>
                          <p className="label-caps mb-2 flex items-center gap-1" style={{ color: '#4A9D7C' }}><PieChart size={12} /> Vote du public</p>
                          <div className="space-y-2">
                            {audience.map((pct, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <span className="font-mono text-[10px] w-4" style={{ color: 'var(--text-tertiary)' }}>{answerLetters[i]}</span>
                                <div className="h-2 rounded-full flex-1" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: '#4A9D7C' }} />
                                </div>
                                <span className="font-mono text-[10px] w-8 text-right" style={{ color: 'var(--text-secondary)' }}>{pct}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <button
                      onClick={() => finish('walked', level === 0 ? 0 : MONEY_LADDER[level - 1])}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2"
                      style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)', cursor: 'pointer' }}
                    >
                      <HandCoins size={15} /> Partir avec {formatMoney(level === 0 ? 0 : MONEY_LADDER[level - 1])}
                    </button>
                    {picked !== null && (
                      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {picked === question.answer ? question.explanation : 'La partie se termine sur cette question.'}
                      </span>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          <aside className="rounded-2xl p-4" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-default)' }}>
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={18} style={{ color: 'var(--accent-warm)' }} />
              <h2 className="label-caps m-0" style={{ color: 'var(--text-secondary)' }}>Pyramide des gains</h2>
            </div>
            <div className="flex flex-col-reverse gap-1.5">
              {MONEY_LADDER.map((amount, i) => {
                const active = i === level && status === 'playing'
                const passed = i < level || status === 'won'
                const milestone = SAFETY_LEVELS.includes(i) || i === 14
                return (
                  <div
                    key={amount}
                    className="flex items-center justify-between rounded-lg px-3 py-2 font-mono text-[11px] tabular"
                    style={{
                      backgroundColor: active ? 'rgba(201,168,106,0.16)' : passed ? 'rgba(74,157,124,0.1)' : 'var(--bg-base)',
                      border: `1px solid ${active ? 'rgba(201,168,106,0.55)' : milestone ? 'rgba(201,168,106,0.25)' : 'var(--border-subtle)'}`,
                      color: active ? 'var(--accent-warm)' : passed ? '#4A9D7C' : 'var(--text-tertiary)',
                      fontWeight: active || milestone ? 800 : 600,
                    }}
                  >
                    <span>{i + 1}</span>
                    <span>{formatMoney(amount)}</span>
                  </div>
                )
              })}
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
