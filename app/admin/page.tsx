'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Users, User, Clock, Trophy } from 'lucide-react'
import { ThemeToggle } from '@/components/shell/ThemeToggle'
import { useAuthStore } from '@/store/authStore'
import type { GameRecord, PlayerProfile } from '@/store/authStore'

type PlayerRow = {
  key: string
  profile: PlayerProfile
  totalGames: number
  bestScore: number | null
  lastGame: GameRecord | null
}

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
}

function formatDate(iso?: string | null) {
  if (!iso) return '—'
  const date = new Date(iso)
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateTime(iso?: string | null) {
  if (!iso) return '—'
  const date = new Date(iso)
  const dateStr = date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  const timeStr = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  return `${dateStr} · ${timeStr}`
}

export default function AdminPlayersPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  const currentUser = useAuthStore(s => s.currentUser)
  const players = useAuthStore(s => s.players)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (mounted && !currentUser) router.push('/login')
  }, [mounted, currentUser, router])

  const playerList = useMemo<PlayerRow[]>(() => {
    return Object.entries(players)
      .map(([key, profile]) => {
        const games = profile.gameHistory ?? []
        const bestScore = games.length ? Math.max(...games.map(g => g.score)) : null
        const lastGame = games[0] ?? null
        return { key, profile, totalGames: games.length, bestScore, lastGame }
      })
      .sort((a, b) => new Date(b.profile.createdAt).getTime() - new Date(a.profile.createdAt).getTime())
  }, [players])

  if (!mounted || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-base)' }}>
        <p className="label-caps" style={{ color: 'var(--text-tertiary)' }}>Chargement…</p>
      </div>
    )
  }

  const totalPlayers = playerList.length
  const totalGames = playerList.reduce((sum, p) => sum + p.totalGames, 0)
  const currentProfile = currentUser ? players[currentUser] : null

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-base)' }}>

      <nav
        className="flex items-center justify-between px-6"
        style={{ height: '52px', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-base)' }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1.5 label-caps"
            style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <ArrowLeft size={12} />
            Dashboard
          </button>
          <span style={{ color: 'var(--border-default)' }}>·</span>
          <Users size={13} style={{ color: 'var(--accent-cool)' }} />
          <span className="label-caps" style={{ color: 'var(--text-secondary)' }}>Joueurs locaux</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </nav>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">

        <motion.div className="mb-8" {...fadeUp}>
          <h1 className="font-editorial text-3xl mb-1" style={{ color: 'var(--text-primary)' }}>
            Joueurs enregistrés
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            Stockés localement dans ce navigateur (localStorage). Aucun serveur.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8"
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.08 }}
        >
          {[
            { label: 'Joueurs', value: totalPlayers.toString(), icon: Users, color: 'var(--accent-primary)' },
            { label: 'Parties totales', value: totalGames.toString(), icon: Trophy, color: 'var(--accent-warm)' },
            { label: 'Connecté', value: currentProfile?.pseudo ?? '—', icon: User, color: 'var(--text-secondary)' },
          ].map(card => {
            const Icon = card.icon
            return (
              <div
                key={card.label}
                className="rounded-lg p-4"
                style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-subtle)' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={12} style={{ color: card.color }} />
                  <span className="label-caps" style={{ fontSize: '8px' }}>{card.label}</span>
                </div>
                <span className="font-editorial-roman text-xl block" style={{ color: card.color }}>
                  {card.value}
                </span>
              </div>
            )
          })}
        </motion.div>

        {playerList.length === 0 ? (
          <motion.div
            className="rounded-lg p-16 text-center"
            style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-default)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Users size={40} style={{ color: 'var(--text-tertiary)', margin: '0 auto 16px' }} />
            <h2 className="font-editorial-roman text-2xl mb-3" style={{ color: 'var(--text-primary)' }}>
              Aucun joueur local
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Créez un profil pour qu'il apparaisse ici.
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {playerList.map((p, i) => {
              const isCurrent = currentUser === p.key
              const lastScenario = p.lastGame?.scenarioTitle ?? p.lastGame?.scenario ?? '—'
              return (
                <motion.div
                  key={p.key}
                  className="rounded-lg p-5"
                  style={{
                    backgroundColor: isCurrent ? 'var(--bg-elevated)' : 'var(--bg-panel)',
                    border: `1px solid ${isCurrent ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                    boxShadow: isCurrent ? '0 0 0 1px rgba(180,25,35,0.12)' : 'none',
                  }}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <User size={12} style={{ color: 'var(--text-tertiary)' }} />
                      <span className="font-editorial-roman text-xl" style={{ color: 'var(--text-primary)' }}>
                        {p.profile.pseudo}
                      </span>
                      {isCurrent && (
                        <span
                          className="label-caps px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: 'rgba(74,157,124,0.12)', color: '#4A9D7C', fontSize: '7px' }}
                        >
                          Connecté
                        </span>
                      )}
                    </div>
                    <span className="label-caps" style={{ color: 'var(--text-tertiary)', fontSize: '8px' }}>
                      Inscrit le {formatDate(p.profile.createdAt)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                    <div className="flex flex-col">
                      <span className="label-caps" style={{ fontSize: '8px', color: 'var(--text-tertiary)' }}>Parties</span>
                      <span className="font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>{p.totalGames}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="label-caps" style={{ fontSize: '8px', color: 'var(--text-tertiary)' }}>Meilleur score</span>
                      <span className="font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {p.bestScore !== null ? p.bestScore : '—'}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="label-caps" style={{ fontSize: '8px', color: 'var(--text-tertiary)' }}>Dernière partie</span>
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {formatDateTime(p.lastGame?.date ?? null)}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="label-caps" style={{ fontSize: '8px', color: 'var(--text-tertiary)' }}>Scénario</span>
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {lastScenario}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 mt-4" style={{ color: 'var(--text-tertiary)' }}>
                    <Clock size={11} />
                    <span className="label-caps" style={{ fontSize: '8px' }}>
                      Dernière activité : {formatDateTime(p.lastGame?.date ?? p.profile.createdAt)}
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
