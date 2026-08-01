/**
 * Équations estimées du moteur v5, isolées et pures (testables une par une).
 * Chaque fonction reproduit EXACTEMENT le code Python d'estimation (v5b.py).
 */

import { PARAMS_V5 } from './paramsV5'

/** Courbe de Phillips estimée : π_t = c + a·π_{t-1} + κ·ỹ_{t-1} + u^π_t */
export function phillipsV5(args: {
  inflationPrev: number
  outputGapPrev: number
  supplyShock: number      // u^π_t (choc d'offre exogène ; 0 si non fourni)
  /** Anticipations d'inflation du trimestre précédent (canal de la crédibilité). */
  inflationExpectedPrev?: number
  /** Dépréciation du dirham sur le trimestre, en % (canal du change importé). */
  depreciationPct?: number
  /** false → κ estimé (0, valeur économétrique) ; défaut → κ_jeu = 0,10 */
  useGameKappa?: boolean
}): number {
  const p = PARAMS_V5.phillips
  const kappa = args.useGameKappa === false ? p.kappa : p.kappaGame
  // Canal des anticipations : un écart durable à la cible se répercute sur les prix.
  const expTerm = args.inflationExpectedPrev === undefined ? 0
    : PARAMS_V5.expectationsWeight * (args.inflationExpectedPrev - 2.0)
  // Canal du change : une dépréciation renchérit les importations.
  const fxTerm = PARAMS_V5.fx.passThrough * (args.depreciationPct ?? 0)
  return p.const + p.a * args.inflationPrev + kappa * args.outputGapPrev
    + expTerm + fxTerm + args.supplyShock
}

/**
 * Courbe IS : ỹ_t = c + ρ·ỹ_{t−1} − σ·(i*_{t−1} − π_{t−1}) − σ_f·spread_{t−1} + u^y_t
 *
 * Le second canal (spread = taux débiteur − taux directeur) fait passer dans l'activité
 * TOUT ce qui agit sur le coût du crédit : coussin contracyclique (CCyB), réserve
 * obligatoire, opérations de marché, prêts d'urgence, prime de risque. Sans lui, ces
 * instruments ne touchaient que le bloc bancaire et laissaient l'inflation inchangée.
 */
export function isCurveV5(args: {
  outputGapPrev: number
  policyRatePrev: number
  inflationPrev: number
  demandShock: number      // u^y_t
  /** Spread bancaire du trimestre précédent (taux débiteur − taux directeur), en points. */
  creditSpreadPrev?: number
  /** Forward guidance : décalage du taux perçu (−0,25 accommodant, +0,25 restrictif). */
  guidanceShift?: number
  /** Impulsion budgétaire : +1 expansionniste, −1 restrictive, 0 neutre. */
  fiscalImpulse?: number
  /** false → σ estimé (0,071, non significatif) ; défaut → σ_jeu = 0,35 */
  useGameSigma?: boolean
}): number {
  const i = PARAMS_V5.is
  const sigma = args.useGameSigma === false ? i.sigma : i.sigmaGame
  const realRate = args.policyRatePrev + (args.guidanceShift ?? 0) - args.inflationPrev
  // Spread borné : évite qu'une boucle NPL emballée ne fasse exploser l'activité.
  const spread = Math.max(0, Math.min(10, args.creditSpreadPrev ?? 0))
  const fiscal = PARAMS_V5.fiscalImpact * (args.fiscalImpulse ?? 0)
  return i.const + i.rho * args.outputGapPrev - sigma * realRate
    - i.sigmaCredit * spread + fiscal + args.demandShock
}

/**
 * Loi d'Okun estimée, en différences (hystérèse) + saisonnalité + canal sécheresse :
 *   u_t = u_{t-1} + s_q + c·(ỹ_t − ỹ_{t-1}) − ψ·s^agri_t + u^u_t
 *
 * Le terme u^u_t est le choc historique du marché du travail (variations du taux
 * d'activité, emploi informel, effets de composition non mesurés). Il vaut 0 hors
 * rejeu historique ; en rejeu il ancre le chômage sur la série observée, de la même
 * façon que u^π ancre l'inflation.
 */
export function okunV5(args: {
  unemploymentPrev: number
  outputGap: number
  outputGapPrev: number
  quarter: 1 | 2 | 3 | 4
  agriShockAnnual: number  // choc emploi agricole de l'année (pp), réparti /4 dans l'appelant
  laborShock?: number      // u^u_t
  /** false → c estimé (−0,118, non significatif) ; défaut → c_jeu = −0,30 */
  useGameC?: boolean
}): number {
  const o = PARAMS_V5.okun
  const saison = o.saison[args.quarter] ?? 0
  const c = args.useGameC === false ? o.cCyclical : o.cCyclicalGame
  const cyclical = c * (args.outputGap - args.outputGapPrev)
  const drought = o.psiDrought * (args.agriShockAnnual / 4)
  return args.unemploymentPrev + saison + cyclical - drought + (args.laborShock ?? 0)
}

/**
 * Croissance : g_t = g^pot_t + (ỹ_t − ỹ_{t−4})
 * g^pot est le potentiel implicite ; en rejeu on le déduit des données observées,
 * sinon on prend PARAMS_V5.potentialGrowth.
 */
export function growthV5(args: {
  outputGap: number
  outputGapLag4: number
  potentialGrowth?: number
}): number {
  const gpot = args.potentialGrowth ?? PARAMS_V5.potentialGrowth
  return gpot + (args.outputGap - args.outputGapLag4)
}
