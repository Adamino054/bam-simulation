'use client'

import { InlineMath, BlockMath } from 'react-katex'

interface InlineKatexProps {
  children: string
}

export function InlineKatex({ children }: InlineKatexProps) {
  return (
    <span
      className="inline-block px-0.5"
      style={{
        color: 'var(--accent-cool)',
        fontFamily: 'monospace',
      }}
    >
      <InlineMath math={children} />
    </span>
  )
}

export function BlockKatex({ math, color }: { math: string; color?: string }) {
  return (
    <div
      className="overflow-x-auto py-3 px-4 rounded animate-fade-in"
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

export function LatexText({ text }: { text: string }) {
  if (!text) return null
  // Regex to match $...$
  const parts = text.split(/(\$[^\$]+\$)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('$') && part.endsWith('$')) {
          const math = part.slice(1, -1)
          return <InlineKatex key={i}>{math}</InlineKatex>
        }
        return <span key={i}>{part}</span>
      })}
    </>
  )
}

export function MarkdownText({ text }: { text: string }) {
  if (!text) return null

  // Split by line breaks to handle lists vs paragraphs
  const lines = text.split('\n')

  return (
    <div className="space-y-1.5 text-left">
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim()
        if (!trimmed) return null

        // Check if list item
        const isBullet = trimmed.startsWith('* ') || trimmed.startsWith('- ')
        const content = isBullet ? trimmed.substring(2).trim() : trimmed

        const parsedContent = parseInlineStyles(content)

        if (isBullet) {
          return (
            <li key={lineIdx} className="list-disc ml-4 pl-1" style={{ color: 'var(--text-secondary)' }}>
              {parsedContent}
            </li>
          )
        }

        return (
          <p key={lineIdx} className="m-0" style={{ color: 'var(--text-secondary)' }}>
            {parsedContent}
          </p>
        )
      })}
    </div>
  )
}

function parseInlineStyles(text: string): React.ReactNode[] {
  if (!text) return []

  // Match: $math$, **bold**, ++highlight++
  const parts = text.split(/(\$[^\$]+\$|\*\*[^\*]+\*\*|\+\+[^\+]+\+\+)/g)

  return parts.map((part, i) => {
    if (part.startsWith('$') && part.endsWith('$')) {
      const math = part.slice(1, -1)
      return <InlineKatex key={i}>{math}</InlineKatex>
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2)
      return <strong key={i} className="font-bold text-[var(--text-primary)]" style={{ color: 'var(--text-primary)' }}>{parseInlineStyles(boldText)}</strong>
    }
    if (part.startsWith('++') && part.endsWith('++')) {
      const highlightText = part.slice(2, -2)
      return (
        <mark
          key={i}
          style={{
            backgroundColor: 'rgba(201, 168, 106, 0.18)',
            color: 'var(--accent-warm)',
            padding: '1px 4px',
            borderRadius: '3px',
            textDecoration: 'none',
            fontWeight: 600
          }}
        >
          {parseInlineStyles(highlightText)}
        </mark>
      )
    }
    return <span key={i}>{part}</span>
  })
}

