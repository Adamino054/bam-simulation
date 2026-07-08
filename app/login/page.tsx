'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Landmark, Eye, EyeOff, UserPlus, LogIn } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

export default function LoginPage() {
  const router = useRouter()
  const currentUser = useAuthStore(s => s.currentUser)
  const login = useAuthStore(s => s.login)
  const register = useAuthStore(s => s.register)

  const [mounted, setMounted] = useState(false)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [pseudo, setPseudo] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [shaking, setShaking] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (mounted && currentUser) {
      router.push('/choix')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, currentUser])

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-base)' }}>
        <p className="label-caps" style={{ color: 'var(--text-tertiary)' }}>Chargement…</p>
      </div>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const result = mode === 'login'
      ? login(pseudo, password)
      : register(pseudo, password)

    if (result.success) {
      router.push('/choix')
    } else {
      setError(result.error ?? 'Erreur inconnue')
      setShaking(true)
      setTimeout(() => setShaking(false), 400)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: 'var(--bg-base)', position: 'relative', overflow: 'hidden' }}
    >
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)',
          width: '900px', height: '500px',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(180,25,35,0.12) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />

      {/* Dot grid */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle, rgba(240,240,234,0.04) 1px, transparent 1px)',
          backgroundSize: '32px 32px', pointerEvents: 'none',
        }}
      />

      <motion.div
        className="relative w-full max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 mb-6"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <Landmark size={22} style={{ color: 'var(--accent-primary)' }} />
            <span className="font-editorial text-xl" style={{ color: 'var(--accent-primary)' }}>CBS</span>
          </button>
          <h1 className="font-editorial-roman text-2xl mb-2" style={{ color: 'var(--text-primary)' }}>
            {mode === 'login' ? 'Bon retour, Gouverneur.' : 'Nouveau Gouverneur'}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            {mode === 'login'
              ? 'Connectez-vous pour reprendre votre mandat.'
              : 'Créez votre profil pour commencer à gouverner.'}
          </p>
        </div>

        {/* Form card */}
        <motion.div
          className="rounded-lg p-6"
          style={{
            backgroundColor: 'var(--bg-panel)',
            border: '1px solid var(--border-default)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
          }}
          animate={shaking ? { x: [0, -6, 6, -4, 4, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          {/* Mode tabs */}
          <div
            className="flex mb-6 rounded-md p-[3px]"
            style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
          >
            {[
              { key: 'login' as const, label: 'Connexion', icon: LogIn },
              { key: 'register' as const, label: 'Inscription', icon: UserPlus },
            ].map(tab => {
              const isActive = mode === tab.key
              const Icon = tab.icon
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => { setMode(tab.key); setError('') }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded text-xs font-semibold transition-all duration-150"
                  style={{
                    backgroundColor: isActive ? 'var(--accent-primary)' : 'transparent',
                    color: isActive ? '#fff' : 'var(--text-tertiary)',
                    border: 'none', cursor: 'pointer',
                    boxShadow: isActive ? '0 1px 4px rgba(180,25,35,0.35)' : 'none',
                  }}
                >
                  <Icon size={12} />
                  {tab.label}
                </button>
              )
            })}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Pseudo */}
            <div className="flex flex-col gap-1.5">
              <label className="label-caps" htmlFor="pseudo">Pseudo</label>
              <input
                id="pseudo"
                type="text"
                value={pseudo}
                onChange={e => setPseudo(e.target.value)}
                placeholder="Ex: gouverneur_bam"
                autoComplete="username"
                className="w-full px-3 py-2.5 rounded-md text-sm transition-colors"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                }}
                onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--accent-primary)' }}
                onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border-default)' }}
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="label-caps" htmlFor="password">Mot de passe</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••"
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  className="w-full px-3 py-2.5 pr-10 rounded-md text-sm transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                  onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--accent-primary)' }}
                  onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border-default)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.p
                className="text-xs px-3 py-2 rounded"
                style={{ backgroundColor: 'rgba(194,84,80,0.1)', color: 'var(--data-negative)', border: '1px solid rgba(194,84,80,0.2)' }}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.p>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-3 rounded-md font-semibold text-sm transition-all duration-200 mt-2"
              style={{
                background: 'linear-gradient(135deg, #C41923 0%, #8B131B 100%)',
                color: '#fff', border: 'none', cursor: 'pointer',
                letterSpacing: '0.04em',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2), 0 4px 16px rgba(180,25,35,0.3)',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
            >
              {mode === 'login' ? 'Se connecter' : 'Créer mon profil'}
            </button>
          </form>
        </motion.div>

        {/* Back to landing */}
        <div className="text-center mt-6">
          <button
            onClick={() => router.push('/')}
            className="text-xs transition-colors"
            style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ← Retour à l&apos;accueil
          </button>
        </div>
      </motion.div>
    </div>
  )
}
