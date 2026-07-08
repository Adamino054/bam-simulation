'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { SlideWidget } from '@/engine/discovery'
import { sound } from '@/lib/audio'

/**
 * Mini-widgets interactifs insérés dans les histoires du Mode Découverte.
 * Chacun fait « toucher du doigt » un concept du mode expert sans un seul chiffre imposé.
 */

/* ── 🎈 Le ballon des prix (inflation) ─────────────────────────── */

function BalloonWidget() {
  const [air, setAir] = useState(40) // 0–100

  const isFlat = air < 18
  const isIdeal = air >= 18 && air <= 62
  const isDanger = air > 84
  const scale = 0.5 + (air / 100) * 1.1

  const message = isFlat
    ? '😴 Pas assez d’air : le ballon retombe, l’économie s’endort...'
    : isDanger
      ? '💥 Attention !! Trop gonflé, il va exploser !'
      : isIdeal
        ? '😊 Parfait ! Juste ce qu’il faut d’air : le ballon vole tranquillement.'
        : '😬 Ça commence à faire beaucoup d’air...'

  const color = isFlat ? '#5C7E92' : isDanger ? '#C25450' : isIdeal ? '#4A9D7C' : '#C9A86A'

  return (
    <div className="rounded-xl p-5 text-center" style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
      <div className="h-24 flex items-end justify-center mb-3" style={{ overflow: 'visible' }}>
        <motion.span
          animate={{
            scale,
            rotate: isDanger ? [0, -6, 6, -6, 0] : 0,
            y: isFlat ? 12 : [0, -5, 0],
          }}
          transition={{
            scale: { type: 'spring', damping: 14 },
            rotate: { duration: 0.4, repeat: isDanger ? Infinity : 0 },
            y: isFlat ? { duration: 0.3 } : { duration: 2, repeat: Infinity, ease: 'easeInOut' },
          }}
          style={{ fontSize: '52px', display: 'inline-block', transformOrigin: 'bottom center' }}
        >
          🎈
        </motion.span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={air}
        onChange={e => setAir(Number(e.target.value))}
        className="w-full"
        style={{ accentColor: color, cursor: 'pointer' }}
        aria-label="Quantité d’air dans le ballon"
      />
      <div className="flex justify-between text-[9px] mt-1 mb-2" style={{ color: 'var(--text-tertiary)' }}>
        <span>Pas d’air (prix qui baissent)</span>
        <span>Trop d’air (prix qui explosent)</span>
      </div>
      <p className="text-xs font-semibold m-0" style={{ color }}>{message}</p>
    </div>
  )
}

/* ── 🚗 La pédale magique (taux directeur) ─────────────────────── */

function PedalWidget() {
  const [rate, setRate] = useState(50) // 0 = accélérateur à fond, 100 = frein à fond

  // Plus le taux est haut, plus les prix se calment... et plus l'activité ralentit
  const heat = 100 - rate      // « chaleur » de l'économie
  const prices = 100 - rate    // vitesse des prix

  const label =
    rate > 75 ? '🧊 Gros coup de frein : les prix se calment mais l’activité gèle !' :
    rate > 55 ? '🚗 Léger freinage : les prix respirent.' :
    rate > 40 ? '😌 Conduite tranquille, tout roule.' :
    rate > 20 ? '🔥 Petit coup d’accélérateur : les achats repartent.' :
    '🥵 Pied au plancher : tout le monde emprunte... et les prix flambent !'

  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
      <div className="text-center mb-1">
        <span className="label-caps" style={{ fontSize: '9px', color: 'var(--text-tertiary)' }}>
          Le taux directeur = ta pédale
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={rate}
        onChange={e => setRate(Number(e.target.value))}
        className="w-full"
        style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
        aria-label="Position de la pédale (taux directeur)"
      />
      <div className="flex justify-between text-[9px] mt-1 mb-4" style={{ color: 'var(--text-tertiary)' }}>
        <span>🔥 Accélérer (taux bas)</span>
        <span>🧊 Freiner (taux haut)</span>
      </div>

      {[
        { label: '🎈 Vitesse des prix', value: prices, color: prices > 70 ? '#C25450' : prices > 40 ? '#C9A86A' : '#5C7E92' },
        { label: '🏭 Activité et embauches', value: heat, color: heat > 60 ? '#4A9D7C' : heat > 30 ? '#C9A86A' : '#C25450' },
      ].map(bar => (
        <div key={bar.label} className="mb-2.5">
          <div className="flex justify-between text-[10px] mb-1">
            <span style={{ color: 'var(--text-secondary)' }}>{bar.label}</span>
          </div>
          <div className="progress-bar" style={{ height: '8px' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: bar.color }}
              animate={{ width: `${bar.value}%` }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>
      ))}
      <p className="text-xs font-semibold text-center mt-3 m-0" style={{ color: 'var(--text-primary)' }}>{label}</p>
    </div>
  )
}

/* ── ⚖️ La balançoire (arbitrage prix / emplois) ───────────────── */

function SeesawWidget() {
  const [balance, setBalance] = useState(50) // 0 = tout pour les prix, 100 = tout pour l'emploi

  const angle = ((balance - 50) / 50) * 12 // -12° à +12°
  const message =
    balance < 25 ? '🥶 Prix très calmes... mais le chômage grimpe. La balançoire penche trop !' :
    balance > 75 ? '🥵 Plein d’emplois... mais les prix s’envolent. La balançoire penche trop !' :
    '😊 Bel équilibre : des prix sages ET du travail pour presque tous.'

  const color = balance >= 25 && balance <= 75 ? '#4A9D7C' : '#C25450'

  return (
    <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
      <div className="relative h-24 flex items-center justify-center mb-2" aria-hidden="true">
        {/* Planche */}
        <motion.div
          className="absolute flex items-center justify-between px-2"
          animate={{ rotate: angle }}
          transition={{ type: 'spring', damping: 14 }}
          style={{
            width: '82%', height: '10px', borderRadius: '6px',
            background: 'linear-gradient(90deg, #5C7E92 0%, var(--accent-warm) 100%)',
            top: '38px', transformOrigin: 'center center',
          }}
        >
          <motion.span style={{ fontSize: '26px', marginTop: '-30px' }} animate={{ y: angle }}>🎈</motion.span>
          <motion.span style={{ fontSize: '26px', marginTop: '-30px' }} animate={{ y: -angle }}>💼</motion.span>
        </motion.div>
        {/* Pivot */}
        <div
          style={{
            position: 'absolute', top: '46px', width: 0, height: 0,
            borderLeft: '16px solid transparent', borderRight: '16px solid transparent',
            borderBottom: '30px solid var(--bg-hover)',
          }}
        />
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={balance}
        onChange={e => setBalance(Number(e.target.value))}
        className="w-full"
        style={{ accentColor: color, cursor: 'pointer' }}
        aria-label="Équilibre entre prix calmes et emplois"
      />
      <div className="flex justify-between text-[9px] mt-1 mb-2" style={{ color: 'var(--text-tertiary)' }}>
        <span>🎈 Tout pour des prix calmes</span>
        <span>💼 Tout pour les emplois</span>
      </div>
      <p className="text-xs font-semibold text-center m-0" style={{ color }}>{message}</p>
    </div>
  )
}

/* ── 🤝 La jauge de confiance (crédibilité) ────────────────────── */

function TrustWidget() {
  const [trust, setTrust] = useState(55)

  const keepPromise = () => {
    sound.playSuccess()
    setTrust(t => Math.min(100, t + 8))
  }
  const zigzag = () => {
    sound.playFailure()
    setTrust(t => Math.max(0, t - 25))
  }

  const face = trust >= 80 ? '🤝' : trust >= 55 ? '🙂' : trust >= 30 ? '😕' : '😠'
  const message =
    trust >= 80 ? 'On te croit sur parole : tes annonces suffisent à calmer les prix !' :
    trust >= 55 ? 'La confiance est correcte. Continue à tenir tes promesses.' :
    trust >= 30 ? 'Les gens doutent... Il faudra du temps pour les reconquérir.' :
    'Plus personne ne t’écoute. Remonter la pente sera long !'

  return (
    <div className="rounded-xl p-5 text-center" style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}>
      <motion.div key={face} initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="text-4xl mb-2">
        {face}
      </motion.div>
      <div className="progress-bar mb-1" style={{ height: '10px' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: trust >= 55 ? '#4A9D7C' : trust >= 30 ? '#C9A86A' : '#C25450' }}
          animate={{ width: `${trust}%` }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <p className="text-[10px] mb-3" style={{ color: 'var(--text-tertiary)' }}>Jauge de confiance du public</p>
      <div className="flex gap-2 justify-center flex-wrap">
        <button
          onClick={keepPromise}
          className="px-3 py-2 rounded-lg text-[11px] font-bold transition-transform"
          style={{ backgroundColor: 'rgba(74,157,124,0.14)', color: '#4A9D7C', border: '1px solid rgba(74,157,124,0.3)', cursor: 'pointer' }}
        >
          ✅ Promettre... et tenir (+8)
        </button>
        <button
          onClick={zigzag}
          className="px-3 py-2 rounded-lg text-[11px] font-bold transition-transform"
          style={{ backgroundColor: 'rgba(194,84,80,0.12)', color: '#C25450', border: '1px solid rgba(194,84,80,0.3)', cursor: 'pointer' }}
        >
          🌀 Zigzaguer sans prévenir (−25)
        </button>
      </div>
      <p className="text-xs font-semibold mt-3 m-0" style={{ color: 'var(--text-primary)' }}>{message}</p>
      <p className="text-[10px] mt-1.5 m-0" style={{ color: 'var(--text-tertiary)' }}>
        Tu remarques ? La confiance monte lentement... et s’écroule d’un coup.
      </p>
    </div>
  )
}

/* ── Dispatcher ─────────────────────────────────────────────────── */

export function StoryWidget({ widget }: { widget: SlideWidget }) {
  switch (widget) {
    case 'balloon': return <BalloonWidget />
    case 'pedal':   return <PedalWidget />
    case 'seesaw':  return <SeesawWidget />
    case 'trust':   return <TrustWidget />
    default:        return null
  }
}
