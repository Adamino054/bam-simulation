'use client'

import { InlineMath } from 'react-katex'
import 'katex/dist/katex.min.css'
import type { ReactNode } from 'react'

interface InlineKatexProps {
  children: string
}

export function InlineKatex({ children }: InlineKatexProps) {
  return (
    <span className="font-mono text-xs" style={{ color: 'var(--accent-cool)' }}>
      <InlineMath math={children} />
    </span>
  )
}
