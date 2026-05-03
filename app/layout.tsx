import type { Metadata } from 'next'
import { Fraunces, Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  axes: ['opsz', 'SOFT', 'WONK'],
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Central Bank Simulator — Bank Al-Maghrib',
  description:
    'Incarnez le gouverneur de Bank Al-Maghrib et pilotez l\'économie marocaine sur 5 ans. Un serious game de politique monétaire.',
  keywords: ['banque centrale', 'politique monétaire', 'Maroc', 'simulation', 'macroéconomie'],
  authors: [{ name: 'Projet de Fin d\'Année — BAM' }],
  openGraph: {
    title: 'Central Bank Simulator',
    description: 'Pilotez l\'économie marocaine. Cinq ans. Une cible : 2 % d\'inflation.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable} font-inter antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  )
}
