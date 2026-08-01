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
    question: "Monsieur le Gouverneur, après cette première année de décisions monétaires, comment souhaitez-vous orienter votre communication pour maintenir la confiance du public et l'ancrage des anticipations autour de la cible ?",
    options: [
      {
        text: "Notre mandat de stabilité des prix reste inconditionnel. Si des pressions apparaissent, nous agirons sans hésiter pour préserver l'ancrage des anticipations.",
        effectsDescription: "Crédibilité +10 · Signal anti-inflation fort",
        apply: (state) => ({
          centralBankCredibility: Math.min(100, state.centralBankCredibility + 10),
        })
      },
      {
        text: "Nous privilégions une approche mesurée. La stabilité des prix doit rester compatible avec une lecture attentive de l'économie réelle.",
        effectsDescription: "Crédibilité −8 · Signal perçu comme moins ferme",
        apply: (state) => ({
          centralBankCredibility: Math.max(20, state.centralBankCredibility - 8),
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
    question: "Le marché monétaire reste au centre de l'attention des banques et des entreprises. Quelle ligne de communication souhaitez-vous adopter sur la gestion de la liquidité et des réserves obligatoires ?",
    options: [
      {
        text: "La stabilité monétaire exige de la discipline. Nous privilégierons des interventions ciblées et lisibles plutôt que des annonces trop brusques sur les réserves.",
        effectsDescription: "Crédibilité +5 · Communication disciplinée sur la liquidité",
        apply: (state) => ({
          centralBankCredibility: Math.min(100, state.centralBankCredibility + 5),
        })
      },
      {
        text: "Nous restons ouverts à une orientation plus accommodante si les conditions de financement l'exigent, sans perdre de vue notre mandat de stabilité.",
        effectsDescription: "Crédibilité −4 · Signal perçu comme accommodant",
        apply: (state) => ({
          centralBankCredibility: Math.max(20, state.centralBankCredibility - 4),
        })
      }
    ]
  },
  3: {
    id: 'year3_npl',
    year: 3,
    reporter: 'Sofia Alami',
    media: 'Le Matin',
    question: "Les observateurs suivent de près la qualité du crédit et la solidité bancaire. Quel message souhaitez-vous envoyer sur l'équilibre entre soutien au crédit et prudence macroprudentielle ?",
    options: [
      {
        text: "Nous voulons préserver le financement de l'économie. Les outils macroprudentiels doivent rester suffisamment souples pour éviter un blocage du crédit.",
        effectsDescription: "Crédibilité −5 · Signal de tolérance au risque bancaire",
        apply: (state) => ({
          centralBankCredibility: Math.max(20, state.centralBankCredibility - 5)
        })
      },
      {
        text: "La solidité des banques demeure prioritaire. Des coussins prudents renforcent la confiance et protègent l'économie en cas de choc.",
        effectsDescription: "Crédibilité +8 · Signal de prudence macroprudentielle",
        apply: (state) => ({
          centralBankCredibility: Math.min(100, state.centralBankCredibility + 8),
        })
      }
    ]
  },
  4: {
    id: 'year4_forex',
    year: 4,
    reporter: 'Tarik Mansouri',
    media: 'Boursenews',
    question: "Dans un environnement externe incertain, les marchés surveillent le change, les réserves et le solde courant. Quelle orientation souhaitez-vous donner à votre communication sur la stabilité extérieure ?",
    options: [
      {
        text: "Nous réaffirmons notre engagement pour une stabilité extérieure ordonnée, avec une communication ferme et prévisible envers les marchés.",
        effectsDescription: "Crédibilité +12 · Signal ferme de stabilité externe",
        apply: (state) => ({
          centralBankCredibility: Math.min(100, state.centralBankCredibility + 12),
        })
      },
      {
        text: "Nous assumons une communication plus flexible : l'économie doit pouvoir absorber les chocs externes progressivement, sans signal de panique.",
        effectsDescription: "Crédibilité −6 · Signal de flexibilité plus risqué",
        apply: (state) => ({
          centralBankCredibility: Math.max(20, state.centralBankCredibility - 6),
        })
      }
    ]
  }
}
