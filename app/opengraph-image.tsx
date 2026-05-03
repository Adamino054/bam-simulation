import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Central Bank Simulator — Bank Al-Maghrib'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0E0F12',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px',
        }}
      >
        <div style={{ color: '#B41923', fontSize: 14, letterSpacing: '0.1em', marginBottom: 32, textTransform: 'uppercase' }}>
          Central Bank Simulator
        </div>
        <div style={{ color: '#F2F2EC', fontSize: 72, fontWeight: 400, lineHeight: 1.0, textAlign: 'center', marginBottom: 24 }}>
          Vous êtes le gouverneur.
        </div>
        <div style={{ color: '#9FA0A0', fontSize: 24, textAlign: 'center', maxWidth: 700 }}>
          Cinq ans pour piloter l'économie marocaine.
          Quatre instruments. Une cible : 2 % d'inflation.
        </div>
        <div style={{ position: 'absolute', bottom: 40, color: '#66686D', fontSize: 14, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Bank Al-Maghrib · Projet de Fin d'Année
        </div>
      </div>
    ),
    { ...size },
  )
}
