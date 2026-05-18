import type { Metadata } from 'next'
import { Fraunces, Inter, JetBrains_Mono } from 'next/font/google'
import 'katex/dist/katex.min.css'
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
  metadataBase: new URL('https://central-bank-simulator.vercel.app'),
  title: 'Central Bank Simulator — Banque centrale',
  description:
    "Incarnez le gouverneur de la Banque centrale et pilotez l'économie marocaine sur 5 ans. Un serious game de politique monétaire.",
  keywords: ['banque centrale', 'politique monétaire', 'Maroc', 'simulation', 'macroéconomie'],
  authors: [{ name: "Projet de Fin d'Année — Banque centrale" }],
  openGraph: {
    title: 'Central Bank Simulator',
    description: "Pilotez l'économie marocaine. Cinq ans. Une cible : 2 % d'inflation.",
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
