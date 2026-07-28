/**
 * Paramètres du moteur v5 — ESTIMÉS par OLS sur données trimestrielles HCP / banque centrale.
 *
 * Contrairement au v1 (calibré à la main), chaque coefficient ici est le résultat
 * d'une régression sur la période PRÉ-COVID (2008-2019), puis le moteur est
 * confronté à 2020-2025 qu'il n'a jamais vues à l'estimation.
 *
 * Sources : chômage / croissance / output gap trimestriels HCP 2007-2025,
 * inflation IPC fusionnée (HCP), historique des décisions de politique monétaire.
 *
 * Voir engine/v5/README.md pour la méthode complète et les écarts-types.
 */

export const PARAMS_V5 = {
  // ── Courbe de Phillips estimée (2013Q2-2019Q4, série fusionnée) ──
  // π_t = c + a·π_{t-1} + κ·ỹ_{t-1} + u^π_t
  phillips: {
    const: 0.5465,   // (se 0.225, t=2.4)
    a:     0.5242,   // poids de l'inflation retardée (se 0.158, t=3.3)
    kappa: 0.0,      // pente estimée -0.146 (identification confondue par l'offre agri) → 0 retenu
    kappaGame: 0.15, // valeur "jeu" : rend l'inflation sensible au cycle (voir note ci-dessous)
  },

  // ── Courbe IS estimée (2009-2019) ──
  // ỹ_t = c + ρ·ỹ_{t-1} − σ·(i_{t-1} − π_{t-1}) + u^y_t
  is: {
    const: 0.1795,
    rho:   0.7308,   // persistance (se 0.24, t=3.1) → solide
    sigma: 0.0709,   // sensibilité au taux réel (se 0.24, t=0.3) → signe correct, non significatif
    sigmaGame: 0.24,      // valeur "jeu" (voir note ci-dessous)
    sigmaCredit: 0.08,    // canal du crédit : sensibilité de l'activité au spread bancaire
    guidanceShift: 0.25,  // forward guidance : équivaut à ±25 pb sur le taux perçu
  },

  // ── Loi d'Okun en DIFFÉRENCES = hystérèse (2008-2019) ──
  // Δu_t = s_q + c·Δỹ_t − ψ·s^agri_t
  // La persistance unitaire (Δu, pas de rappel vers un NAIRU) traduit l'hystérèse
  // de Blanchard-Summers, DÉMONTRÉE par rupture structurelle (test 2008-19 vs 2020-25).
  okun: {
    cCyclical: -0.1176,     // estimé (t ≈ 1,4, non significatif)
    cCyclicalGame: -0.30,   // valeur "jeu" (voir note en bas de fichier)
    saison: {           // saisonnalité agricole (moissons) — coefficients les plus significatifs (t>5)
      1:  0.4128,
      2: -1.0303,       // T2 : baisse du chômage (récolte)
      3:  0.8927,       // T3 : remontée
      4: -0.2065,
    } as Record<number, number>,
    psiDrought: 0.2019, // part des emplois agricoles détruits qui deviennent du chômage
  },

  // Choc emploi agricole net par année (pp), source HCP. Négatif = sécheresse.
  agriShockByYear: {
    2020: -2.184, 2021: 0.544, 2022: -1.720,
    2023: -1.616, 2024: -1.096, 2025: -0.328,
  } as Record<number, number>,

  potentialGrowth: 3.0, // croissance potentielle de référence (pour g = gpot + Δ4 gap)

  // ── Canal du change (régime de flottement encadré du dirham) ──
  fx: {
    meanReversion: 0.10,         // la banque défend un cours central : rappel vers 100
    rateSensitivity: 0.80,       // une HAUSSE du taux de 100 pb raffermit le dirham de 0,8 pt
    credibilitySensitivity: 0.02,// crédibilité sous 70 → pression à la dépréciation
    currentAccountSensitivity: 0.10, // déficit courant au-delà de 3 % du PIB → dépréciation
    interventionSensitivity: 0.015,  // par milliard de MAD vendu pour soutenir le dirham
    passThrough: 0.12,           // 1 % de dépréciation → +0,12 pp d'inflation importée
    bandLow: 88, bandHigh: 115,  // bornes du flottement encadré (indice, base 100)
  },

  // ── Canal des anticipations : une banque crédible ancre les prix ──
  expectationsWeight: 0.20,      // poids de (π^e − cible) dans la courbe de Phillips

  // ── Canal budgétaire : la stance budgétaire déplace la demande ──
  fiscalImpact: 0.30,            // ± points d'output gap

  // ── Bulle d'actifs : crédit abondant + taux réel bas ──
  bubble: {
    creditSensitivity: 0.50,     // par point de croissance du crédit au-dessus de 8 %
    rateSensitivity: 2.00,       // taux réel négatif → la bulle gonfle ; positif → elle dégonfle
    nplImpact: 0.03,             // au-delà de 60/100, la bulle nourrit les créances douteuses
  },
} as const

/**
 * ─── Sensibilités « jeu » : pourquoi elles diffèrent des estimations ───
 *
 * Deux coefficients estimés sortent statistiquement nuls sur données marocaines :
 *   κ = −0,146 (t = −1,9)  pente de Phillips, signe inverse, identification confondue
 *   σ =  0,071 (t =  0,3)  effet du taux réel sur l'activité, indiscernable de zéro
 *   c =  0,103 (t =  1,4)  coefficient cyclique d'Okun, non significatif lui aussi
 *
 * C'est un RÉSULTAT, pas un défaut d'estimation : sur cet échantillon, le taux directeur
 * n'a pas d'effet mesurable sur l'activité, et l'inflation marocaine n'a pas de composante
 * cyclique domestique détectable (celle de 2022 est importée).
 *
 * Mais un simulateur pédagogique dont les décisions ne changent rien n'apprend rien. Le jeu
 * utilise donc κ_jeu = 0,15, σ_jeu = 0,24 et c_jeu = 0,30, dans la fourchette des
 * calibrations usuelles pour une petite économie ouverte.
 *
 * Point essentiel : ce choix NE dégrade PAS la fidélité historique. Les constantes
 * trimestrielles (u^π, u^y, u^u) sont extraites AVEC ces mêmes valeurs, si bien que
 * reproduire les décisions officielles de la banque centrale redonne exactement les séries
 * du HCP. Les sensibilités ne gouvernent que l'ÉCART produit lorsque le joueur s'écarte de
 * ces décisions.
 *
 * `node scripts/validate-v5.js` mesure les deux régimes séparément.
 */
