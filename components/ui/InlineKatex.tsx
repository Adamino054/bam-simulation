'use client'

import { InlineMath } from 'react-katex'

interface InlineKatexProps {
  children: string
}

export function InlineKatex({ children }: InlineKatexProps) {
  return (
    <span
      className="font-mono inline-block py-1"
      style={{ color: 'var(--accent-cool)', fontSize: '0.8em' }}
    >
      <InlineMath math={children} />
    </span>
  )
}
