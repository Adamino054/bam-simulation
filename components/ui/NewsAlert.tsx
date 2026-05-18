'use client'

import { useEffect, useRef, useState } from 'react'
import { X, AlertCircle, Radio } from 'lucide-react'

export type NewsAlertSeverity = 'warning' | 'critical'

interface NewsAlertProps {
  title: string
  body: string
  onClose: () => void
  severity?: NewsAlertSeverity
  stackIndex?: number
}

const COLORS = {
  warning: {
    border:     'rgba(201, 168, 106, 0.55)',
    borderLeft: '#C9A86A',
    header:     '#C9A86A',
    title:      '#D4B86A',
    glow:       'rgba(201, 168, 106, 0.18)',
    dot:        '#FFF',
  },
  critical: {
    border:     'rgba(194, 84, 80, 0.55)',
    borderLeft: '#C25450',
    header:     '#C25450',
    title:      '#E8847E',
    glow:       'rgba(194, 84, 80, 0.22)',
    dot:        '#FFF',
  },
}

export function NewsAlert({
  title,
  body,
  onClose,
  severity = 'warning',
  stackIndex = 0,
}: NewsAlertProps) {
  const [visible, setVisible] = useState(false)
  const closedRef = useRef(false)

  const c = COLORS[severity]

  const doClose = () => {
    if (closedRef.current) return
    closedRef.current = true
    setVisible(false)
    setTimeout(onClose, 380)
  }

  useEffect(() => {
    const show  = setTimeout(() => setVisible(true), 60)
    const auto  = setTimeout(doClose, 14_000)
    return () => { clearTimeout(show); clearTimeout(auto) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <style>{`
        @keyframes bam-dot-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.25; }
        }
        @keyframes bam-ticker {
          from { background-position-x: 0; }
          to   { background-position-x: -200px; }
        }
      `}</style>

      <div
        role="alert"
        aria-live="assertive"
        style={{
          position: 'fixed',
          top: `${72 + stackIndex * 168}px`,
          right: '14px',
          zIndex: 9900 + stackIndex,
          width: '370px',
          transform: visible ? 'translateX(0) scale(1)' : 'translateX(400px) scale(0.96)',
          opacity: visible ? 1 : 0,
          transition: 'transform 0.38s cubic-bezier(0.34, 1.38, 0.64, 1), opacity 0.28s ease',
          pointerEvents: visible ? 'auto' : 'none',
        }}
      >
        <div
          style={{
            backgroundColor: '#09090D',
            border: `1px solid ${c.border}`,
            borderLeft: `4px solid ${c.borderLeft}`,
            borderRadius: '6px',
            overflow: 'hidden',
            boxShadow: `0 0 28px ${c.glow}, 0 12px 40px rgba(0,0,0,0.85)`,
          }}
        >
          {/* ── Header ticker ─────────────────────────────────── */}
          <div
            style={{
              backgroundColor: c.header,
              padding: '4px 10px 4px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
              {/* Live dot */}
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: '#fff',
                  flexShrink: 0,
                  animation: 'bam-dot-pulse 1.1s ease-in-out infinite',
                }}
              />
              <Radio size={10} style={{ color: '#fff', flexShrink: 0, opacity: 0.9 }} />
              <span
                style={{
                  fontFamily: '"Courier New", monospace',
                  fontSize: '9px',
                  fontWeight: 700,
                  letterSpacing: '2.5px',
                  color: '#fff',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                FLASH INFO — BANQUE CENTRALE
              </span>
            </div>

            <button
              type="button"
              onClick={doClose}
              aria-label="Fermer l'alerte"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'rgba(255,255,255,0.75)',
                padding: '2px',
                display: 'flex',
                flexShrink: 0,
                borderRadius: '3px',
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = '#fff')}
              onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.75)')}
            >
              <X size={13} />
            </button>
          </div>

          {/* ── Body ──────────────────────────────────────────── */}
          <div style={{ padding: '14px 14px 12px' }}>
            <h3
              style={{
                fontFamily: '"Courier New", monospace',
                fontSize: '11.5px',
                fontWeight: 700,
                color: c.title,
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                lineHeight: '1.3',
              }}
            >
              {title}
            </h3>
            <p
              style={{
                fontFamily: '"Courier New", monospace',
                fontSize: '10.5px',
                color: '#B4B5B6',
                lineHeight: '1.65',
              }}
            >
              {body}
            </p>
          </div>

          {/* ── Footer ────────────────────────────────────────── */}
          <div
            style={{
              borderTop: '1px solid rgba(255,255,255,0.06)',
              padding: '5px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <AlertCircle size={9} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
            <span
              style={{
                fontSize: '8.5px',
                fontFamily: '"Courier New", monospace',
                color: 'rgba(255,255,255,0.25)',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}
            >
              Impact macroéconomique permanent — Ajustez votre stratégie
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
