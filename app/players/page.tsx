'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Trophy, GraduationCap, LayoutDashboard, Sliders, Users, LogOut, ArrowLeft
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { ThemeToggle } from '@/components/shell/ThemeToggle'
import { sound } from '@/lib/audio'

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
}

export default function PlayersLeaderboardPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  const currentUser = useAuthStore(s => s.currentUser)
  const getCurrentPlayer = useAuthStore(s => s.getCurrentPlayer)
  const getPlayerStats = useAuthStore(s => s.getPlayerStats)
  const logout = useAuthStore(s => s.logout)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (mounted && !currentUser) {
      router.push('/login')
    }
  }, [mounted, currentUser, router])

  const player = useMemo(() => mounted ? getCurrentPlayer() : null, [mounted, getCurrentPlayer])
  const stats = useMemo(() => mounted ? getPlayerStats() : null, [mounted, getPlayerStats])

  const leaderboard = useMemo(() => {
    const userBest = stats ? stats.bestScore : 0
    const competitors = [
      { name: 'Abdellatif Jouahri', score: 96, title: "Gouverneur de Légende", avatar: "🇲🇦" },
      { name: 'Taylor Rule Bot', score: 91, title: "Gouverneur d'Or", avatar: "🤖" },
      { name: 'Ilyass E.', score: 87, title: "Gouverneur d'Or", avatar: "👨‍💻" },
      { name: 'Prof. Alami', score: 82, title: "Gouverneur d'Argent", avatar: "👨‍🏫" },
      { name: 'Claude Sonnet', score: 78, title: "Gouverneur d'Argent", avatar: "🦾" },
      { name: 'Simulation Rookie', score: 52, title: "Stagiaire au guichet", avatar: "👶" },
    ]
    
    if (userBest > 0) {
      let userTitle = "Stagiaire au guichet"
      if (userBest >= 90) userTitle = "Gouverneur de Platine"
      else if (userBest >= 80) userTitle = "Gouverneur d'Or"
      else if (userBest >= 70) userTitle = "Gouverneur d'Argent"
      else if (userBest >= 50) userTitle = "Gouverneur de Bronze"

      competitors.push({
        name: `${player?.pseudo} (Vous)`,
        score: userBest,
        title: userTitle,
        avatar: "👑"
      })
    }
    
    return competitors.sort((a, b) => b.score - a.score)
  }, [stats, player])

  if (!mounted || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-base)' }}>
        <p className="label-caps" style={{ color: 'var(--text-tertiary)' }}>Chargement…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-base)' }}>

      {/* ══════ NAV BAR ══════ */}
      <nav
        className="flex items-center justify-between px-6"
        style={{ height: '52px', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-base)' }}
      >
        <div className="flex items-center gap-3">
          <a href="/" className="font-editorial text-sm" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>CBS</a>
          <span style={{ color: 'var(--border-default)' }}>·</span>
          <a href="/courses" className="label-caps flex items-center gap-1" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '11px' }}>
            <GraduationCap size={12} /> Cours
          </a>
          <span style={{ color: 'var(--border-default)' }}>·</span>
          <a href="/training" className="label-caps flex items-center gap-1" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '11px' }}>
            <Sliders size={12} style={{ color: 'var(--accent-cool)' }} /> Entraînement
          </a>
          <span style={{ color: 'var(--border-default)' }}>·</span>
          <a href="/dashboard" className="label-caps flex items-center gap-1" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '11px' }}>
            <LayoutDashboard size={12} style={{ color: 'var(--accent-warm)' }} /> Simulation
          </a>
          <span style={{ color: 'var(--border-default)' }}>·</span>
          <a href="/players" className="label-caps flex items-center gap-1 font-bold text-[var(--text-primary)]" style={{ textDecoration: 'none', fontSize: '11px' }}>
            <Users size={12} style={{ color: 'var(--accent-primary)' }} /> Joueurs
          </a>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            {player?.pseudo}
          </span>
          <ThemeToggle />
          <button
            onClick={() => { logout(); router.push('/') }}
            className="flex items-center gap-1.5 label-caps transition-colors"
            style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <LogOut size={12} />
            Déconnexion
          </button>
        </div>
      </nav>

      {/* ══════ MAIN CONTENT ══════ */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-10">

        {/* ══════ HEADER BANNER ══════ */}
        <motion.div className="mb-10 text-left" {...fadeUp}>
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1.5 label-caps mb-3 transition-colors hover:text-[var(--text-primary)]"
            style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <ArrowLeft size={12} />
            Retour Simulation
          </button>
          <h1 className="font-editorial text-3xl sm:text-4xl mb-2" style={{ color: 'var(--text-primary)' }}>
            Classement des Gouverneurs
          </h1>
          <p className="text-xs uppercase font-mono tracking-widest" style={{ color: 'var(--text-tertiary)' }}>
            CBS serious game · Légende & Palmarès des Gouverneurs
          </p>
        </motion.div>

        {/* ══════ LEADERBOARD CARD ══════ */}
        <motion.div
          className="rounded-xl p-6 transition-all duration-300"
          style={{
            backgroundColor: 'var(--bg-panel)',
            border: '1px solid var(--border-default)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }}
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.1 }}
        >
          <div className="flex items-center justify-between border-b pb-4 mb-5 text-left" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center gap-2">
              <Trophy size={16} style={{ color: 'var(--accent-warm)' }} />
              <span className="label-caps font-semibold tracking-wider text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                PALMARÈS DES GOUVERNEURS CBS
              </span>
            </div>
            <span className="font-mono text-[9px] px-2.5 py-1 rounded" style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-tertiary)', border: '1px solid var(--border-subtle)' }}>
              Mode Compétitif Actif
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {leaderboard.map((item, idx) => {
              const isUser = item.name.includes('(Vous)')
              const rank = idx + 1
              const isTop3 = rank <= 3
              const rankColor = rank === 1 ? '#D4AF37' : rank === 2 ? '#C0C0C0' : rank === 3 ? '#CD7F32' : 'var(--text-tertiary)'
              const bgGradient = isUser 
                ? 'linear-gradient(135deg, rgba(180, 25, 35, 0.08) 0%, rgba(201, 168, 106, 0.04) 100%)' 
                : 'var(--bg-elevated)'

              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.3 }}
                  className="rounded-lg p-4 flex items-center justify-between transition-all"
                  style={{
                    background: bgGradient,
                    border: isUser ? '1px solid var(--accent-warm)' : '1px solid var(--border-subtle)',
                    boxShadow: isUser ? '0 4px 16px rgba(180,25,35,0.08)' : 'none'
                  }}
                >
                  <div className="flex items-center gap-4 text-left">
                    {/* Rank Badge */}
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center font-editorial font-bold shadow-sm"
                      style={{
                        backgroundColor: isTop3 ? rankColor + '20' : 'var(--bg-base)',
                        border: `1px solid ${isTop3 ? rankColor : 'var(--border-subtle)'}`,
                        color: isTop3 ? rankColor : 'var(--text-secondary)',
                        fontSize: '14px'
                      }}
                    >
                      {rank}
                    </div>
                    {/* Avatar */}
                    <span className="text-2xl">{item.avatar}</span>
                    <div>
                      <p className={`text-sm font-semibold m-0 ${isUser ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}`}>
                        {item.name}
                      </p>
                      <p className="text-[10px] label-caps tracking-wider text-[var(--text-tertiary)] m-0 mt-0.5">
                        {item.title}
                      </p>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <span className="font-editorial-roman text-2xl font-bold block" style={{ color: isUser ? 'var(--accent-primary)' : 'var(--text-secondary)', lineHeight: 1 }}>
                      {item.score}
                    </span>
                    <span className="text-[9px] font-mono uppercase text-[var(--text-tertiary)]">points</span>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Motivational Footer Message */}
          <div className="mt-6 p-4 rounded-lg border text-xs leading-relaxed text-left" style={{ backgroundColor: 'rgba(255,255,255,0.02)', borderColor: 'var(--border-subtle)' }}>
            <span className="font-semibold block mb-1 text-[var(--text-primary)]">🚀 Améliorez votre classement :</span>
            <p className="text-[11px] text-[var(--text-secondary)] m-0 leading-relaxed">
              Chaque partie terminée avec un score élevé met immédiatement à jour votre classement. Battez le score historique de 96 points du gouverneur <strong>Abdellatif Jouahri</strong> pour inscrire votre nom tout en haut de la Légende CBS !
            </p>
          </div>
        </motion.div>

      </main>
    </div>
  )
}
