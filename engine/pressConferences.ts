import type { EconomicState } from './state'

export interface PressConferenceOption {
  text: string
  effectsDescription: string
  apply: (state: EconomicState) => Partial<EconomicState>
}

export interface PressConferenceQuestion {
  id: string
  year: number
  reporter: string
  media: string
  question: string
  options: PressConferenceOption[]
}

export const PRESS_CONFERENCES: Record<number, PressConferenceQuestion> = {
  1: {
    id: 'year1_credibility',
    year: 1,
    reporter: 'Nadia El Fassi',
    media: "L'Économiste",
    question: "Monsieur le Gouverneur, l'inflation s'éloigne de sa cible et le public commence à douter de votre rigueur monétaire. Allez-vous resserrer agressivement vos taux directeur au prochain trimestre, ou préférez-vous temporiser pour préserver l'économie réelle ?",
    options: [
      {
        text: "Notre mandat de stabilité des prix est inconditionnel. S'il le faut, nous relèverons nos taux sans hésiter pour casser les anticipations.",
        effectsDescription: "Crédibilité +10 · Anticipations d'inflation −1.0% · Taux débiteur +0.3% (resserrement anticipé)",
        apply: (state) => ({
          centralBankCredibility: Math.min(100, state.centralBankCredibility + 10),
          inflationExpected: Math.max(0, state.inflationExpected - 1.0),
          lendingRate: state.lendingRate + 0.3
        })
      },
      {
        text: "We privilégions une approche mesurée. Une hausse brutale étoufferait l'investissement des PME marocaines.",
        effectsDescription: "Crédibilité −8 · Anticipations d'inflation +0.8% · Output gap +0.4% (relance)",
        apply: (state) => ({
          centralBankCredibility: Math.max(20, state.centralBankCredibility - 8),
          inflationExpected: state.inflationExpected + 0.8,
          outputGap: state.outputGap + 0.4
        })
      },
      {
        text: "Nous resterons pragmatiques et dépendants des données économiques trimestres après trimestres.",
        effectsDescription: "Crédibilité +2 · Aucun effet d'anticipation majeur",
        apply: (state) => ({
          centralBankCredibility: Math.min(100, state.centralBankCredibility + 2)
        })
      }
    ]
  },
  2: {
    id: 'year2_liquidity',
    year: 2,
    reporter: 'Karim Bennani',
    media: 'Médias24',
    question: "Le système bancaire fait face à des tensions de refinancement sur le marché monétaire. Certaines banques commerciales demandent une baisse massive de la réserve obligatoire pour libérer de la liquidité. Allez-vous céder à leur demande ?",
    options: [
      {
        text: "La stabilité du Dirham exige de la discipline. Nous préférons injecter de la liquidité de manière ciblée via nos opérations d'open market plutôt que de toucher aux réserves obligatoires.",
        effectsDescription: "Crédibilité +5 · Besoin de liquidité −15 mds MAD · Pas d'inflation additionnelle",
        apply: (state) => ({
          centralBankCredibility: Math.min(100, state.centralBankCredibility + 5),
          liquidityNeed: Math.max(0, state.liquidityNeed - 15)
        })
      },
      {
        text: "Nous allons assouplir le taux de réserve obligatoire pour redonner de l'air aux bilans bancaires.",
        effectsDescription: "Créances douteuses (NPL) −0.5% · Taux débiteur −0.3% · Inflation +0.6% (effet stimulant)",
        apply: (state) => ({
          nplRatio: Math.max(2.0, state.nplRatio - 0.5),
          lendingRate: Math.max(1.0, state.lendingRate - 0.3),
          inflation: state.inflation + 0.6
        })
      }
    ]
  },
  3: {
    id: 'year3_npl',
    year: 3,
    reporter: 'Sofia Alami',
    media: 'Le Matin',
    question: "Le ratio de créances en souffrance (NPL) est préoccupant, ce qui pousse les banques à restreindre le crédit aux ménages. Envisagez-vous de baisser le coussin de capital contrecyclique (CCyB) pour stimuler les prêts ?",
    options: [
      {
        text: "Oui. Nous réduisons temporairement le coussin contracyclique pour inciter les banques à prêter et éviter un Credit Crunch.",
        effectsDescription: "Croissance du crédit +2.0% · Taux débiteur −0.2% · Crédibilité macroprudentielle −5",
        apply: (state) => ({
          creditGrowth: Math.min(30, state.creditGrowth + 2.0),
          lendingRate: Math.max(1.0, state.lendingRate - 0.2),
          centralBankCredibility: Math.max(20, state.centralBankCredibility - 5)
        })
      },
      {
        text: "Absolument pas. La solidité des banques est notre priorité. Elles doivent conserver leurs coussins de fonds propres face aux risques.",
        effectsDescription: "Crédibilité macroprudentielle +8 · NPL −0.6% (sécurisation) · Croissance du crédit −1.5% (gel)",
        apply: (state) => ({
          centralBankCredibility: Math.min(100, state.centralBankCredibility + 8),
          nplRatio: Math.max(2.0, state.nplRatio - 0.6),
          creditGrowth: Math.max(-10, state.creditGrowth - 1.5)
        })
      }
    ]
  },
  4: {
    id: 'year4_forex',
    year: 4,
    reporter: 'Tarik Mansouri',
    media: 'Boursenews',
    question: "Le solde courant est en déficit persistant et les réserves de change diminuent. Certains spéculateurs parient sur une dévaluation forcée du Dirham. Comment allez-vous défendre notre monnaie ?",
    options: [
      {
        text: "Nous défendrons l'ancrage fixe du Dirham avec une fermeté absolue, en utilisant nos réserves et en ajustant nos taux d'intérêt si nécessaire.",
        effectsDescription: "Crédibilité du change +12 · Réserves de change stabilisées · Output gap −0.5% (frein d'activité)",
        apply: (state) => ({
          centralBankCredibility: Math.min(100, state.centralBankCredibility + 12),
          outputGap: Math.max(-10, state.outputGap - 0.5)
        })
      },
      {
        text: "Le moment est venu d'accélérer la transition vers un régime de change plus flexible pour laisser le marché absorber naturellement ce choc.",
        effectsDescription: "Dépréciation ordonnée de 4% · Inflation importée +1.0% · Solde courant amélioré (+0.8%)",
        apply: (state) => ({
          exchangeRate: state.exchangeRate * 0.96,
          inflation: state.inflation + 1.0,
          currentAccountBalance: Math.min(10, state.currentAccountBalance + 0.8)
        })
      }
    ]
  }
}
