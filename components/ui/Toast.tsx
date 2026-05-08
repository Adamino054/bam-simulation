'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastMessage {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
}

interface ToastItemProps extends ToastMessage {
  onRemove: (id: string) => void
}

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const STYLES = {
  success: 'border-data-positive/20 bg-data-positive/5 text-data-positive',
  error: 'border-data-negative/20 bg-data-negative/5 text-data-negative',
  warning: 'border-data-warning/20 bg-data-warning/5 text-data-warning',
  info: 'border-data-info/20 bg-data-info/5 text-data-info',
}

export function ToastItem({ id, type, title, description, onRemove }: ToastItemProps) {
  const Icon = ICONS[type]

  useEffect(() => {
    const timer = setTimeout(() => onRemove(id), 4000)
    return () => clearTimeout(timer)
  }, [id, onRemove])

  return (
    <motion.div
      initial={{ opacity: 0, x: 40, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`flex items-start gap-3 px-4 py-3 rounded-md border shadow-lg backdrop-blur-sm ${STYLES[type]}`}
      style={{ backgroundColor: 'var(--bg-elevated)' }}
      role="alert"
    >
      <Icon size={18} className="mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {title}
        </p>
        {description && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {description}
          </p>
        )}
      </div>
      <button
        onClick={() => onRemove(id)}
        className="flex-shrink-0 mt-0.5 p-0.5 rounded hover:bg-white/10 transition-colors"
        aria-label="Fermer"
      >
        <X size={14} style={{ color: 'var(--text-tertiary)' }} />
      </button>
    </motion.div>
  )
}

interface ToastContainerProps {
  toasts: ToastMessage[]
  onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-[1080] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem {...toast} onRemove={onRemove} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}