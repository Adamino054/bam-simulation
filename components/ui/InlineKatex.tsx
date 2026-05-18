'use client'

import { InlineMath, BlockMath } from 'react-katex'

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

export function BlockKatex({ math, color }: { math: string; color?: string }) {
  return (
    <div
      className="overflow-x-auto py-3 px-4 rounded"
      style={{
        backgroundColor: 'var(--bg-base)',
        color: color ?? 'var(--text-primary)',
        fontSize: '1.05rem',
        lineHeight: 1.8,
      }}
    >
      <BlockMath math={math} />
    </div>
  )
}
