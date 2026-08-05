'use client'

import React from 'react'

interface CertificateProps {
  playerName: string
  score: number
  grade: string
  scenarioName: string
  difficulty: string
  avgInflation: number
  avgGrowth: number
}

export function GovernorCertificate({
  playerName,
  score,
  grade,
  scenarioName,
  difficulty,
  avgInflation,
  avgGrowth,
}: CertificateProps) {
  const dateStr = new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const handlePrint = () => {
    const certificate = document.getElementById('print-certificate-area')
    if (!certificate) {
      window.print()
      return
    }

    const printWindow = window.open('', '_blank', 'width=1200,height=900')
    if (!printWindow) {
      window.print()
      return
    }

    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(node => node.outerHTML)
      .join('\n')

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Certificat CBS</title>
          ${styles}
          <style>
            @page { size: A4 landscape; margin: 0; }
            html, body {
              width: 297mm;
              height: 210mm;
              margin: 0;
              padding: 0;
              overflow: hidden;
              background: #fff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            body {
              display: flex;
              align-items: center;
              justify-content: center;
            }
            #print-certificate-area {
              width: 297mm !important;
              height: 210mm !important;
              margin: 0 !important;
              box-shadow: none !important;
              border-radius: 0 !important;
              transform: none !important;
            }
          </style>
        </head>
        <body>${certificate.outerHTML}</body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    window.setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 300)
  }

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      {/* ── CSS print dédié pour masquer tout le reste de la page lors de l'impression ── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #print-certificate-area, #print-certificate-area * {
            visibility: visible;
          }
          #print-certificate-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 297mm;
            height: 210mm;
            margin: 0;
            padding: 0;
            box-shadow: none;
            background-color: #fff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
        }
      ` }} />

      {/* ── Conteneur du Certificat (A4 Paysage proportionnel) ── */}
      <div
        id="print-certificate-area"
        className="relative shadow-2xl rounded-lg overflow-hidden transition-all duration-300 select-none bg-white border border-[#C9A86A]"
        style={{
          width: '840px',
          height: '594px',
          fontFamily: 'serif',
          background: 'radial-gradient(circle, #fcfbf7 0%, #f6f3e6 100%)',
          boxShadow: '0 20px 50px rgba(180, 25, 35, 0.15)',
        }}
      >
        {/* Bordure extérieure élégante dorée */}
        <div className="absolute inset-4 border border-[#C9A86A]/40" />
        <div className="absolute inset-5 border-2 border-[#C9A86A]" />
        <div className="absolute inset-7 border border-[#C9A86A]/30" />

        {/* Coins d'angle ornementaux */}
        <div className="absolute top-8 left-8 w-12 h-12 border-t-2 border-l-2 border-[#B41923]" />
        <div className="absolute top-8 right-8 w-12 h-12 border-t-2 border-r-2 border-[#B41923]" />
        <div className="absolute bottom-8 left-8 w-12 h-12 border-b-2 border-l-2 border-[#B41923]" />
        <div className="absolute bottom-8 right-8 w-12 h-12 border-b-2 border-r-2 border-[#B41923]" />

        {/* Filigrane d'armoiries de la banque centrale en arrière-plan */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5"
          style={{ zIndex: 0 }}
        >
          <svg width="340" height="340" viewBox="0 0 100 100" fill="var(--accent-primary, #B41923)">
            <path d="M50,10 L80,35 L80,75 L50,95 L20,75 L20,35 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="50" cy="53" r="22" fill="none" stroke="currentColor" strokeWidth="1" />
            <path d="M35,53 L65,53 M50,38 L50,68" stroke="currentColor" strokeWidth="1" />
            <text x="50" y="55" fontSize="5" textAnchor="middle" fontFamily="sans-serif" letterSpacing="1">CBS</text>
          </svg>
        </div>

        {/* Contenu textuel */}
        <div className="absolute inset-0 flex flex-col justify-between p-12 text-center" style={{ zIndex: 10 }}>
          {/* Header */}
          <div className="space-y-1">
            <p
              className="text-xs uppercase font-sans tracking-widest text-[#5C7E92] font-semibold"
              style={{ letterSpacing: '0.2em' }}
            >
              Royaume du Maroc · Centrale Bank Simulateur
            </p>
            <div className="flex items-center justify-center gap-3">
              <span className="h-[1px] w-12 bg-[#C9A86A]" />
              <span className="text-sm font-semibold tracking-wider text-[#B41923]">BOARD OF GOVERNORS</span>
              <span className="h-[1px] w-12 bg-[#C9A86A]" />
            </div>
          </div>

          {/* Corps principal */}
          <div className="my-auto space-y-4">
            <h2
              className="text-[#C9A86A]"
              style={{
                fontFamily: 'Georgia, serif',
                fontSize: '2.8rem',
                fontWeight: 'normal',
                letterSpacing: '0.02em',
                lineHeight: 1,
                textShadow: '1px 1px 0px rgba(255,255,255,0.8)',
              }}
            >
              Certificat de Réussite
            </h2>
            <p className="text-xs italic font-sans text-[#5C7E92]">
              Le Conseil d&apos;Administration du Central Bank Simulator décerne ce diplôme à
            </p>

            {/* Nom du Joueur */}
            <div className="space-y-1">
              <h3
                className="font-editorial text-[#B41923] underline decoration-[#C9A86A]/40 decoration-1 underline-offset-8"
                style={{ fontSize: '2.4rem', fontWeight: 'bold' }}
              >
                {playerName.toUpperCase()}
              </h3>
              <p className="text-[10px] font-sans tracking-wide text-[#777] pt-2">
                pour sa gestion rigoureuse et sa politique monétaire exemplaire.
              </p>
            </div>

            {/* Description des exploits */}
            <div className="max-w-md mx-auto py-1">
              <p className="text-xs leading-relaxed text-[#444] font-sans">
                Durant le mandat du scénario <strong className="text-[#B41923]">{scenarioName}</strong> en difficulté <span className="font-semibold uppercase tracking-wider text-[#5C7E92] text-[10px]">{difficulty}</span>, le Gouverneur a stabilisé l&apos;inflation moyenne à <strong className="text-[#444]">{avgInflation.toFixed(2)} %</strong> avec une croissance de <strong className="text-[#444]">{avgGrowth.toFixed(2)} %</strong>, obtenant l&apos;excellente note globale de :
              </p>
            </div>

            {/* Le Badge Grade doré */}
            <div className="flex items-center justify-center gap-4">
              <div
                className="w-14 h-14 rounded-full border-2 border-[#C9A86A] flex items-center justify-center bg-[#B41923] text-white font-editorial shadow-lg"
                style={{ fontSize: '1.8rem', fontWeight: 'bold' }}
              >
                {grade}
              </div>
              <div className="text-left font-sans">
                <p className="text-[10px] uppercase font-bold tracking-wider text-[#C9A86A] m-0">Score de Mandat</p>
                <p className="text-sm font-semibold text-[#444] m-0">{score} points sur 100</p>
              </div>
            </div>
          </div>

          {/* Footer et Signatures */}
          <div className="flex items-end justify-between px-6 pt-4">
            {/* Date */}
            <div className="text-left font-sans text-[10px] text-[#777] w-1/3">
              <p className="border-b border-[#C9A86A]/40 pb-1 m-0">Fait à Rabat, le</p>
              <p className="pt-1 m-0 font-medium">{dateStr}</p>
            </div>

            {/* Sceau doré au milieu */}
            <div className="flex justify-center w-1/3">
              <div className="w-12 h-12 rounded-full border border-[#C9A86A]/50 p-[2px] flex items-center justify-center bg-[#fcfbf7] shadow-inner">
                <div className="w-full h-full rounded-full border-2 border-double border-[#C9A86A] flex items-center justify-center bg-[#C9A86A]/10">
                  <span className="text-[8px] font-sans font-bold text-[#C9A86A]">OFFICIEL</span>
                </div>
              </div>
            </div>

            {/* Signatures */}
            <div className="text-right font-sans text-[10px] text-[#777] w-1/3 flex flex-col items-end">
              <p className="border-b border-[#C9A86A]/40 pb-1 w-32 m-0 text-center">L'Assistant CBS de Contrôle</p>
              <p className="pt-1 m-0 font-mono italic text-[#B41923] text-[9px] w-32 text-center">
                🤖 signature_numérique_054
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Boutons d'Action (non visibles à l'impression) ── */}
      <div className="flex items-center gap-3 no-print">
        <button
          onClick={handlePrint}
          className="px-6 py-3 rounded-lg font-semibold text-sm flex items-center gap-2 shadow-lg transition-all"
          style={{
            background: 'linear-gradient(135deg, #C9A86A 0%, #A28144 100%)',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
          }}
          onMouseEnter={e => {
            ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
            ;(e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(201,168,106,0.45)'
          }}
          onMouseLeave={e => {
            ;(e.currentTarget as HTMLElement).style.transform = ''
            ;(e.currentTarget as HTMLElement).style.boxShadow = '0 10px 30px rgba(180, 25, 35, 0.15)'
          }}
        >
          🖨 Imprimer le diplôme (PDF / Papier)
        </button>
      </div>
    </div>
  )
}
