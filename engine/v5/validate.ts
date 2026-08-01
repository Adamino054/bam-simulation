/**
 * Validation du moteur v5 — à lancer avec :  npx tsx engine/v5/validate.ts
 *
 * En mode jeu, les scénarios historiques injectent quatre constantes trimestrielles
 * (u^π offre, u^y demande, u^u marché du travail, g^pot potentiel) qui ancrent la
 * trajectoire sur les séries du HCP. C'est ce qui garantit que reproduire les décisions
 * de Bank Al-Maghrib redonne les chiffres officiels, et que deux scénarios qui se
 * recouvrent donnent exactement les mêmes valeurs.
 *
 * Ce script mesure la performance NON AIDÉE : il retire les constantes une à une pour
 * voir ce que le moteur produit par sa seule dynamique estimée. C'est ce chiffre-là,
 * et non le 0,00 du mode jeu, qui mesure la qualité du modèle.
 */

import { stepV5 } from './simulatorV5'
import { PARAMS_V5 } from './paramsV5'
import { DEFAULT_POLICY_ACTION } from '../state'
import type { EconomicState, ScenarioId } from '../state'
import { SCENARIOS } from '../scenarios'
import {
  historicalQuartersCount, historicalShocks, historicalBamRate, historicalBamReserve,
  historicalHcp, historicalDate, historicalGapLag4, historicalPotentialGrowth,
  historicalInitialState,
} from './historicalScenarios'

const rmse = (a: number[]) => (a.length ? Math.sqrt(a.reduce((s, x) => s + x * x, 0) / a.length) : NaN)

/** Régime 1 : le jeu tel qu'il tourne, joueur = décisions de BAM. */
function modeJeu(id: ScenarioId) {
  let cur = historicalInitialState(id, { ...SCENARIOS[id].initialState }) as EconomicState
  let hist: EconomicState[] = []
  let last = cur.policyRate
  const e = { pi: [] as number[], u: [] as number[], g: [] as number[], gap: [] as number[] }
  for (let q = 0; q < historicalQuartersCount(id); q++) {
    const rate = historicalBamRate(id, q) ?? last
    last = rate
    const rr = historicalBamReserve(id, q) ?? cur.reserveRequirement
    const action = { ...DEFAULT_POLICY_ACTION,
      policyRateChangeBp: Math.round((rate - cur.policyRate) * 100),
      reserveRequirementChangeBp: Math.round((rr - cur.reserveRequirement) * 100) }
    const gaps = [...hist.slice(1).map(h => h.outputGap), cur.outputGap]
    const res = stepV5({ ...cur, date: historicalDate(id, cur.quarter) }, action, [], 12345, {
      scenarioId: id, realShocks: historicalShocks(id, q)!,
      outputGapLag4: historicalGapLag4(id, q, gaps),
      potentialGrowth: historicalPotentialGrowth(id, q) })
    res.newState.date = historicalDate(id, cur.quarter)
    hist = [...hist, cur]; cur = res.newState
    const h = historicalHcp(id, q)!
    if (h.inflation !== undefined) e.pi.push(cur.inflation - h.inflation)
    if (h.unemployment !== undefined) e.u.push(cur.unemployment - h.unemployment)
    if (h.gdpGrowth !== undefined) e.g.push(cur.gdpGrowth - h.gdpGrowth)
    if (h.outputGap !== undefined) e.gap.push(cur.outputGap - h.outputGap)
  }
  return { pi: rmse(e.pi), u: rmse(e.u), g: rmse(e.g), gap: rmse(e.gap) }
}

/**
 * Régime 2 : les équations estimées, seules, sans constante injectée. Le calcul est fait
 * directement, pour être indépendant des sensibilités de jeu et rester lisible.
 */
function sansAide(id: ScenarioId) {
  const init = historicalInitialState(id, { ...SCENARIOS[id].initialState }) as EconomicState
  const o = PARAMS_V5.okun, p = PARAMS_V5.phillips
  let u = init.unemployment, pi = init.inflation, gapPrev = init.outputGap
  const eU: number[] = [], ePi: number[] = []
  for (let q = 0; q < historicalQuartersCount(id); q++) {
    const h = historicalHcp(id, q)!
    const date = historicalDate(id, q)
    const gap = h.outputGap ?? gapPrev
    const agri = (PARAMS_V5.agriShockByYear as Record<number, number>)[date.year] ?? 0
    // Okun estimée : u_t = u_{t-1} + s_q + c·Δgap − ψ·agri/4   (c estimé, non aidé)
    u = u + (o.saison[date.q] ?? 0) + o.cCyclical * (gap - gapPrev) - o.psiDrought * (agri / 4)
    // Phillips estimée : π_t = const + a·π_{t-1} + κ·gap_{t-1}  (κ estimé = 0)
    pi = p.const + p.a * pi + p.kappa * gapPrev
    if (h.unemployment !== undefined) eU.push(u - h.unemployment)
    if (h.inflation !== undefined) ePi.push(pi - h.inflation)
    gapPrev = gap
  }
  return { u: rmse(eU), pi: rmse(ePi) }
}

const IDS: ScenarioId[] = ['covid2020', 'crisis2008', 'inflation2022', 'flexibilite']

console.log('\n═══ RÉGIME 1 — mode jeu, joueur = décisions de Bank Al-Maghrib ═══')
console.log('Les quatre constantes historiques sont injectées : la trajectoire est ancrée sur le HCP.')
for (const id of IDS) {
  const r = modeJeu(id)
  console.log(`  ${id.padEnd(14)} inflation ${r.pi.toFixed(3)} │ output gap ${r.gap.toFixed(3)} │ ` +
    `croissance ${r.g.toFixed(3)} │ chômage ${r.u.toFixed(3)}`)
}
console.log('  → des zéros attendus : ils prouvent l\'ancrage, pas la qualité du modèle.')

console.log('\n═══ RÉGIME 2 — équations estimées seules, aucune constante injectée ═══')
console.log('Coefficients économétriques (κ = 0, c = −0,118). C\'est la vraie mesure du moteur.')
for (const id of IDS) {
  const r = sansAide(id)
  console.log(`  ${id.padEnd(14)} chômage ${r.u.toFixed(3)} pp │ inflation ${r.pi.toFixed(3)} pp`)
}
console.log('  → le chômage sous 1 pp est le résultat à citer : il sort de la seule loi d\'Okun estimée.')
console.log('  → l\'inflation rate 2022 : elle est importée et la pente cyclique estimée est nulle.')

console.log('\n═══ Sensibilités utilisées par le jeu ═══')
console.log(`  κ  estimé ${PARAMS_V5.phillips.kappa.toFixed(3)} (t = −1,9)  →  jeu ${PARAMS_V5.phillips.kappaGame.toFixed(2)}`)
console.log(`  σ  estimé ${PARAMS_V5.is.sigma.toFixed(3)} (t =  0,3)  →  jeu ${PARAMS_V5.is.sigmaGame.toFixed(2)}`)
console.log(`  c  estimé ${PARAMS_V5.okun.cCyclical.toFixed(3)} (t =  1,4)  →  jeu ${PARAMS_V5.okun.cCyclicalGame.toFixed(2)}`)
console.log('  Les trois estimations sont statistiquement nulles : la donnée ne les identifie pas.')
console.log('  Les valeurs de jeu rendent les décisions visibles sans toucher à l\'ancrage.\n')
