'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MATCHING_PAIRS } from '@/engine/discovery'
import { useDiscoveryStore } from '@/store/discoveryStore'
import { Confetti } from './Confetti'
import { Burst, ScoreRing, StarRow, NewRecordBanner, useCountUp } from './GameFx'
import { CoachBar, CoachFinale, COACH_PHRASES, pickPhrase } from './Coach'
import type { CoachLine } from './Coach'
import { sound } from '@/lib/audio'

const COACH_INTRO: CoachLine = {
  mood: 'idle',
  text: 'Relie chaque mot d’expert (à gauche) à son image toute simple (à droite). Clique une carte de chaque côté !',
}

/** Une couleur distincte par paire trouvée : on VOIT les familles se former */
const PAIR_COLORS = ['#C9A86A', '#4A9D7C', '#5C7E92', '#C25450', '#8E6FB0', '#4FA3A5', '#C77A3D', '#7A9D4A']

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function starsForErrors(errors: number): number {
  return errors === 0 ? 3 : errors <= 2 ? 2 : errors <= 4 ? 1 : 0
}

interface MatchingGameProps {
  onExit: () => void
}

/* ── Écran de fin ─────────────────────────────────────────────── */

function MatchingEndScreen({
  errors, earnedXp, isRecord, onReplay, onExit,
}: {
  errors: number
  earnedXp: number
  isRecord: boolean
  onReplay: () => void
  onExit: () => void
}) {
  const stars = starsForErrors(errors)
  const precision = Math.round((MATCHING_PAIRS.length / (MATCHING_PAIRS.length + errors)) * 100)
  const displayedXp = useCountUp(earnedXp, 1000)
  const color = errors === 0 ? '#C9A86A' : errors <= 3 ? '#4A9D7C' : '#C25450'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-2xl p-8 text-center overflow-hidden"
      style={{ backgroundColor: 'var(--bg-panel)', border: `1px solid ${color}44`, boxShadow: `0 12px 48px ${color}14` }}
    >
      {stars >= 2 && <Confetti count={32} />}

      <NewRecordBanner show={isRecord} />

      <div className="mb-4 flex items-center justify-center gap-4 sm:gap-6">
        <CoachFinale stars={stars} />
        <ScoreRing pct={precision} color={color} subLabel="de précision" />
      </div>

      <StarRow stars={stars} />

      <h2 className="font-editorial-roman text-2xl mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>
        {errors === 0 ? 'Traduction parfaite !' : 'Toutes les paires trouvées !'}
      </h2>
      <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
        {errors === 0
          ? 'Tu parles déjà la langue des économistes. Le mode expert n’attend plus que toi !'
          : `${errors} erreur${errors > 1 ? 's' : ''} en chemin — chaque essai t’apprend un mot d’expert !`}
      </p>
      <p className="font-mono text-sm mb-6 tabular" style={{ color: 'var(--accent-warm)', textShadow: '0 0 12px rgba(201,168,106,0.4)' }}>
        ✨ +{displayedXp} XP {errors === 0 ? '· Badge « Champion des paires » 🧩' : ''}
      </p>

      <div className="flex gap-3 justify-center flex-wrap">
        <button
          onClick={onReplay}
          className="px-6 py-3 rounded-xl text-xs font-bold"
          style={{ background: 'linear-gradient(135deg, #C41923 0%, #8B131B 100%)', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 18px rgba(180,25,35,0.35)' }}
        >
          🔄 Rejouer
        </button>
        <button
          onClick={onExit}
          className="px-6 py-3 rounded-xl text-xs font-bold"
          style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)', cursor: 'pointer' }}
        >
          ← Autres jeux
        </button>
      </div>
    </motion.div>
  )
}

/**
 * 🧩 Le Traducteur — associe chaque mot du mode expert à son image simple.
 * C'est LE jeu-pont : il apprend le vocabulaire du mode expert en s'amusant.
 */
export function MatchingGame({ onExit }: MatchingGameProps) {
  const addXp = useDiscoveryStore(s => s.addXp)
  const recordMatching = useDiscoveryStore(s => s.recordMatching)

  const [expertCol, setExpertCol] = useState(() => shuffle(MATCHING_PAIRS))
  const [simpleCol, setSimpleCol] = useState(() => shuffle(MATCHING_PAIRS))
  const [selExpert, setSelExpert] = useState<string | null>(null)
  const [selSimple, setSelSimple] = useState<string | null>(null)
  const [matched, setMatched] = useState<string[]>([])
  const [errors, setErrors] = useState(0)
  const [wrongFlash, setWrongFlash] = useState<{ e: string; s: string } | null>(null)
  const [finished, setFinished] = useState(false)
  const [earnedXp, setEarnedXp] = useState(0)
  const [isRecord, setIsRecord] = useState(false)
  const [burstTrigger, setBurstTrigger] = useState(0)
  const [coach, setCoach] = useState<CoachLine>(COACH_INTRO)

  /** Couleur attribuée à une paire selon son ordre de découverte */
  const pairColor = (id: string): string => {
    const idx = matched.indexOf(id)
    return idx >= 0 ? PAIR_COLORS[idx % PAIR_COLORS.length] : 'var(--border-default)'
  }

  const tryMatch = (expertId: string | null, simpleId: string | null) => {
    if (!expertId || !simpleId) return
    if (expertId === simpleId) {
      sound.playSuccess()
      setBurstTrigger(t => t + 1)
      const newMatched = [...matched, expertId]
      setMatched(newMatched)
      setSelExpert(null)
      setSelSimple(null)
      setCoach({
        mood: 'excited',
        text: newMatched.length === MATCHING_PAIRS.length
          ? 'Le pont est terminé ! Tu parles couramment l’économiste !'
          : pickPhrase(COACH_PHRASES.match),
      })
      if (newMatched.length === MATCHING_PAIRS.length) {
        const xp = Math.max(20, 60 - errors * 8)
        const prevBest = useDiscoveryStore.getState().getProfile().matchingBestErrors
        setIsRecord(prevBest === null || errors < prevBest)
        setEarnedXp(xp)
        recordMatching(errors)
        addXp(xp)
        setTimeout(() => setFinished(true), 900)
      }
    } else {
      sound.playFailure()
      setErrors(e => e + 1)
      setCoach({ mood: 'sad', text: pickPhrase(COACH_PHRASES.matchWrong) })
      setWrongFlash({ e: expertId, s: simpleId })
      setTimeout(() => {
        setWrongFlash(null)
        setSelExpert(null)
        setSelSimple(null)
      }, 650)
    }
  }

  const pickExpert = (id: string) => {
    if (matched.includes(id) || wrongFlash) return
    sound.playTick()
    setSelExpert(id)
    tryMatch(id, selSimple)
  }

  const pickSimple = (id: string) => {
    if (matched.includes(id) || wrongFlash) return
    sound.playTick()
    setSelSimple(id)
    tryMatch(selExpert, id)
  }

  const restart = () => {
    sound.playTick()
    setExpertCol(shuffle(MATCHING_PAIRS))
    setSimpleCol(shuffle(MATCHING_PAIRS))
    setSelExpert(null)
    setSelSimple(null)
    setMatched([])
    setErrors(0)
    setWrongFlash(null)
    setFinished(false)
    setEarnedXp(0)
    setIsRecord(false)
    setCoach(COACH_INTRO)
  }

  if (finished) {
    return <MatchingEndScreen errors={errors} earnedXp={earnedXp} isRecord={isRecord} onReplay={restart} onExit={onExit} />
  }

  const liveStars = starsForErrors(errors)

  const renderCard = (
    id: string,
    content: React.ReactNode,
    isSelected: boolean,
    isMatched: boolean,
    isWrong: boolean,
    onClick: () => void,
  ) => {
    const color = isMatched ? pairColor(id) : isWrong ? '#C25450' : isSelected ? 'var(--accent-warm)' : 'var(--border-default)'
    const orderNum = matched.indexOf(id) + 1
    return (
      <motion.button
        key={id}
        onClick={onClick}
        whileHover={!isMatched ? { scale: 1.025, y: -2 } : {}}
        whileTap={!isMatched ? { scale: 0.97 } : {}}
        animate={
          isWrong ? { x: [0, -7, 7, -4, 4, 0] } :
          isMatched ? { scale: [1, 1.08, 1] } :
          isSelected ? { scale: [1, 1.03, 1] } : {}
        }
        className="relative w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-colors"
        style={{
          backgroundColor: isMatched ? `${pairColor(id)}16` : isWrong ? 'rgba(194,84,80,0.12)' : isSelected ? 'rgba(201,168,106,0.14)' : 'var(--bg-elevated)',
          border: `1.5px solid ${color}`,
          color: isMatched ? pairColor(id) : 'var(--text-primary)',
          cursor: isMatched ? 'default' : 'pointer',
          opacity: isMatched ? 0.9 : 1,
          minHeight: '52px',
          boxShadow: isSelected ? '0 0 16px rgba(201,168,106,0.25)' : isMatched ? `0 0 10px ${pairColor(id)}22` : 'none',
        }}
      >
        {content}
        {/* Pastille numérotée de la paire */}
        {isMatched && (
          <motion.span
            initial={{ scale: 0, rotate: -60 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 10 }}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
            style={{ backgroundColor: pairColor(id), color: '#fff', boxShadow: `0 2px 8px ${pairColor(id)}66` }}
          >
            {orderNum}
          </motion.span>
        )}
      </motion.button>
    )
  }

  return (
    <div
      className="relative rounded-2xl p-5 sm:p-7 overflow-hidden"
      style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-default)' }}
    >
      <Burst trigger={burstTrigger} emojis={['🧩', '✨', '⭐']} />

      {/* HUD : étoiles en direct + erreurs */}
      <div className="flex items-center justify-between mb-3">
        <StarRow stars={liveStars} size={16} animate={false} />
        <span
          className="font-mono text-[10px] px-2.5 py-1 rounded-full tabular"
          style={{
            color: errors === 0 ? 'var(--data-positive)' : 'var(--text-tertiary)',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {errors === 0 ? '✨ Zéro erreur' : `${errors} erreur${errors > 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Le pont de traduction : se remplit paire par paire */}
      <div
        className="rounded-xl px-3 py-2.5 mb-4"
        style={{ backgroundColor: 'var(--bg-base)', border: '1px dashed var(--border-default)' }}
      >
        <span className="label-caps block text-center mb-1.5" style={{ fontSize: '7px', color: 'var(--text-tertiary)' }}>
          🌉 Ton pont de traduction · {matched.length}/{MATCHING_PAIRS.length}
        </span>
        <div className="flex justify-center gap-1.5">
          {MATCHING_PAIRS.map((_, i) => {
            const matchedId = matched[i]
            const pair = matchedId ? MATCHING_PAIRS.find(p => p.id === matchedId) : null
            return (
              <motion.div
                key={i}
                animate={pair ? { scale: [0.4, 1.25, 1], rotate: [0, 8, 0] } : {}}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                style={{
                  backgroundColor: pair ? `${PAIR_COLORS[i % PAIR_COLORS.length]}1E` : 'var(--bg-elevated)',
                  border: `1px solid ${pair ? PAIR_COLORS[i % PAIR_COLORS.length] + '66' : 'var(--border-subtle)'}`,
                }}
              >
                {pair ? pair.emoji : <span style={{ color: 'var(--text-tertiary)', fontSize: '9px' }}>?</span>}
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Prof. Floussi guide et réagit */}
      <div className="mb-5">
        <CoachBar line={coach} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-5">
        {/* Colonne expert */}
        <div className="flex flex-col gap-2">
          <span className="label-caps text-center mb-1" style={{ fontSize: '8px', color: 'var(--accent-cool)' }}>
            🏛️ En mode expert
          </span>
          {expertCol.map(pair =>
            renderCard(
              pair.id,
              <span className="font-mono text-[11px] font-bold">{pair.expert}</span>,
              selExpert === pair.id,
              matched.includes(pair.id),
              wrongFlash?.e === pair.id,
              () => pickExpert(pair.id),
            ),
          )}
        </div>

        {/* Colonne simple */}
        <div className="flex flex-col gap-2">
          <span className="label-caps text-center mb-1" style={{ fontSize: '8px', color: 'var(--accent-warm)' }}>
            🧸 En mots simples
          </span>
          {simpleCol.map(pair =>
            renderCard(
              pair.id,
              <span className="flex items-center gap-1.5"><span className="text-base">{pair.emoji}</span> {pair.simple}</span>,
              selSimple === pair.id,
              matched.includes(pair.id),
              wrongFlash?.s === pair.id,
              () => pickSimple(pair.id),
            ),
          )}
        </div>
      </div>

      <div className="text-center mt-5">
        <button
          onClick={onExit}
          className="text-[10px] label-caps"
          style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          ← Quitter le jeu
        </button>
      </div>
    </div>
  )
}
