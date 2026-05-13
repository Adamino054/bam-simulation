/**
 * Paramètres calibrés pour le moteur de simulation marocain.
 *
 * Calibration basée sur :
 * — Littérature sur les économies émergentes à régime de change rigide
 * — Rapports annuels Bank Al-Maghrib (2019-2024)
 * — Modèle QPM du FMI adapté au Maroc
 * — PNUD Morocco Macro Model (2022)
 */

import type { EconomicState } from './state'

export const PARAMS = {
  // ── Courbe de Phillips ──────────────────────────────────────────
  beta:  0.95,   // poids des anticipations dans la formation des prix
  kappa: 0.15,   // sensibilité de l'inflation à l'output gap
  alpha: 0.08,   // pass-through : variation du taux de change → inflation
  gamma: 0.20,   // sensibilité aux chocs agricoles (part agri > 10% du PIB MAR)

  // ── Courbe IS ────────────────────────────────────────────────────
  rho:   0.70,   // persistance de l'output gap (inertie cyclique)
  sigma: 0.12,   // sensibilité de la demande au taux réel (faible : capital peu mobile)
  delta: 0.30,   // degré d'ouverture, poids de la demande extérieure

  // ── Règle de Taylor (benchmark affiché au joueur, non contraignante) ──
  rStar:   1.5,  // taux réel neutre estimé pour le Maroc, %
  piTarget: 2.0, // cible d'inflation BAM, %
  phiPi:   1.50, // coefficient sur l'écart d'inflation (> 1 : principe de Taylor)
  phiY:    0.50, // coefficient sur l'output gap

  // ── Transmission bancaire ────────────────────────────────────────
  lambda:     0.35, // vitesse de répercussion du TMP → taux débiteur (~3 trimestres)
  bankMargin: 2.0,  // marge bancaire moyenne, points de %

  // ── Canal du crédit ──────────────────────────────────────────────
  theta0: 4.0,  // croissance autonome du crédit, %
  theta1: 0.8,  // élasticité à l'activité économique
  theta2: 0.5,  // sensibilité au coût du crédit (taux débiteur)
  theta3: 0.3,  // sensibilité aux anticipations d'inflation

  // ── Marché monétaire ─────────────────────────────────────────────
  liquidityElasticity: 0.05, // pente : excès de besoin de liquidité → pression sur TMP

  // ── Macroprudentiel (Stabilité Financière) ───────────────────────
  ccybLendingImpact: 0.40, // 1% de CCyB en plus augmente le taux débiteur de 0.40 pt (coût du capital)
  nplBase: 7.0,            // Taux de NPL naturel
  nplSensRate: 0.8,        // Sensibilité du NPL au taux débiteur (taux élevé = défauts)
  nplSensGrowth: 1.5,      // Sensibilité du NPL à l'output gap (récession = défauts)
  nplCreditPenalty: 0.5,   // 1% de NPL en plus réduit la croissance du crédit de 0.5%

  // ── Loi d'Okun ───────────────────────────────────────────────────
  okunCoef:           0.40,  // coefficient Okun : 1 pt d'output gap → -0,4 pt chômage
  unemploymentNatural: 9.5,  // taux de chômage naturel (NAIRU marocain estimé)

  // ── Contraintes ──────────────────────────────────────────────────
  effectiveLowerBound: 0.5,  // borne basse du taux directeur, %

  // ── Inflation core ───────────────────────────────────────────────
  // L'inflation core suit l'inflation totale avec un filtre 0,6/0,4
  infCoreSmoothing: 0.60,
} as const

export const INITIAL_STATE: EconomicState = {
  quarter: 0,
  date: { year: 2025, q: 1 },

  inflation: 2.2,
  inflationCore: 2.0,
  inflationExpected: 2.0,

  gdpGrowth: 3.2,
  outputGap: 0.0,
  unemployment: 11.0,

  policyRate: 2.75,
  interbankRate: 2.75,
  lendingRate: 5.20,

  reserveRequirement: 4.0,
  creditGrowth: 5.0,
  liquidityNeed: 80.0,
  nplRatio: 7.5,

  exchangeRate: 100.0,
  externalDemand: 0.0,

  // New fields (Task 2)
  centralBankCredibility: 70,
  currentAccountBalance: -2.5,
  fiscalStance: 'neutral',

  // New fields (Gameplay v2)
  financialInnovationActive: false,
  assetBubbleIndex: 0,
}
