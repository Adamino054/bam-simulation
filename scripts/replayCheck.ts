/**
 * Contrôle d'intégration du rejeu historique — `npm run check:replay`.
 *
 * `validate:v5` teste le MODÈLE (le moteur v5 appelé directement).
 * Ce script-ci teste le BRANCHEMENT : il joue une partie complète en passant par le
 * vrai store de jeu (startGame → setPendingAction → advanceTurn), c'est-à-dire par le
 * chemin exact qu'emprunte un joueur dans l'interface.
 *
 * Attendu : des écarts nuls sur les quatre variables et les quatre scénarios quand le
 * joueur reproduit les décisions officielles, et une trajectoire qui S'ÉCARTE dès qu'il
 * décide autrement (contre-épreuve en fin de script).
 */

import { useGameStore } from '@/store/gameStore'
import {
  historicalQuartersCount, historicalPolicyRate, historicalReserveRequirement, historicalHcp,
} from '@/engine/v5/historicalScenarios'
import { gameQuarters } from '@/engine/gameLength'
import type { ScenarioId } from '@/engine/state'

const IDS: ScenarioId[] = ['covid2020', 'crisis2008', 'inflation2022', 'flexibilite']
const rmse = (a: number[]) => (a.length ? Math.sqrt(a.reduce((s, x) => s + x * x, 0) / a.length) : NaN)

let failures = 0

async function replayOfficialDecisions(id: ScenarioId) {
  await useGameStore.getState().startGame(id)

  const n = historicalQuartersCount(id)
  const e = { pi: [] as number[], u: [] as number[], g: [] as number[], gap: [] as number[] }
  const dates: string[] = []

  for (let q = 0; q < n; q++) {
    const cur = useGameStore.getState().currentState
    const rate = historicalPolicyRate(id, q) ?? cur.policyRate
    const rr = historicalReserveRequirement(id, q) ?? cur.reserveRequirement
    useGameStore.getState().setPendingAction({
      policyRateChangeBp: Math.round((rate - cur.policyRate) * 100),
      reserveRequirementChangeBp: Math.round((rr - cur.reserveRequirement) * 100),
    })
    useGameStore.getState().advanceTurn()

    const now = useGameStore.getState().currentState
    dates.push(`${now.date.year}T${now.date.q}`)
    const h = historicalHcp(id, q)!
    if (h.inflation !== undefined) e.pi.push(now.inflation - h.inflation)
    if (h.unemployment !== undefined) e.u.push(now.unemployment - h.unemployment)
    if (h.gdpGrowth !== undefined) e.g.push(now.gdpGrowth - h.gdpGrowth)
    if (h.outputGap !== undefined) e.gap.push(now.outputGap - h.outputGap)
  }

  const errs = [rmse(e.pi), rmse(e.gap), rmse(e.g), rmse(e.u)]
  const ok = errs.every(x => x < 1e-9)
  if (!ok) failures++

  console.log(
    `  ${ok ? 'OK  ' : 'ECHEC'} ${id.padEnd(14)} ` +
    `inflation ${errs[0].toFixed(3)} · output gap ${errs[1].toFixed(3)} · ` +
    `croissance ${errs[2].toFixed(3)} · chômage ${errs[3].toFixed(3)}  ` +
    `[${gameQuarters(id)} trimestres, ${dates[0]} → ${dates[dates.length - 1]}]`,
  )
  useGameStore.getState().reset()
}

async function main() {
  console.log('\n─── Rejeu via le store : le joueur reproduit les décisions officielles ───')
  for (const id of IDS) await replayOfficialDecisions(id)

  console.log('\n─── Contre-épreuve : le joueur décide autrement (+100 pb par trimestre) ───')
  await useGameStore.getState().startGame('covid2020')
  for (let q = 0; q < 8; q++) {
    useGameStore.getState().setPendingAction({ policyRateChangeBp: 100 })
    useGameStore.getState().advanceTurn()
  }
  const s = useGameStore.getState().currentState
  const h = historicalHcp('covid2020', 7)!
  const diverged = Math.abs(s.inflation - (h.inflation ?? 0)) > 0.1
  if (!diverged) failures++
  console.log(
    `  ${diverged ? 'OK   ' : 'ECHEC'} après 8 tours : taux ${s.policyRate.toFixed(2)} % · ` +
    `inflation ${s.inflation.toFixed(2)} % (HCP ${h.inflation}) · ` +
    `output gap ${s.outputGap.toFixed(2)} (HCP ${h.outputGap?.toFixed(2)}) · ` +
    `chômage ${s.unemployment.toFixed(2)} % (HCP ${h.unemployment})`,
  )
  useGameStore.getState().reset()

  console.log(failures === 0
    ? '\n✓ Branchement correct : le rejeu est exact et les décisions du joueur ont un effet.\n'
    : `\n✗ ${failures} contrôle(s) en échec.\n`)
  process.exit(failures === 0 ? 0 : 1)
}

main()
