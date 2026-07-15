/**
 * Scénarios de départ prédéfinis.
 * Chaque scénario modifie l'état initial et peut injecter des chocs de départ.
 */

import type { EconomicState, ScenarioId, Shock } from './state'
import type { DifficultyLevel } from './difficulty'
import { INITIAL_STATE } from './parameters'
import { HISTORICAL_OUTPUT_GAPS } from './historicalMacro'

export interface Scenario {
  id: ScenarioId
  title: string
  subtitle: string
  description: string
  descriptionByLevel: Record<DifficultyLevel, string>
  hintsByLevel: Record<DifficultyLevel, string[]>
  difficulty: 'normal' | 'hard' | 'crisis'
  initialState: EconomicState
  initialShocks: Shock[]
  /** Key starting KPI displayed on scenario card */
  keyKpi?: string
}

export const SCENARIOS: Record<ScenarioId, Scenario> = {
  standard: {
    id: 'standard',
    title: 'Scénario standard',
    subtitle: 'Situation de départ normale',
    description:
      'L\'économie marocaine démarre avec les derniers indicateurs observés : inflation basse, croissance soutenue et output gap positif. Des chocs aléatoires surviendront au fil des trimestres.',
    descriptionByLevel: {
      beginner: "L'économie va bien ! L'inflation est à 0,7% et la croissance à 4,6%. Votre mission : garder l'inflation stable malgré les chocs qui surviendront. Conseil : ne changez les taux que par petits pas de 0,25%.",
      intermediate: "Situation de départ 2025 — inflation à 0,7%, croissance à 4,6%. Des chocs aléatoires testeront votre capacité d'anticipation. Surveillez l'output gap et l'inflation core.",
      expert: "État d'équilibre initial. Anticipez les chocs stochastiques via les indicateurs avancés. Gérez proactivement le trade-off inflation/croissance sans assistance.",
    },
    hintsByLevel: {
      beginner: ['Le taux directeur est votre outil principal', 'Montez le taux quand l\'inflation dépasse 3%', 'Baissez le taux quand l\'inflation descend sous 1,5%'],
      intermediate: ['Utilisez le forward guidance pour ancrer les anticipations', 'Surveillez l\'inflation core vs l\'inflation headline'],
      expert: [],
    },
    difficulty: 'normal',
    initialState: { ...INITIAL_STATE },
    initialShocks: [],
    keyKpi: 'Inflation 0,7 %',
  },

  inflation2022: {
    id: 'inflation2022',
    title: 'Choc inflationniste 2022',
    subtitle: 'Inflation à 6 %, chocs énergétiques',
    description:
      'Contexte inspiré de 2022 : l\'inflation a bondi à 6 % sous l\'effet des prix énergétiques mondiaux et des tensions sur les chaînes d\'approvisionnement. Votre mandat prioritaire est de ramener l\'inflation vers 2 % sans casser la croissance.',
    descriptionByLevel: {
      beginner: "L'inflation est très élevée (6%) ! Les prix du pétrole ont explosé. Votre mission : baisser l'inflation vers 2% en augmentant progressivement le taux directeur. Conseil : montez de 0,25% à 0,50% chaque trimestre et soyez patient.",
      intermediate: "Inflation à 6,7% causée par le choc pétrolier et les tensions d'approvisionnement. Utilisez le taux directeur ET le forward guidance pour ancrer les anticipations. Le délai de transmission est de 2-3 trimestres — anticipez !",
      expert: "Choc inflationniste 2022 avec pass-through pétrolier et désancrage potentiel des anticipations. Gérez le trilemme inflation/croissance/stabilité financière sans indications. Le choc d'offre complique la réponse optimale.",
    },
    hintsByLevel: {
      beginner: ['Augmentez le taux directeur progressivement', 'Ne paniquez pas — les effets prennent 2-3 trimestres', 'La croissance va baisser un peu, c\'est normal'],
      intermediate: ['Surveillez l\'inflation core pour distinguer le choc temporaire de la tendance', 'Un signal hawkish aide à ancrer les anticipations'],
      expert: [],
    },
    difficulty: 'hard',
    initialState: {
      ...INITIAL_STATE,
      date: { year: 2022, q: 4 },
      inflation: 6.65704202759067,
      inflationCore: 4.8,
      inflationExpected: 4.5,
      gdpGrowth: 1.81269242194809,
      outputGap: HISTORICAL_OUTPUT_GAPS.morocco2022,
      unemployment: 9.413,
      policyRate: 2.50,
      interbankRate: 2.50,
      lendingRate: 5.25,
      reserveRequirement: 0.0,
      nplRatio: 8.68360679573923,
      centralBankCredibility: 70,
      currentAccountBalance: -3.6574911910038,
      fiscalStance: 'neutral',
    },
    initialShocks: [
      {
        id: 'oil_q0',
        label: 'Choc pétrolier',
        type: 'supply',
        magnitude: 0.85,
        remainingQuarters: 3,
        description: 'Forte hausse des prix mondiaux du pétrole consécutive aux tensions géopolitiques.',
        inflationImpact: 2.2,
        outputGapImpact: -0.5,
        lendingRateImpact: 0,
        externalDemandImpact: 0,
      },
    ],
    keyKpi: 'Inflation 6,7 % ⚠',
  },

  covid2020: {
    id: 'covid2020',
    title: 'Choc COVID-2020',
    subtitle: 'Choc de demande sévère, output gap −4 %',
    description:
      'Contexte inspiré du T2 2020 : l\'économie mondiale a subi un choc de demande sans précédent. L\'output gap marocain estimé s\'est effondré à −6,8 %. Votre mission est de soutenir la reprise tout en évitant une spirale déflationniste et une fragilisation du système financier.',
    descriptionByLevel: {
      beginner: "C'est la crise ! Le PIB s'est effondré de -7,2% à cause du COVID. Les gens ne dépensent plus. Votre mission : baisser les taux pour relancer l'économie, sans que l'inflation ne tombe à 0%.",
      intermediate: "Choc de demande COVID — output gap à -6,8%, risque déflationniste. Assouplissez la politique monétaire (taux + opérations de marché). Surveillez les NPL qui risquent de monter avec les défauts de paiement.",
      expert: "Choc de demande sans précédent avec effondrement de l'output gap et risque de piège de dette-déflation. Gérez simultanément la relance, la stabilité financière (NPL) et le risque de spirale déflationniste à la ZLB.",
    },
    hintsByLevel: {
      beginner: ['Baissez le taux directeur pour relancer le crédit', 'Injectez de la liquidité via les opérations de marché', 'Surveillez que l\'inflation ne tombe pas sous 0%'],
      intermediate: ['Activez l\'intervention de change si le dirham se déprécie', 'Les NPL vont monter — surveillez le canal du crédit'],
      expert: [],
    },
    difficulty: 'crisis',
    initialState: {
      ...INITIAL_STATE,
      date: { year: 2020, q: 2 },
      inflation: 0.705968661338261,
      inflationCore: 0.5,
      inflationExpected: 0.8,
      gdpGrowth: -7.17820744246774,
      outputGap: HISTORICAL_OUTPUT_GAPS.morocco2020,
      unemployment: 11.189,
      policyRate: 1.50,
      interbankRate: 1.50,
      lendingRate: 4.20,
      reserveRequirement: 0.0,
      creditGrowth: 1.5,
      liquidityNeed: 110.0,
      nplRatio: 8.79376526247322,
      centralBankCredibility: 70,
      currentAccountBalance: -1.1275993199651,
      fiscalStance: 'expansionary',
    },
    initialShocks: [
      {
        id: 'external_demand_q0',
        label: 'Récession zone euro',
        type: 'external',
        magnitude: 0.90,
        remainingQuarters: 5,
        description: 'Récession profonde en Europe, premier partenaire commercial du Maroc.',
        inflationImpact: -0.6,
        outputGapImpact: 0,
        lendingRateImpact: 0,
        externalDemandImpact: -1.8,
      },
    ],
    keyKpi: 'PIB −7,2 % ⚠',
  },

  flexibilite: {
    id: 'flexibilite',
    title: 'Flexibilité du dirham',
    subtitle: 'Transition vers le change flexible',
    description:
      'Le Maroc engage la transition vers un régime de change flexible. Le taux de change devient volatile (±2 % par trimestre), le pass-through s\'amplifie. Vous devez gérer la volatilité tout en maintenant la stabilité des prix et la confiance des marchés.',
    descriptionByLevel: {
      beginner: "Le Maroc change de système monétaire ! Le dirham va devenir plus volatil. Les prix des importations vont fluctuer. Votre mission : garder l'inflation stable malgré les mouvements du taux de change.",
      intermediate: "Transition vers le change flexible — la volatilité du dirham amplifiée le pass-through. Utilisez l'intervention FX pour lisser les fluctuations et le forward guidance pour ancrer les anticipations face à l'incertitude.",
      expert: "Régime de change flexible avec pass-through amplifié (α augmenté). Gérez la trilogie impossible : stabilité des prix, stabilité du change, libre circulation des capitaux. La crédibilité est votre meilleur ancrage.",
    },
    hintsByLevel: {
      beginner: ['Le taux de change va bouger — c\'est normal', 'Si le dirham baisse trop, les imports coûtent plus cher → inflation', 'Gardez le taux directeur comme ancre de stabilité'],
      intermediate: ['L\'intervention FX est cruciale ici', 'Surveillez le pass-through change → inflation via α'],
      expert: [],
    },
    difficulty: 'hard',
    initialState: {
      ...INITIAL_STATE,
      date: { year: 2018, q: 1 },
      inflation: 1.80391671141896,
      inflationCore: 2.8,
      inflationExpected: 3.0,
      gdpGrowth: 3.06564133025955,
      outputGap: HISTORICAL_OUTPUT_GAPS.morocco2018,
      unemployment: 9.272,
      policyRate: 2.25,
      interbankRate: 2.25,
      lendingRate: 4.75,
      reserveRequirement: 4.0,
      nplRatio: 7.72518485920519,
      centralBankCredibility: 60,
      currentAccountBalance: -4.87290163435469,
      fiscalStance: 'neutral',
    },
    initialShocks: [],
    keyKpi: 'Change ±2 % ⚠',
  },

  volcker1979: {
    id: 'volcker1979',
    title: 'Choc Volcker 1979',
    subtitle: 'Hyperinflation et désancrage sévère',
    description:
      'Inspiré de la crise de 1979 : l\'inflation mondiale s\'envole, menaçant de désancrer l\'économie. L\'inflation atteint 15 %, les anticipations d\'inflation sont à 12 % et la crédibilité de la banque centrale est au plus bas.',
    descriptionByLevel: {
      beginner: "L'inflation a explosé à 15% ! Votre mission historique est de briser l'inflation en montant le taux directeur vigoureusement sous 8 trimestres sans ruiner votre crédibilité.",
      intermediate: "Mission historique Choc Volcker : inflation à 15%, crédibilité à 35%. Ramenez l'inflation sous 3% en moins de 8 trimestres, tout en maintenant la crédibilité au-dessus de 0.",
      expert: "Réglez l'hyperinflation de 1979. Hausse agressive des taux requise. Si la crédibilité tombe à 0 ou que l'inflation dépasse 3% au bout de 8 trimestres, c'est l'échec.",
    },
    hintsByLevel: {
      beginner: ['Montez massivement le taux directeur au-delà de 8%', 'Le choc initial va durer 4 trimestres', 'Restez ferme sur la forward guidance restrictif'],
      intermediate: ['Une guidance restrictive (hawkish) est requise pour calmer les anticipations', 'Tolérez une baisse temporaire de croissance pour terrasser l\'inflation'],
      expert: [],
    },
    difficulty: 'crisis',
    initialState: {
      ...INITIAL_STATE,
      date: { year: 1979, q: 4 },
      inflation: 15.0,
      inflationCore: 12.5,
      inflationExpected: 12.0,
      gdpGrowth: 1.5,
      outputGap: 1.0,
      policyRate: 7.00,
      interbankRate: 7.00,
      lendingRate: 9.45,
      centralBankCredibility: 35,
      currentAccountBalance: -6.0,
      fiscalStance: 'neutral',
    },
    initialShocks: [
      {
        id: 'volcker_shocks',
        label: 'Désancrage Inflationniste',
        type: 'supply',
        magnitude: 1.0,
        remainingQuarters: 4,
        description: 'Anticipations d\'inflation profondément désancrées au niveau mondial.',
        inflationImpact: 4.0,
        outputGapImpact: -1.0,
        lendingRateImpact: 0,
        externalDemandImpact: 0,
      }
    ],
    keyKpi: 'Inflation 15 % ⚠',
  },

  crisis2008: {
    id: 'crisis2008',
    title: 'Crise Systémique 2008',
    subtitle: 'Contraction de crédit et explosion des NPL',
    description:
      'Inspiré de la grande crise de 2008 : les créances en souffrance (NPL) des banques atteignent un niveau critique de 18 %, le crédit se contracte à -4 % et la liquidité interbancaire gèle.',
    descriptionByLevel: {
      beginner: "Les banques font faillite ! Le ratio NPL est à 18% et le crédit recule de -4%. Votre mission : assainir le système (NPL < 10% et crédit > 2%) en injectant massivement de la liquidité sous 8 trimestres.",
      intermediate: "Objectif de stabilité financière 2008 : ramener les créances en souffrance (NPL) sous 10% et restaurer la croissance du crédit au-delà de 2% en moins de 8 trimestres.",
      expert: "Gérez le gel de liquidité bancaire de 2008. Utilisez les prêts d'urgence (Emergency Lending), les opérations de marché et baissez le coussin contracyclique CCyB pour restaurer le canal du crédit.",
    },
    hintsByLevel: {
      beginner: ['Injectez des dizaines de milliards en opérations de marché', 'Utilisez la facilité de prêt d\'urgence', 'Baissez le coussin CCyB à 0%'],
      intermediate: ['La baisse du CCyB libère des fonds propres et stimule le crédit', 'Combinez baisse des taux et opérations de refinancement massif'],
      expert: [],
    },
    difficulty: 'crisis',
    initialState: {
      ...INITIAL_STATE,
      date: { year: 2008, q: 4 },
      inflation: 3.71484311494064,
      inflationCore: 1.0,
      inflationExpected: 1.5,
      gdpGrowth: 5.68453936284732,
      outputGap: HISTORICAL_OUTPUT_GAPS.morocco2008,
      unemployment: 9.57,
      policyRate: 3.25,
      interbankRate: 3.25,
      lendingRate: 5.70,
      reserveRequirement: 15.0,
      creditGrowth: -4.0,
      liquidityNeed: 220.0,
      nplRatio: 18.0,
      centralBankCredibility: 65,
      currentAccountBalance: -4.4474051229375,
      fiscalStance: 'neutral',
    },
    initialShocks: [
      {
        id: 'subprime_credit_crunch',
        label: 'Credit Crunch Systémique',
        type: 'financial',
        magnitude: 1.0,
        remainingQuarters: 6,
        description: 'Crise systémique de confiance interbancaire entraînant un gel complet de l\'octroi de crédit.',
        inflationImpact: -1.0,
        outputGapImpact: -1.5,
        lendingRateImpact: 1.5,
        externalDemandImpact: -2.0,
      }
    ],
    keyKpi: 'NPL 18 % ⚠',
  },
}
