'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'

interface TooltipProps {
  children: ReactNode
  content: ReactNode
  className?: string
}

export function Tooltip({ children, content, className = '' }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const [pos, setPos]         = useState({ top: 0, left: 0 })
  const [mounted, setMounted] = useState(false)
  const triggerRef            = useRef<HTMLSpanElement>(null)
  const tooltipRef            = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!visible || !triggerRef.current || !tooltipRef.current) return
    const rect    = triggerRef.current.getBoundingClientRect()
    const tipRect = tooltipRef.current.getBoundingClientRect()
    const scrollY = window.scrollY
    const scrollX = window.scrollX

    let top  = rect.bottom + scrollY + 8
    let left = rect.left + scrollX + rect.width / 2 - tipRect.width / 2

    // Clamp horizontalement
    left = Math.max(12, Math.min(left, window.innerWidth - tipRect.width - 12))
    // Flip vertical si déborde en bas
    if (rect.bottom + 8 + tipRect.height > window.innerHeight) {
      top = rect.top + scrollY - tipRect.height - 8
    }

    setPos({ top, left })
  }, [visible])

  return (
    <>
      <span
        ref={triggerRef}
        className={`inline-flex items-center cursor-help ${className}`}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        tabIndex={0}
        role="button"
        aria-describedby="tooltip-content"
      >
        {children}
      </span>
      {visible && mounted && createPortal(
        <div
          ref={tooltipRef}
          id="tooltip-content"
          role="tooltip"
          className="absolute z-[9999] max-w-xs rounded p-3 text-sm leading-relaxed shadow-xl animate-fade-in"
          style={{
            top: pos.top,
            left: pos.left,
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-secondary)',
            maxWidth: '320px',
          }}
        >
          {content}
        </div>,
        document.body
      )}
    </>
  )
}

