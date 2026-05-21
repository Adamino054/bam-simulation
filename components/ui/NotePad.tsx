'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Save, Check, RefreshCw } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

interface NotePadProps {
  moduleId: string
  moduleColor: string
}

export function NotePad({ moduleId, moduleColor }: NotePadProps) {
  const getNote = useAuthStore(s => s.getNote)
  const setNote = useAuthStore(s => s.setNote)
  const [text, setText] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [savedRecently, setSavedRecently] = useState(false)

  // Load note from store when module changes
  useEffect(() => {
    setText(getNote(moduleId))
    setSavedRecently(false)
  }, [moduleId, getNote])

  const handleSave = () => {
    setIsSaving(true)
    setTimeout(() => {
      setNote(moduleId, text)
      setIsSaving(false)
      setSavedRecently(true)
      setTimeout(() => setSavedRecently(false), 2000)
    }, 600)
  }

  const isChanged = text !== getNote(moduleId)

  return (
    <div
      className="rounded-lg p-5 flex flex-col gap-3"
      style={{
        backgroundColor: 'var(--bg-elevated)',
        border: '1px solid var(--border-default)',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={14} style={{ color: moduleColor }} />
          <span className="label-caps" style={{ color: moduleColor, fontSize: '10px' }}>
            Mes Notes Personnelles
          </span>
        </div>
        <AnimatePresence mode="wait">
          {savedRecently ? (
            <motion.span
              key="saved"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="text-[10px] font-semibold flex items-center gap-1 text-[#4A9D7C]"
            >
              <Check size={10} /> Enregistré !
            </motion.span>
          ) : isChanged ? (
            <motion.span
              key="unsaved"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="text-[10px] font-semibold text-amber-500"
            >
              Modifications non enregistrées
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Prenez des notes sur ce cours, vos stratégies pour le simulateur ou des formules importantes à retenir..."
        className="w-full text-xs font-sans rounded-md p-3 transition-all duration-200"
        rows={6}
        style={{
          backgroundColor: 'var(--bg-panel)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-primary)',
          resize: 'vertical',
          outline: 'none',
        }}
        onFocus={e => (e.currentTarget.style.borderColor = moduleColor)}
        onBlur={e => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
      />

      <div className="flex justify-end">
        <button
          type="button"
          disabled={!isChanged || isSaving}
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold transition-all duration-200"
          style={{
            backgroundColor: isChanged ? moduleColor : 'var(--bg-panel)',
            color: isChanged ? '#fff' : 'var(--text-tertiary)',
            border: `1px solid ${isChanged ? 'transparent' : 'var(--border-subtle)'}`,
            cursor: isChanged ? 'pointer' : 'not-allowed',
            opacity: isChanged ? 1 : 0.6,
          }}
        >
          {isSaving ? (
            <>
              <RefreshCw size={12} className="animate-spin" /> Enregistrement...
            </>
          ) : (
            <>
              <Save size={12} /> Sauvegarder
            </>
          )}
        </button>
      </div>
    </div>
  )
}
