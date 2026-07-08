'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Landmark, LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useDiscoveryProfile } from '@/store/discoveryStore'
import { getLevelProgress } from '@/engine/discovery'
import { ThemeToggle } from '@/components/shell/ThemeToggle'

interface DiscoveryHeaderProps {
  /** Lien du bouton retour (par défaut : le hub Découverte) */
  backHref?: string
  backLabel?: string
}

/**
 * Barre de navigation commune du Mode Découverte :
 * retour, niveau + barre d'XP animée, accès au mode expert, thème, déconnexion.
 */
export function DiscoveryHeader({ backHref = '/decouverte', backLabel = 'Retour' }: DiscoveryHeaderProps) {
  const router = useRouter()
  const logout = useAuthStore(s => s.logout)
  const profile = useDiscoveryProfile()
  const progress = getLevelProgress(profile.xp)

  return (
    <nav
      className="sticky top-0 z-40 flex items-center justify-between gap-3 px-4 sm:px-6"
      style={{
        height: '56px',
        borderBottom: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-overlay)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Gauche : retour + logo */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => router.push(backHref)}
          className="flex items-center gap-1.5 label-caps transition-colors shrink-0"
          style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '10px' }}
        >
          <ArrowLeft size={13} />
          <span className="hidden sm:inline">{backLabel}</span>
        </button>
        <span style={{ color: 'var(--border-default)' }}>·</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <Landmark size={15} style={{ color: 'var(--accent-primary)' }} />
          <span className="font-editorial text-sm" style={{ color: 'var(--accent-primary)' }}>CBS</span>
          <span
            className="label-badge"
            style={{ backgroundColor: 'rgba(201,168,106,0.14)', color: 'var(--accent-warm)', fontSize: '8px' }}
          >
            Découverte
          </span>
        </div>
      </div>

      {/* Centre : niveau + XP */}
      <div className="flex items-center gap-2.5 flex-1 max-w-[300px]">
        <span className="text-lg shrink-0" title={`Niveau ${progress.current.level}`}>
          {progress.current.emoji}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between mb-0.5 gap-2">
            <span className="text-[10px] font-bold truncate" style={{ color: 'var(--text-primary)' }}>
              {progress.current.title}
            </span>
            <span className="font-mono text-[9px] tabular shrink-0" style={{ color: 'var(--text-tertiary)' }}>
              {profile.xp} XP{progress.next ? ` / ${progress.next.minXp}` : ' · MAX'}
            </span>
          </div>
          <div className="progress-bar" style={{ height: '5px' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #C9A86A 0%, #B41923 100%)' }}
              initial={{ width: 0 }}
              animate={{ width: `${progress.progressPct}%` }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>
      </div>

      {/* Droite : mode expert, thème, déconnexion */}
      <div className="flex items-center gap-3 shrink-0">
        <a
          href="/dashboard"
          className="label-caps hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-md transition-colors"
          style={{
            color: 'var(--accent-cool)', textDecoration: 'none', fontSize: '9px',
            border: '1px solid var(--border-default)', backgroundColor: 'var(--bg-panel)',
          }}
        >
          🏛️ Mode expert
        </a>
        <ThemeToggle />
        <button
          onClick={() => { logout(); router.push('/') }}
          className="flex items-center gap-1 label-caps transition-colors"
          style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '9px' }}
          title="Déconnexion"
        >
          <LogOut size={12} />
        </button>
      </div>
    </nav>
  )
}
