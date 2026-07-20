'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Landmark, LogOut, ChevronRight } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useDiscoveryProfile } from '@/store/discoveryStore'
import { getLevelProgress } from '@/engine/discovery'
import { ThemeToggle } from '@/components/shell/ThemeToggle'
import { AssistantBot } from '@/components/ui/AssistantBot'
import { sound } from '@/lib/audio'

/**
 * Page de choix du mode, affichée juste après la connexion :
 * 🧭 Mode Découverte (zéro connaissance requise) ou 🏛️ Mode Expert.
 */
export default function ModeChoicePage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const currentUser = useAuthStore(s => s.currentUser)
  const getCurrentPlayer = useAuthStore(s => s.getCurrentPlayer)
  const logout = useAuthStore(s => s.logout)
  const profile = useDiscoveryProfile()

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (mounted && !currentUser) {
      router.push('/login')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, currentUser])

  if (!mounted || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-base)' }}>
        <p className="label-caps" style={{ color: 'var(--text-tertiary)' }}>Chargement…</p>
      </div>
    )
  }

  const player = getCurrentPlayer()
  const levelProgress = getLevelProgress(profile.xp)
  const hasDiscoveryProgress = profile.xp > 0

  const go = (path: string) => {
    sound.playTick()
    router.push(path)
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-base)', position: 'relative', overflow: 'hidden' }}>
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', top: '-120px', left: '50%', transform: 'translateX(-50%)',
          width: '1000px', height: '540px',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(180,25,35,0.10) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(240,240,234,0.04) 1px, transparent 1px)',
          backgroundSize: '32px 32px', pointerEvents: 'none',
        }}
      />

      {/* Nav minimale */}
      <nav className="relative flex items-center justify-between px-6" style={{ height: '52px' }}>
        <div className="flex items-center gap-2">
          <Landmark size={18} style={{ color: 'var(--accent-primary)' }} />
          <span className="font-editorial text-base" style={{ color: 'var(--accent-primary)' }}>CBS</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{player?.pseudo}</span>
          <ThemeToggle />
          <button
            onClick={() => { logout(); router.push('/') }}
            className="flex items-center gap-1.5 label-caps"
            style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <LogOut size={12} />
            Déconnexion
          </button>
        </div>
      </nav>

      <main className="relative flex-1 flex flex-col items-center justify-center px-6 py-10">
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="font-editorial text-3xl sm:text-4xl mb-3" style={{ color: 'var(--text-primary)' }}>
            Bonjour, {player?.pseudo} 👋
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            Comment veux-tu explorer l&apos;économie aujourd&apos;hui ?
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-3xl">
          {/* ── Mode Découverte ── */}
          <motion.button
            onClick={() => go('/decouverte')}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -6, scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            className="relative text-left rounded-2xl p-7 overflow-hidden"
            style={{
              backgroundColor: 'var(--bg-panel)',
              border: '1px solid rgba(201,168,106,0.35)',
              boxShadow: '0 8px 40px rgba(201,168,106,0.10)',
              cursor: 'pointer',
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
                background: 'linear-gradient(90deg, #C9A86A 0%, #4A9D7C 50%, #5C7E92 100%)',
              }}
            />
            <div className="text-5xl mb-4">🧭</div>
            <span
              className="label-badge mb-3"
              style={{ backgroundColor: 'rgba(74,157,124,0.14)', color: 'var(--data-positive)' }}
            >
              Aucune connaissance requise
            </span>
            <h2 className="font-editorial-roman text-xl mb-2" style={{ color: 'var(--text-primary)' }}>
              Mode Découverte
            </h2>
            <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
              Zéro formule, zéro jargon : des histoires illustrées, des mini-jeux et une
              mission de capitaine pour comprendre l&apos;économie <strong>en t&apos;amusant</strong>.
              Le chemin idéal avant de passer en mode expert !
            </p>
            <div className="flex flex-wrap gap-1.5 mb-5">
              {['📖 Histoires', '🕹️ Mini-jeux', '⛵ Mission', '🏅 Badges & XP'].map(tag => (
                <span key={tag} className="text-[10px] px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
                  {tag}
                </span>
              ))}
            </div>
            {hasDiscoveryProgress && (
              <p className="font-mono text-[10px] mb-4" style={{ color: 'var(--accent-warm)' }}>
                {levelProgress.current.emoji} Niveau {levelProgress.current.level} · {levelProgress.current.title} · {profile.xp} XP
              </p>
            )}
            <span
              className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-lg"
              style={{ background: 'linear-gradient(135deg, #C9A86A 0%, #8A6D3B 100%)', color: '#fff', boxShadow: '0 4px 16px rgba(201,168,106,0.3)' }}
            >
              {hasDiscoveryProgress ? 'Continuer l’aventure' : 'Commencer l’aventure'}
              <ChevronRight size={14} />
            </span>
          </motion.button>

          {/* ── Mode Expert ── */}
          <motion.button
            onClick={() => go('/dashboard')}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
            whileHover={{ y: -6, scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            className="relative text-left rounded-2xl p-7 overflow-hidden"
            style={{
              backgroundColor: 'var(--bg-panel)',
              border: '1px solid rgba(180,25,35,0.35)',
              boxShadow: '0 8px 40px rgba(180,25,35,0.10)',
              cursor: 'pointer',
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
                background: 'linear-gradient(90deg, #B41923 0%, #8B131B 100%)',
              }}
            />
            <div className="text-5xl mb-4">🏛️</div>
            <span
              className="label-badge mb-3"
              style={{ backgroundColor: 'rgba(180,25,35,0.12)', color: 'var(--accent-primary)' }}
            >
              Le simulateur complet
            </span>
            <h2 className="font-editorial-roman text-xl mb-2" style={{ color: 'var(--text-primary)' }}>
              Mode Expert
            </h2>
            <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--text-secondary)' }}>
              Incarne le gouverneur de la banque centrale : taux directeur, réserves
              obligatoires, forward guidance... Pilote l&apos;économie sur 5 ans avec le
              moteur macroéconomique complet.
            </p>
            <div className="flex flex-wrap gap-1.5 mb-5">
              {['📊 Scénarios', '🎯 Scoring', '🏆 Classement', '⚔️ Multijoueur'].map(tag => (
                <span key={tag} className="text-[10px] px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
                  {tag}
                </span>
              ))}
            </div>
            {(player?.gameHistory?.length ?? 0) > 0 && (
              <p className="font-mono text-[10px] mb-4" style={{ color: 'var(--accent-primary)' }}>
                🎮 {player?.gameHistory.length} partie{(player?.gameHistory?.length ?? 0) > 1 ? 's' : ''} jouée{(player?.gameHistory?.length ?? 0) > 1 ? 's' : ''}
              </p>
            )}
            <span
              className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-lg"
              style={{ background: 'linear-gradient(135deg, #C41923 0%, #8B131B 100%)', color: '#fff', boxShadow: '0 4px 16px rgba(180,25,35,0.3)' }}
            >
              Entrer dans la salle des marchés
              <ChevronRight size={14} />
            </span>
          </motion.button>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-[11px] mt-8 text-center"
          style={{ color: 'var(--text-tertiary)' }}
        >
          💡 Tu peux changer de mode à tout moment : les deux partagent ton profil <strong>{player?.pseudo}</strong>.
        </motion.p>
      </main>

      <AssistantBot
        messages={["Je peux t'aider a choisir entre Mode Decouverte et Mode Expert selon ton niveau et ton objectif."]}
        context="choice"
      />
    </div>
  )
}
