/**
 * Messages contextuels de l'Assistant CBS.
 * Organisés par page et par contexte de simulation.
 */
import type { DifficultyLevel } from './difficulty'
import type { EconomicState } from './state'
import { PARAMS } from './parameters'
import { computeTaylorRate } from './models/taylorRule'
import { step } from './simulator'

export interface BotMessage {
  id: string
  text: string
  /** Optional: only show for specific levels */
  level?: DifficultyLevel
  /** Priority: higher = shown first */
  priority?: number
}

// ── Landing page messages ───────────────────────────────────────────────────
export const LANDING_MESSAGES: BotMessage[] = [
  { id: 'landing-1', text: "Bienvenue ! Je suis votre Assistant CBS. Cliquez sur mon icône pour obtenir des conseils tout au long de votre parcours d'apprentissage !" },
  { id: 'landing-2', text: "Commencez par les cours pour appréhender les fondamentaux économiques, puis lancez votre première simulation !" },
  { id: 'landing-3', text: "Conseil de gestion : pour débuter sereinement, privilégiez le scénario 'Standard' en mode Débutant." },
]

// ── Dashboard messages ──────────────────────────────────────────────────────
export const DASHBOARD_MESSAGES: Record<DifficultyLevel, BotMessage[]> = {
  beginner: [
    { id: 'dash-b1', text: "Mode Débutant sélectionné. Vous bénéficiez de 3 instruments simplifiés et de conseils à chaque trimestre." },
    { id: 'dash-b2', text: "Je vous recommande vivement le scénario Standard pour vous familiariser avec les réactions de l'économie marocaine." },
    { id: 'dash-b3', text: "N'hésitez pas à lire les chapitres de cours — ils contiennent les clés pour comprendre chaque décision." },
  ],
  intermediate: [
    { id: 'dash-i1', text: "Mode Intermédiaire actif. Vous disposez désormais de la communication (Forward Guidance) et des interventions de change." },
    { id: 'dash-i2', text: "Le scénario Inflation 2022 constitue un excellent exercice de gestion des chocs d'offre d'énergie." },
    { id: 'dash-i3', text: "Pensez à guider les marchés avec une posture Hawkish ou Dovish pour orienter les anticipations sans toucher aux taux." },
  ],
  expert: [
    { id: 'dash-e1', text: "Mode Expert engagé. Tous les instruments sont débloqués. Le barème est strict, préparez-vous bien !" },
    { id: 'dash-e2', text: "Le scénario de Flexibilisation du Dirham est exigeant. Le pass-through de change peut amplifier le moindre écart." },
    { id: 'dash-e3', text: "En mode Expert, le coussin contracyclique (CCyB) et l'Emergency Lending deviennent indispensables pour préserver la stabilité." },
  ],
}

// ── Course messages ─────────────────────────────────────────────────────────
export const COURSE_MESSAGES: Record<string, BotMessage[]> = {
  intro: [
    { id: 'course-intro-1', text: "Ce module pose les bases de notre action. Rappelez-vous : notre objectif constitutionnel premier reste la stabilité des prix." },
    { id: 'course-intro-2', text: "À retenir : l'inflation représente 35% de la note globale. C'est l'indicateur le plus important de votre mandat." },
  ],
  'policy-rate': [
    { id: 'course-pr-1', text: "Le taux directeur est l'arme de référence. Cependant, son canal de transmission requiert 2 à 3 trimestres pour faire pleinement effet." },
    { id: 'course-pr-2', text: "Stratégie de pilotage : anticipez l'horizon de moyen terme. Modifier le taux trop tardivement laisse l'inflation s'installer." },
  ],
  'is-curve': [
    { id: 'course-is-1', text: "L'output gap révèle l'équilibre d'activité. S'il plonge sous -1.5%, stimulez. S'il s'envole au-dessus de +1.5%, calmez le jeu." },
    { id: 'course-is-2', text: "La sensibilité de la demande globale (paramètre σ) est modérée au Maroc. Il faut donc être patient après un mouvement de taux." },
  ],
  phillips: [
    { id: 'course-ph-1', text: "La courbe de Phillips illustre le grand arbitrage : réduire l'inflation demande parfois de ralentir temporairement l'activité." },
    { id: 'course-ph-2', text: "Devant un choc d'offre, analysez l'inflation sous-jacente (core). Si elle reste stable, évitez les resserrements excessifs." },
  ],
  channels: [
    { id: 'course-ch-1', text: "Quatre canaux de transmission majeurs. Le Forward Guidance is un outil de confiance qui n'induit aucun coût direct." },
    { id: 'course-ch-2', text: "Si le ratio de NPL dépasse 12%, le canal du crédit se bloque. Les banques arrêtent de prêter, limitant l'effet de vos baisses de taux." },
  ],
  taylor: [
    { id: 'course-ty-1', text: "La règle de Taylor sert de boussole théorique. Évitez de vous écarter excessivement de son taux suggéré." },
    { id: 'course-ty-2', text: "Rappel : s'éloigner de plus de 1.5% de la règle de Taylor de façon durable dégrade votre crédibilité auprès des marchés." },
  ],
  shocks: [
    { id: 'course-sh-1', text: "Choc d'offre : la situation la plus complexe. L'inflation augmente pendant que la croissance s'effondre." },
    { id: 'course-sh-2', text: "Ces chocs durent généralement de 2 à 6 trimestres. Concentrez-vous sur l'inflation core pour juger de la contagion." },
  ],
  'financial-stability': [
    { id: 'course-fs-1', text: "Le cercle vicieux dette-déflation est redoutable. Si les NPL s'envolent et que les prix baissent, l'Emergency Lending est requis." },
    { id: 'course-fs-2', text: "Le coussin contracyclique (CCyB) s'utilise en prévention : accumulez du capital en haut de cycle bancaire, relâchez-le en crise." },
  ],
}

// ── Simulation contextual messages ──────────────────────────────────────────
export interface SimulationContext {
  inflation: number
  outputGap: number
  nplRatio: number
  policyRate: number
  creditGrowth: number
  centralBankCredibility: number
  quarter: number
}

export function getSimulationTips(ctx: SimulationContext, level: DifficultyLevel): string[] {
  const tips: string[] = []

  if (level === 'beginner') {
    if (ctx.quarter === 0) {
      tips.push("Bienvenue à votre premier trimestre. Analysez attentivement l'inflation et la croissance avant de modifier le taux directeur.")
    }
    if (ctx.inflation > 4) {
      tips.push(`Inflation trop élevée à ${ctx.inflation.toFixed(1)}% (cible: 2.0%). Il conviendrait de relever le taux directeur de 25 ou 50 points de base.`)
    }
    if (ctx.inflation < 1) {
      tips.push(`Risque de déflation avec une inflation à ${ctx.inflation.toFixed(1)}%. Envisagez une baisse du taux directeur pour relancer la demande.`)
    }
    if (ctx.outputGap < -2) {
      tips.push(`Activité très faible (output gap à ${ctx.outputGap.toFixed(1)}%). Une baisse de taux aiderait à relancer la croissance.`)
    }
    if (ctx.outputGap > 2) {
      tips.push(`Surchauffe économique (output gap à ${ctx.outputGap.toFixed(1)}%). Resserrez votre politique pour apaiser les tensions.`)
    }
  }

  if (level === 'intermediate') {
    if (ctx.inflation > 3.5 && ctx.centralBankCredibility < 60) {
      tips.push("La hausse de l'inflation pèse sur votre crédibilité. Une communication ferme (Hawkish) pourrait stabiliser les anticipations.")
    }
    if (ctx.nplRatio > 9) {
      tips.push(`Créances douteuses à ${ctx.nplRatio.toFixed(1)}%. Le risque de resserrement du crédit s'accroît, surveillez la santé des banques.`)
    }
  }

  if (level === 'expert') {
    if (ctx.nplRatio > 12 && ctx.inflation < 0.5) {
      tips.push("Situation de dette-déflation détectée. Pensez à injecter des liquidités d'urgence (Emergency Lending) pour stabiliser le réseau.")
    }
    if (ctx.centralBankCredibility < 30) {
      tips.push("Niveau de crédibilité critique. Les décisions de taux risquent de ne plus se transmettre correctement à l'économie réelle.")
    }
  }

  return tips
}

// ── Debrief messages ────────────────────────────────────────────────────────
export function getDebriefMessage(grade: string, score: number, level: DifficultyLevel): string {
  if (grade === 'A') {
    if (level === 'expert') return "Prestation exceptionnelle. Obtenir le grade A en mode Expert démontre une maîtrise remarquable de la politique monétaire."
    return "Félicitations pour ce mandat exemplaire. Vos objectifs de stabilité et d'activité ont été pleinement atteints."
  }
  if (grade === 'B') {
    return "Bon mandat. Les objectifs majeurs sont atteints, malgré quelques écarts temporaires. Avec un peu plus de rigueur, le grade A est à votre portée."
  }
  if (grade === 'C') {
    if (level === 'beginner') return "Un parcours honorable pour vos débuts. Prenez le temps d'analyser vos choix à l'aide des cours et réessayez pour progresser."
    return "Des résultats encourageants, mais la transmission a souffert d'incohérences de taux. L'étude du rapport de mandat vous aidera à vous corriger."
  }
  if (grade === 'D') {
    return "Mandat délicat. Pensez à suivre la règle de Taylor pour caler vos taux directeurs de façon plus prévisible."
  }
  return "Bilan complexe. Nous vous suggérons de revoir les concepts dans les cours et de retenter l'expérience au niveau Débutant."
}

// ── Economic Glossary & Math Parser (Task 2.1) ──────────────────────────────
export interface GlossaryTerm {
  name: string
  keywords: string[]
  definition: string
  formula?: string
  gameTip: string
}

export const ECONOMIC_GLOSSARY: GlossaryTerm[] = [
  {
    name: "Taux directeur",
    keywords: ["taux directeur", "taux d'interet", "taux", "interet", "politique monetaire"],
    definition: "Le taux directeur (Taux de Référence Interbancaire ou TMP) est le principal instrument de politique monétaire de la Centrale Bank Simulateur. Il influence le taux interbancaire puis le taux débiteur appliqué aux agents économiques par le canal de transmission monétaire.",
    formula: "i^D_t = (1 - \\lambda) i^D_{t-1} + \\lambda (i^{TMP}_t + \\text{marge}) + \\text{RiskPremium}",
    gameTip: "Augmentez le taux si l'inflation dépasse 2% pour refroidir la demande, et baissez-le en cas de récession. Les effets mettent 2 à 3 trimestres à se propager pleinement à l'économie."
  },
  {
    name: "Inflation",
    keywords: ["inflation", "prix", "vie chere", "pouvoir d'achat", "stabilite des prix"],
    definition: "L'inflation mesure le taux de hausse générale et durable des prix à la consommation. Le mandat de la Centrale Bank Simulateur est d'assurer la stabilité des prix, définie par une cible d'inflation stable autour de 2.0 %.",
    formula: "\\pi_t = \\beta_{eff} \\cdot \\pi^e_t + \\kappa \\tilde{y}_t + \\alpha \\Delta p^{imp}_t + \\gamma s^{agri}_t + u^{\\pi}_t",
    gameTip: "L'inflation représente 35% de votre score global. Distinguez l'inflation globale (headline) de l'inflation sous-jacente (core). Si la hausse est due à un choc d'offre passager (ex. pétrole), évitez de sur-réagir."
  },
  {
    name: "Créances Douteuses (NPL)",
    keywords: ["npl", "creances douteuses", "defaut", "faillite", "credit crunch", "douteuses"],
    definition: "Les Non-Performing Loans (NPL) représentent la proportion des crédits bancaires en souffrance. Un taux de NPL élevé témoigne de difficultés financières pour les entreprises et augmente la prime de risque interne des banques.",
    formula: "NPL_t = NPL_{t-1} + \\gamma_1 GAP_{t} + \\gamma_2 \\Delta i_{t}",
    gameTip: "Si le taux de NPL franchit la barre fatidique des 12.0 %, le canal de transmission du crédit se bloque : les banques paniquent et cessent de prêter, rendant toute baisse des taux inefficace. Activez le CCyB en amont ou l'Emergency Lending en cas de crise."
  },
  {
    name: "Écart de Production (Output Gap)",
    keywords: ["output gap", "gap", "pib", "croissance", "recession", "surchauffe"],
    definition: "L'écart de production représente la différence entre le produit intérieur brut (PIB) réel de l'économie et son PIB potentiel (production maximale durable sans tensions inflationnistes).",
    formula: "\\tilde{y}_t = Y_t - Y^{potentiel}_t",
    gameTip: "Un gap positif (> 0%) traduit une surchauffe et nourrit l'inflation. Un gap négatif (< 0%) traduit une récession et du chômage. Ajustez le taux directeur pour rapprocher le gap de 0.0 %."
  },
  {
    name: "Coussin Contre-cyclique (CCyB)",
    keywords: ["ccyb", "contracyclique", "coussin de capital", "macroprudentiel", "fonds propres"],
    definition: "Le Coussin de Capital Contre-cyclique (CCyB) est une obligation imposée aux banques de détenir des réserves de capital supplémentaires en phase de forte croissance du crédit, utilisables en cas de retournement conjoncturel.",
    formula: "CCyB_t \\in [0.0\\%, \\ 2.5\\%]",
    gameTip: "Activez-le préventivement (ex: 0.5% à 1.5%) lorsque le crédit bancaire croît anormalement vite (> 7-8%) pour éviter une bulle de crédit, puis relâchez-le à 0% en période de récession."
  },
  {
    name: "Opérations de Marché",
    keywords: ["operations de marche", "liquidite bancaire", "refinancement", "marche interbancaire"],
    definition: "Les opérations d'open market permettent à la banque centrale d'ajuster le volume global de liquidités en circulation dans le secteur bancaire en injectant ou ponctionnant des fonds, maintenant ainsi le taux interbancaire proche du taux directeur.",
    formula: "\\text{Besoin Net} = L_t - Ops_{CBS}",
    gameTip: "Si le besoin de liquidité des banques augmente fortement, injectez des liquidités pour stabiliser le taux interbancaire et éviter un rationnement des crédits."
  },
  {
    name: "Crédibilité CBS",
    keywords: ["credibilite", "confiance", "communication", "guidance"],
    definition: "La crédibilité mesure le degré de confiance des marchés et des agents économiques dans la capacité de la banque centrale à tenir ses engagements (notamment la cible de 2% d'inflation).",
    formula: "Cred_t = Cred_{t-1} - \\beta |\\pi_t - 2.0|",
    gameTip: "Une crédibilité élevée amplifie l'efficacité du Forward Guidance (votre communication), vous permettant d'ancrer les anticipations sans toucher physiquement au taux directeur !"
  },
  {
    name: "Réserves de Change",
    keywords: ["change", "reserves de change", "devises", "dirham", "importations"],
    definition: "Les réserves de change représentent les avoirs extérieurs en devises détenus par la Centrale Bank Simulateur, assurant la stabilité extérieure du Dirham et garantissant la capacité à financer les importations du Royaume.",
    formula: "\\Delta FX = CurrentAccount_t + CapitalFlows_t",
    gameTip: "Si le dirham subit des pressions à la baisse, vous pouvez intervenir sur le marché des devises (FX Intervention), mais attention à ne pas épuiser vos réserves (idéalement au-dessus de 5 à 6 mois d'importations)."
  },
  {
    name: "Règle de Taylor",
    keywords: ["taylor", "regle de taylor", "formule de taylor"],
    definition: "La règle de Taylor est une règle empirique suggérant le niveau théorique optimal du taux directeur face à l'écart de l'inflation par la cible et à l'écart de production.",
    formula: "i^*_{Taylor} = r^* + \\pi^* + \\phi_\\pi (\\pi_t - \\pi^*) + \\phi_y \\tilde{y}_t",
    gameTip: "Suivre la règle de Taylor vous évite des erreurs grossières. S'en écarter de plus de 1.5 pp sur plusieurs trimestres réduit votre score de crédibilité !"
  },
  {
    name: "Courbe de Phillips",
    keywords: ["courbe de phillips", "phillips", "relation inflation chômage"],
    definition: "La courbe de Phillips illustre la relation entre l'inflation et l'activité économique (écart de production). Au Maroc, elle est influencée par les anticipations d'inflation, les chocs d'offre importée (pass-through de change) et la production agricole.",
    formula: "\\pi_t = \\beta_{eff} \\cdot \\pi^e_t + \\kappa \\tilde{y}_t + \\alpha \\Delta p^{imp}_t + \\gamma s^{agri}_t + u^{\\pi}_t",
    gameTip: "Pour lutter contre l'inflation, vous devez parfois accepter de réduire l'output gap en élevant les taux directeurs, ce qui ralentit la demande."
  },
  {
    name: "Courbe IS",
    keywords: ["courbe is", "is-curve", "is curve", "demande globale"],
    definition: "La courbe IS (Investment-Savings) décrit l'équilibre sur le marché des biens et services. Elle montre comment l'écart de production (output gap) réagit aux variations du taux d'intérêt réel, à la demande extérieure (zone euro) et aux politiques budgétaires.",
    formula: "\\tilde{y}_t = \\rho \\tilde{y}_{t-1} - \\sigma (i^D_{t-1} - \\pi^e_{t-1}) + \\delta \\tilde{y}^*_t + u^y_t + \\text{guidance} + \\text{fiscal}",
    gameTip: "Puisque la sensibilité de la demande au taux réel (\\sigma = 0.12) est modérée au Maroc, le taux directeur met plusieurs trimestres à corriger l'écart de production."
  },
  {
    name: "Canal du crédit",
    keywords: ["canal du credit", "credit crunch", "transmission bancaire", "taux debiteur"],
    definition: "Le canal du crédit décrit comment les décisions de taux d'intérêt de la banque centrale (TMP) se répercutent sur le taux d'intérêt des crédits accordés par les banques (taux débiteur), influençant ainsi la croissance globale des prêts.",
    formula: "\\Delta L_t = \\theta_0 + \\theta_1 \\tilde{y}_t - \\theta_2 i^D_t + \\theta_3 \\pi^e_t - \\text{Penalty}_{NPL}",
    gameTip: "Un ratio de créances en souffrance (NPL) supérieur à 12% augmente fortement la prime de risque interne des banques, bloquant la transmission monétaire."
  },
  {
    name: "Loi d'Okun",
    keywords: ["loi d'okun", "okun", "chomage", "emploi"],
    definition: "La loi d'Okun relie le taux de chômage à l'activité économique. Un écart de production positif (surchauffe) stimule l'emploi et réduit le chômage sous son niveau naturel, tandis qu'une récession l'augmente.",
    formula: "U_t = U^{naturel} - \\text{okunCoef} \\cdot \\tilde{y}_t",
    gameTip: "Le taux de chômage naturel au Maroc est calibré à 9.5%. Maintenir l'output gap proche de 0% stabilise le chômage autour de sa cible structurelle."
  },
  {
    name: "Dette-Déflation",
    keywords: ["dette-deflation", "dette reelle", "irving fisher", "fisher", "spirale deflationniste", "deflation"],
    definition: "Le concept de dette-déflation d'Irving Fisher (1933) décrit comment une baisse générale des prix (déflation) alourdit la charge réelle de la dette, entraînant des défauts en chaîne (NPL) et contractant l'activité économique.",
    formula: "D^{reelle}_t = \\frac{D_t}{P_t} \\quad \\text{et} \\quad r_t = i^D_t - \\pi^e_t \\quad (\\text{avec } \\pi^e_t < 0 \\implies r_t > i^D_t)",
    gameTip: "En situation de déflation avec un ratio de NPL > 12%, le taux d'intérêt réel s'envole automatiquement. Seule l'injection massive de liquidités d'urgence (Emergency Lending) permet de briser ce piège."
  },
  {
    name: "Canal des anticipations",
    keywords: ["anticipations", "canal des anticipations", "forward guidance", "communication"],
    definition: "Le canal des anticipations (ou Forward Guidance) permet à la Centrale Bank Simulateur d'influencer la trajectoire future attendue des taux directeurs à court terme, agissant directement sur les taux d'intérêt à long terme et l'inflation anticipée.",
    formula: "i^{long}_t = \\frac{1}{N} \\sum_{k=0}^{N-1} E_t[i_{t+k}] + \\text{TermPremium}_t",
    gameTip: "Dans le simulateur, si votre crédibilité est supérieure à 80%, vous pouvez réduire l'output gap en adoptant une communication Hawkish ou Dovish sans avoir à modifier physiquement votre taux directeur !"
  }
]

/**
 * Moteur sémantique par mots-clés en français pour répondre aux questions libres des utilisateurs.
 * Intègre les données de la simulation en temps réel s'il est appelé avec le state de simulation.
 */
export function answerCustomQuestion(query: string, state?: EconomicState, pseudo?: string): string {
  const q = query.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
    .trim()

  const name = pseudo ? pseudo : "Gouverneur"

  if (!q) {
    return `Bonjour ${name}. Posez-moi vos questions économiques. Par exemple : "Comment réduire l'inflation ?" ou "Quel est l'impact des NPL ?" pour obtenir mon analyse.`
  }

  // ── A. MOTEUR DE PRÉVISION INTERACTIF (Ceteris Paribus) ──
  // Détecte : "si je monte de 50 pb", "si je baisse le taux de 0.25%", "que se passe-t-il si j'augmente de 100 pb"
  const rateValueRegex = /([+-]?\d+(?:[\.,]\d+)?)\s*(pb|bp|%)/gi
  const rateMatch = rateValueRegex.exec(q)
  if (q.includes("si je") && (q.includes("taux") || q.includes("ro") || q.includes("reserve") || q.includes("pb") || q.includes("bp") || q.includes("%"))) {
    if (rateMatch) {
      const val = parseFloat(rateMatch[1].replace(',', '.'))
      const unit = rateMatch[2].toLowerCase()
      
      let isIncrease = true
      if (q.includes("baisse") || q.includes("redui") || q.includes("diminu") || q.includes("descen") || q.includes("decroi")) {
        isIncrease = false
      }
      
      let changeBp = 0
      if (unit === '%') {
        changeBp = val * 100
      } else {
        changeBp = val
      }
      
      if (!isIncrease) {
        changeBp = -Math.abs(changeBp)
      } else {
        changeBp = Math.abs(changeBp)
      }

      const isReserve = q.includes("reserve") || q.includes("ro")

      if (state) {
        const action = {
          policyRateChangeBp: isReserve ? 0 : changeBp,
          reserveRequirementChangeBp: isReserve ? changeBp : 0,
          marketOperationsBnMad: 0,
          communicationStance: 'neutral' as const,
          fxInterventionBnMad: 0,
          emergencyLendingBnMad: 0,
          ccybRate: 0,
        }

        // Exécution de la simulation trimestrielle ceteris paribus (hors chocs)
        const simResult = step(state, action, [], 42)
        const next = simResult.newState

        if (isReserve) {
          const reserveDiff = next.reserveRequirement - state.reserveRequirement
          const creditDiff = next.creditGrowth - state.creditGrowth
          const lendingDiff = next.lendingRate - state.lendingRate
          const infDiff = next.inflation - state.inflation

          return `🔮 **Simulation Prévisionnelle — Réserve Obligatoire (Ceteris Paribus)**

Gouverneur **${name}**, si vous modifiez le taux de réserve obligatoire de **${changeBp > 0 ? '+' : ''}${changeBp} pb** (portant le taux RO à **${next.reserveRequirement.toFixed(2)} %**), voici l'impact attendu au trimestre prochain :

*   **Taux débiteur moyen** : **${next.lendingRate.toFixed(2)} %** (${lendingDiff > 0 ? '+' : ''}${lendingDiff.toFixed(2)} pp)
*   **Croissance du crédit** : **${next.creditGrowth.toFixed(2)} %** (${creditDiff > 0 ? '+' : ''}${creditDiff.toFixed(2)} pp)
*   **Inflation (π)** : **${next.inflation.toFixed(2)} %** (${infDiff > 0 ? '+' : ''}${infDiff.toFixed(2)} pp)
*   **Besoin de liquidité bancaire** : **${next.liquidityNeed.toFixed(1)} mds MAD** (${(next.liquidityNeed - state.liquidityNeed) > 0 ? '+' : ''}${(next.liquidityNeed - state.liquidityNeed).toFixed(1)} mds)

📊 *Analyse de votre conseiller :* ${
            changeBp > 0 
              ? "Relever les réserves obligatoires ponctionne la liquidité bancaire, ce qui augmente le taux débiteur et freine la distribution des crédits. C'est idéal pour calmer une surchauffe financière."
              : "Abaisser les réserves obligatoires injecte de la liquidité gratuite dans les banques, réduisant le coût du crédit pour stimuler l'économie réelle."
          } (Simulation ceteris paribus, hors chocs ou chocs de change)`
        } else {
          const rateDiff = next.policyRate - state.policyRate
          const lendingDiff = next.lendingRate - state.lendingRate
          const infDiff = next.inflation - state.inflation
          const growthDiff = next.gdpGrowth - state.gdpGrowth
          const nplDiff = next.nplRatio - state.nplRatio

          return `🔮 **Simulation Prévisionnelle — Taux Directeur (Ceteris Paribus)**

Gouverneur **${name}**, si vous appliquez une variation de **${changeBp > 0 ? '+' : ''}${changeBp} pb** à votre taux directeur au prochain trimestre (portant le taux directeur à **${next.policyRate.toFixed(2)} %**), voici la projection de notre département d'études économiques :

*   **Taux directeur** : **${next.policyRate.toFixed(2)} %** (${rateDiff > 0 ? '+' : ''}${rateDiff.toFixed(2)} pp)
*   **Taux débiteur moyen (i^D)** : **${next.lendingRate.toFixed(2)} %** (${lendingDiff > 0 ? '+' : ''}${lendingDiff.toFixed(2)} pp)
*   **Inflation (π)** : **${next.inflation.toFixed(2)} %** (${infDiff > 0 ? '+' : ''}${infDiff.toFixed(2)} pp par rapport au niveau actuel)
*   **Croissance du PIB** : **${next.gdpGrowth.toFixed(2)} %** (${growthDiff > 0 ? '+' : ''}${growthDiff.toFixed(2)} pp)
*   **Créances bancaires (NPL)** : **${next.nplRatio.toFixed(2)} %** (${nplDiff > 0 ? '+' : ''}${nplDiff.toFixed(2)} pp)

📊 *Analyse de votre conseiller :* ${
            changeBp > 0 
              ? "Ce resserrement monétaire va refroidir la demande, réduisant l'inflation future au prix d'un léger ralentissement de la croissance et d'une hausse mécanique des créances douteuses."
              : "Cet assouplissement va stimuler l'offre de crédit et soutenir la croissance, au risque de créer des pressions inflationnistes supplémentaires à moyen terme."
          } (Simulation ceteris paribus, hors chocs ou chocs de change)`
        }
      } else {
        return `Gouverneur **${name}**, pour lancer une simulation prévisionnelle en direct, veuillez démarrer une partie depuis votre **[Dashboard](/dashboard)**. Je serai alors capable d'exécuter des projections en temps réel sur la base de votre état économique exact !`
      }
    }
  }

  // A. Question sur comment réduire l'inflation
  if ((q.includes("reduire") && q.includes("inflation")) || q.includes("lutter contre l'inflation") || q.includes("stabiliser les prix") || q.includes("baisser l'inflation")) {
    return `Gouverneur ${name}, pour **réduire l'inflation** et la ramener vers sa cible de **2.0%**, la Centrale Bank Simulateur utilise son taux directeur $i^*_t$ pour contracter la demande globale. La chaîne de transmission mathématique s'établit comme suit :

1. **Resserrement monétaire** : Relever le taux directeur de $i^*_t \\uparrow$ augmente le taux interbancaire ($i^{TMP}_t$), ce qui pousse les banques à relever le taux débiteur ($i^D_t$) appliqué aux entreprises et ménages :
$$i^D_t = (1 - \\lambda) i^D_{t-1} + \\lambda (i^{TMP}_t + \\text{marge}) + \\text{RiskPremium}$$

2. **Refroidissement de l'économie (Courbe IS)** : Un taux débiteur plus élevé augmente le taux d'intérêt réel ($i^D_t - \\pi^e_t$). Cela décourage l'investissement et la consommation, réduisant ainsi l'écart de production (output gap $\\tilde{y}_t$) :
$$\\tilde{y}_t = \\rho \\tilde{y}_{t-1} - \\sigma (i^D_{t-1} - \\pi^e_{t-1}) + \\delta \\tilde{y}^*_t + u^y_t$$

3. **Baisse des prix (Courbe de Phillips)** : La contraction de l'activité réelle (output gap négatif $\\tilde{y}_t < 0$) réduit le pouvoir de négociation des entreprises et tempère la hausse des salaires, ramenant l'inflation $\\pi_t$ vers la cible :
$$\\pi_t = \\beta_{eff} \\cdot \\pi^e_t + \\kappa \\tilde{y}_t + \\alpha \\Delta p^{imp}_t + \\gamma s^{agri}_t + u^{\\pi}_t$$

🏛️ *Recommandation de jeu :* Si l'inflation est supérieure à 3%, relevez le taux directeur par paliers de **25 pb ou 50 pb**. Attention toutefois à ne pas provoquer de récession trop brutale (un output gap inférieur à -2.0% nuit gravement à votre score de croissance).`
  }

  // B. Question sur comment relancer la croissance / récession
  if (q.includes("croissance") || q.includes("recession") || q.includes("chomage") || q.includes("relancer l'economie") || q.includes("creer des emplois")) {
    return `Gouverneur ${name}, pour **stimuler l'activité économique** et **réduire le chômage** en période de récession, la Centrale Bank Simulateur adopte une politique monétaire accommodante :

1. **Baisse des taux** : Réduire le taux directeur de $i^*_t \\downarrow$ abaisse les taux d'intérêt nominaux et réels ($i^D_t - \\pi^e_t$).

2. **Relance de la demande globale (Courbe IS)** : Les taux d'intérêt réels plus bas stimulent le crédit, l'investissement et la consommation privée, augmentant ainsi l'écart de production (output gap $\\tilde{y}_t$) :
$$\\tilde{y}_t = \\rho \\tilde{y}_{t-1} - \\sigma (i^D_{t-1} - \\pi^e_{t-1}) + \\delta \\tilde{y}^*_t + u^y_t$$

3. **Création d'emplois (Loi d'Okun)** : Une hausse de l'activité réelle se transmet au marché de l'emploi en réduisant le taux de chômage $U_t$ sous son niveau naturel :
$$U_t = U^{naturel} - \\text{okunCoef} \\cdot \\tilde{y}_t$$

🏛️ *Recommandation de jeu :* Si l'output gap est inférieur à -1.5%, abaissez votre taux directeur pour relancer la machine. Cependant, si le ratio de créances en souffrance (NPL) dépasse **12.0%**, le canal du crédit se bloque : les banques refusent de prêter malgré la baisse des taux. Dans ce cas, activez en priorité l'**Emergency Lending** (Liquidités d'urgence).`
  }

  // C. Question sur le canal de transmission monétaire
  if (q.includes("transmission") || q.includes("canal de") || q.includes("comment se transmet") || q.includes("canaux")) {
    return `Gouverneur ${name}, la transmission de nos décisions de taux d'intérêt $i^*_t$ vers l'économie réelle s'opère par plusieurs canaux interdépendants :

1. **Le Canal des Taux d'Intérêt (Principal)** : Le taux directeur $i^*_t$ détermine le coût d'accès à la monnaie centrale pour les banques. Il se transmet au taux interbancaire ($i^{TMP}_t$), puis au taux débiteur ($i^D_t$) :
$$i^D_t = (1 - \\lambda) i^D_{t-1} + \\lambda (i^{TMP}_t + \\text{marge}) + \\text{RiskPremium}$$
Ce qui influence ensuite l'investissement et la demande via la courbe IS.

2. **Le Canal du Crédit (Bancaire)** : Un niveau élevé de créances en souffrance ($NPL_t > 12\\%$) augmente la prime de risque des banques, provoquant un rationnement quantitatif de l'offre de prêts :
$$\\Delta L_t = \\theta_0 + \\theta_1 \\tilde{y}_t - \\theta_2 i^D_t + \\theta_3 \\pi^e_t - \\text{Penalty}_{NPL}$$

3. **Le Canal des Anticipations (Forward Guidance)** : La simple annonce crédible d'une orientation de taux ($E_t[i_{t+k}]$) permet d'ancrer les attentes d'inflation à long terme $\\pi^e_t$ et de modifier les comportements de consommation.

4. **Le Canal du Taux de Change** : Les variations de notre taux nominal influencent les flux de capitaux financiers (entrées/sorties de devises) et affectent le niveau des réserves de change ($\\Delta FX_t$).`
  }

  // D. Question sur la sécheresse et chocs agricoles marocains
  if (q.includes("secheresse") || q.includes("agricole") || q.includes("agriculture") || q.includes("sans pluie") || q.includes("recolte")) {
    return `Gouverneur ${name}, le **secteur agricole** joue un rôle pivot dans l'économie marocaine et l'inflation globale. Face à une **sécheresse** ou à un choc de récolte ($s^{agri}_t > 0$), l'inflation s'envole via le canal de l'offre agroalimentaire :

$$\\pi_t = \\beta_{eff} \\cdot \\pi^e_t + \\kappa \\tilde{y}_t + \\alpha \\Delta p^{imp}_t + \\gamma s^{agri}_t + u^{\\pi}_t$$

Où $s^{agri}_t$ est la sévérité de la sécheresse et $\\gamma$ la sensibilité de l'inflation aux chocs agricoles.

🏛️ *Conseil de simulation :* Ce choc d'offre provoque de la stagflation (inflation en hausse, PIB en baisse). Si la hausse concerne uniquement les produits alimentaires volatils, évitez de sur-réagir en haussant trop brutalement le taux directeur pour ne pas étouffer davantage le PIB non agricole. Surveillez l'inflation sous-jacente (core) pour mesurer la contagion.`
  }

  // E. Question sur les interventions de change et devises / pass-through
  if (q.includes("intervention de change") || q.includes("devises") || q.includes("dirham") || q.includes("pass-through") || q.includes("cours de change") || q.includes("flotter")) {
    return `Gouverneur ${name}, les **interventions de change** (marché des devises) visent à réguler la volatilité du cours du Dirham et à sécuriser nos réserves de change. L'évolution de nos réserves de change $FX_t$ s'établit selon la règle :

$$\\Delta FX_t = CurrentAccount_t + CapitalFlows_t + FX_{interventions}$$

Le **pass-through de change** ($\\alpha$) transmet les variations du cours du dirham vers l'inflation par le biais du coût des importations énergétiques et industrielles ($\\Delta p^{imp}_t$).

🏛️ *Conseil de simulation :* Dans le scénario de *Flexibilisation progressive du Dirham*, les interventions de change vous permettent de calmer la dépréciation de notre monnaie nationale si le Dirham s'écarte trop de sa bande de fluctuation. Attention à vos réserves de change : veillez à maintenir au moins 5 à 6 mois d'importations pour préserver la crédibilité extérieure du Maroc.`
  }

  // F. Question sur la Forward Guidance & Communication
  if (q.includes("forward guidance") || q.includes("posture") || q.includes("hawkish") || q.includes("dovish") || q.includes("communiquer") || q.includes("communication")) {
    return `Gouverneur ${name}, la **Forward Guidance** est notre outil de communication pour orienter les attentes de taux d'intérêt à long terme des marchés financiers sans modifier le taux directeur actuel :

$$i^{long}_t = \\frac{1}{N} \\sum_{k=0}^{N-1} E_t[i_{t+k}] + \\text{TermPremium}_t$$

En adoptant une posture **Hawkish** (ton ferme laissant présager des hausses futures pour calmer l'inflation) ou **Dovish** (ton accommodant suggérant des baisses de taux futures pour soutenir l'activité), vous modifiez $E_t[i_{t+k}]$ et donc les taux d'intérêt de marché actuels.

🏛️ *Conseil de simulation :* Cet outil est d'autant plus efficace que la **crédibilité CBS** est élevée (> 80%). Si elle est trop basse (< 40%), vos annonces n'auront presque aucun impact sur les comportements des agents économiques.`
  }

  // G. Question sur les réserves obligatoires
  if (q.includes("reserve obligatoire") || q.includes("taux de reserve") || q.includes("reserves obligatoires")) {
    return `Gouverneur ${name}, le **taux de réserve obligatoire** est un instrument macroprudentiel classique de régulation directe de la liquidité bancaire. Il oblige les banques commerciales à conserver une fraction de leurs dépôts sous forme de dépôts non rémunérés auprès de la Centrale Bank Simulateur.

La croissance de l'offre de crédits bancaires $\\Delta L_t$ réagit négativement à la hausse du taux de réserve obligatoire :

$$\\Delta L_t = \\theta_0 + \\theta_1 \\tilde{y}_t - \\theta_2 i^D_t - \\theta_3 \\text{reserveRequirement}_t$$

🏛️ *Conseil de simulation :* Relever ce taux permet de ponctionner la liquidité du secteur bancaire pour freiner une distribution de crédit trop agressive qui alimenterait la surchauffe. Inversement, l'abaisser à 0% libère de la liquidité immédiate pour encourager les banques à prêter en période de récession.`
  }

  // H. Question sur l'Emergency Lending
  if (q.includes("emergency lending") || q.includes("lending") || q.includes("liquidite d'urgence") || q.includes("sauver les banques") || q.includes("faillite") || q.includes("bailout")) {
    return `Gouverneur ${name}, le dispositif de **Liquidité d'urgence** (Emergency Lending) permet à la Centrale Bank Simulateur d'agir en tant que *Prêteur en Dernier Ressort* en fournissant des liquidités immédiates aux banques solvables mais confrontées à une panique de liquidité.

Si le ratio de créances en souffrance dépasse $12\\%$, le canal du crédit subit une pénalité sévère bloquant le financement de l'économie réelle :

$$\\text{Penalty}_{NPL} = \\beta \\max(0, NPL_t - 12\\%)$$

L'activation de l'**Emergency Lending** permet d'injecter des fonds pour alléger cette contrainte de risque, soutenir le refinancement interbancaire et casser la spirale de dette-déflation.

🏛️ *Conseil de simulation :* N'utilisez cet outil qu'en cas de crise majeure (NPL > 12.0% ou spirale déflationniste), car une utilisation excessive ou préventive peut alimenter l'aléa moral chez les banques et nuire à votre score de stabilité financière.`
  }

  // I. Question sur les scénarios du simulateur
  if (q.includes("scenario") || q.includes("scenarios") || q.includes("covid") || q.includes("flexibilisation") || q.includes("standard")) {
    return `Gouverneur ${name}, notre simulateur propose **3 scénarios économiques** majeurs à explorer, chacun présentant des défis de politique monétaire distincts :

1. **Scénario Standard** : Calibré sur une croissance marocaine stable de 3.2% et une inflation moyenne de 1.8%. Idéal pour comprendre les bases de la règle de Taylor et les mécanismes de transmission usuels.
2. **Scénario Covid-19 & Choc d'offre (2022)** : Une récession brutale provoquée par des confinements doublée d'une explosion de l'inflation importée via les prix des produits énergétiques ($\\Delta p^{imp}_t$). C'est le test ultime de la politique monétaire face à la stagflation.
3. **Scénario de Flexibilisation du Dirham** : Transition vers un régime de change flottant. Le dirham fluctue librement, et le pass-through de change ($\\alpha$) transmet directement les chocs externes à l'inflation intérieure.

🏛️ *Conseil de simulation :* Adaptez vos instruments au scénario : la communication (Forward Guidance) est cruciale lors du choc d'offre, tandis que le coussin contracyclique (CCyB) et les interventions de change sont indispensables dans le cadre de la flexibilisation du Dirham.`
  }

  // J. Question sur la Centrale Bank Simulateur (CBS)
  if (q.includes("qui est cbs") || q.includes("centrale bank") || q.includes("cbs") || q.includes("banque centrale") || q.includes("role de la banque")) {
    return `Gouverneur ${name}, la **Centrale Bank Simulateur** (CBS) est la simulation de la Banque centrale du Royaume du Maroc, inspirée de Bank Al-Maghrib, instituée en 1959. Notre mission fondamentale, ancrée dans la loi statutaire, est de veiller à la **stabilité des prix** pour soutenir le développement économique harmonieux du Royaume.

Nos attributions majeures intègrent :
- La formulation et la mise en œuvre de la politique monétaire (taux directeur, réserves obligatoires).
- L'émission de la monnaie nationale (Dirham).
- La surveillance et la préservation de la stabilité financière (régulation macroprudentielle des banques).
- La gestion des réserves de change de l'État.

Le Conseil de la Banque, présidé par le Wali (Gouverneur), se réunit de façon trimestrielle pour évaluer la conjoncture et statuer sur les orientations de politique monétaire.`
  }

  // 1. Questions sur le pourquoi du conseil / Règle de Taylor (Bouton Détails Pop-it)
  if (q.includes("pourquoi") && (q.includes("taux") || q.includes("conseil") || q.includes("recommande") || q.includes("taylor"))) {
    if (state) {
      const { rStar, piTarget, phiPi, phiY } = PARAMS
      const { inflation, outputGap, policyRate } = state
      const target = computeTaylorRate(inflation, outputGap)
      const recommendedChangeBp = Math.max(-100, Math.min(100, Math.round(((target - policyRate) * 100) / 25) * 25))
      const direction = recommendedChangeBp > 0 ? "hausser" : recommendedChangeBp < 0 ? "baisser" : "maintenir"
      const amt = recommendedChangeBp !== 0 ? ` de ${Math.abs(recommendedChangeBp)} pb` : ""

      return `Gouverneur ${name}, ma recommandation de **${direction} le taux directeur${amt}** s'appuie sur la **règle de Taylor** calibrée pour l'économie marocaine :

$$i^*_t = r^* + \\pi^* + \\phi_\\pi (\\pi_t - \\pi^*) + \\phi_y \\tilde{y}_t$$

En remplaçant par les données réelles du trimestre courant (Trimestre T${state.quarter + 1}) :
- Taux réel neutre ($r^*$) : $1.50\\%$
- Cible d'inflation ($\\pi^*$) : $2.00\\%$
- Inflation observée ($\\pi_t$) : $${inflation.toFixed(2)}\\%$
- Écart de production ($\\tilde{y}_t$) : $${outputGap.toFixed(2)}\\%$
- Sensibilité inflation ($\\phi_\\pi$) : $1.50$ (respect du principe de Taylor)
- Sensibilité croissance ($\\phi_y$) : $0.50$

Le calcul détaillé s'établit comme suit :
$$i^*_t = 1.50 + 2.00 + 1.50 \\cdot (${inflation.toFixed(2)} - 2.00) + 0.50 \\cdot (${outputGap.toFixed(2)})$$
$$i^*_t = ${target.toFixed(2)}\\%$$

Puisque le taux directeur actuel est à **${policyRate.toFixed(2)}%**, la formule théorique indique un taux optimal de **${target.toFixed(2)}%** (soit un écart de **${(target - policyRate).toFixed(2)} pp** ou **${Math.round((target - policyRate) * 100)} pb**). Ce resserrement ou assouplissement est fondamental pour ramener l'économie vers l'équilibre.`
    }
  }

  // 2. Questions sur le bilan de mandat ou score en direct
  if (q.includes("score") || q.includes("performance") || q.includes("mon bilan") || q.includes("note") || q.includes("evaluer") || q.includes("gagner") || q.includes("grade") || q.includes("objectif")) {
    let scoreFormula = `$$S_{global} = 0.35 \\cdot S_{inflation} + 0.25 \\cdot S_{croissance} + 0.20 \\cdot S_{stabilite} + 0.20 \\cdot S_{credibilite}$$`
    
    if (state) {
      return `Gouverneur ${name}, analysons la situation courante de votre barème :

${scoreFormula}

Indicateurs actuels :
- **Inflation (35%)** : ${state.inflation.toFixed(2)}% (cible: 2.0%) — pèse pour 35% sur le barème.
- **Écart de production (25%)** : ${state.outputGap.toFixed(2)}% (cible: 0.0%) — représente 25%.
- **Crédibilité CBS (20%)** : ${state.centralBankCredibility.toFixed(1)}/100 — représente 20%.
- **Créances bancaires (NPL) (20%)** : ${state.nplRatio.toFixed(2)}% — influe directement sur la stabilité financière (20%).

Veillez à préserver l'équilibre général de ces indicateurs pour maintenir une note globale optimale (Grade A).`
    }
    return `Votre notation finale (de A à D) dépend de la formule de score pondérée :

${scoreFormula}

Où les objectifs sont :
1. Stabiliser l'inflation ($S_{inflation}$) au plus près de $2.0\\%$.
2. Maximiser la croissance durable ($S_{croissance}$) en limitant les écarts de production.
3. Garantir la stabilité financière ($S_{stabilite}$) en maintenant les NPL sous $8.0\\%$.
4. Renforcer la réputation CBS ($S_{credibilite}$) au-dessus de $80\\%$.`
  }

  if (q.includes("comment va l'economie") || q.includes("etat des lieux") || q.includes("analyse") || q.includes("rapport") || q.includes("situation")) {
    if (state) {
      const infDiff = Math.abs(state.inflation - 2.0)
      const infStatus = infDiff <= 0.5 ? "parfaitement stabilisée autour de notre cible de 2.0%" 
                        : state.inflation > 2.0 ? "trop élevée (pressions inflationnistes)" 
                        : "basse (risque de déflation)"
      
      const gapStatus = state.outputGap < -1.0 ? "en sous-régime ( output gap négatif )" 
                        : state.outputGap > 1.0 ? "en surchauffe d'activité ( output gap positif )" 
                        : "équilibrée et stable"

      const nplStatus = state.nplRatio > 12 ? "bloquée par un crédit crunch critique"
                        : state.nplRatio > 8 ? "sous vigilance financière"
                        : "saine"

      return `Voici mon diagnostic complet pour ce trimestre T${state.quarter + 1} (${state.date.year} Q${state.date.q}), Gouverneur ${name} :
- **Inflation** : Elle s'affiche à **${state.inflation.toFixed(2)}%** et se trouve ${infStatus}.
- **Activité réelle** : L'économie est ${gapStatus} avec un Output Gap de **${state.outputGap.toFixed(2)}%** et une croissance du PIB de **${state.gdpGrowth.toFixed(2)}%**.
- **Canal de transmission** : Le ratio de NPL est à **${state.nplRatio.toFixed(2)}%** (situation ${nplStatus}).
- **Réputation** : La crédibilité de la Banque centrale est à **${state.centralBankCredibility.toFixed(1)}%**.

Pour rappel, l'inflation $\\pi_t$ répond à l'output gap $\\tilde{y}_t$ via la courbe de Phillips, tandis que l'activité réelle $\\tilde{y}_t$ s'ajuste au taux d'intérêt réel $i^D_{t-1} - \\pi^e_{t-1}$ via la courbe IS.

${state.inflation > 2.5 
  ? "🏛️ Conseil de pilotage : Relever modérément le taux directeur permettrait d'apaiser l'inflation à un horizon de 2-3 trimestres." 
  : state.outputGap < -1.5 
    ? "🏛️ Conseil de pilotage : Une baisse de taux stimulerait l'investissement et réduirait l'écart de production." 
    : "🏛️ Conseil de pilotage : La situation globale est stable, évitez les ajustements brusques qui perturberaient les anticipations."}`
    }
  }

  // 3. Recherche sémantique dans le glossaire avec LaTeX
  const matchedTerm = ECONOMIC_GLOSSARY.find(term => 
    term.keywords.some(keyword => q.includes(keyword))
  )

  if (matchedTerm) {
    let response = `### **${matchedTerm.name}**\n\n`
    response += `${matchedTerm.definition}\n\n`
    if (matchedTerm.formula) {
      response += `**Règle mathématique associée :**\n$$${matchedTerm.formula}$$\n\n`
    }
    response += `🏛️ *Conseil de simulation :* ${matchedTerm.gameTip}\n\n`

    // Injection des données réelles si disponibles
    if (state) {
      let liveVal = ""
      if (matchedTerm.name.includes("Taux directeur")) {
        liveVal = `**${state.policyRate.toFixed(2)}%** (Taux moyen pondéré courant)`
      } else if (matchedTerm.name.includes("Inflation")) {
        liveVal = `**${state.inflation.toFixed(2)}%** (Inflation sous-jacente : **${state.inflationCore.toFixed(2)}%**)`
      } else if (matchedTerm.name.includes("Créances")) {
        liveVal = `**${state.nplRatio.toFixed(2)}%**`
      } else if (matchedTerm.name.includes("Écart")) {
        liveVal = `**${state.outputGap.toFixed(2)}%**`
      } else if (matchedTerm.name.includes("Coussin")) {
        liveVal = `**${state.reserveRequirement.toFixed(2)}%** (Taux de réserve obligatoire actuel)`
      } else if (matchedTerm.name.includes("Crédibilité")) {
        liveVal = `**${state.centralBankCredibility.toFixed(1)}/100**`
      } else if (matchedTerm.name.includes("Change")) {
        liveVal = `**${state.exchangeRate.toFixed(1)}** (Avoir de change : **${state.currentAccountBalance.toFixed(2)}%** du PIB)`
      }

      if (liveVal) {
        response += `📊 *Données en temps réel (Trimestre T${state.quarter + 1}) :* Cet indicateur affiche actuellement ${liveVal} sur votre tableau de bord.`
      }
    }
    return response
  }

  // 4. Cas des chocs macroéconomiques
  if (q.includes("choc") || q.includes("shock") || q.includes("crise") || q.includes("secheresse") || q.includes("petrole")) {
    return `Gouverneur ${name}, les chocs perturbent profondément les équilibres macroéconomiques et imposent des arbitrages stricts :

1. **Choc de demande** (ex. crise sanitaire, baisse des exportations) : La croissance et l'inflation chutent de concert.
$$\\tilde{y}_t = \\rho \\tilde{y}_{t-1} - \\sigma (i^D_{t-1} - \\pi^e_{t-1}) + \\delta \\tilde{y}^*_t + u^y_t$$
Avec un choc négatif $u^y_t < 0$, l'activité s'effondre. Une baisse agressive du taux directeur permet d'atténuer le choc en relançant le crédit et l'investissement.

2. **Choc d'offre** (ex. flambée du pétrole, sécheresse affectant l'agriculture marocaine) : C'est le dilemme de politique monétaire par excellence (stagflation).
$$\\pi_t = \\beta_{eff} \\cdot \\pi^e_t + \\kappa \\tilde{y}_t + \\alpha \\Delta p^{imp}_t + \\gamma s^{agri}_t + u^{\\pi}_t$$
Avec un choc d'offre $u^{\\pi}_t > 0$ ou un choc agricole $s^{agri}_t > 0$, l'inflation s'envole tandis que le PIB se contracte. Augmenter le taux directeur lutte contre l'inflation mais aggrave la récession. Nous vous conseillons de surveiller l'inflation core (sous-jacente) pour agir sans briser la croissance.`
  }

  // 5. Conseils de jeu génériques
  if (q.includes("bon choix") || q.includes("quoi faire") || q.includes("aide") || q.includes("comment gagner") || q.includes("hint") || q.includes("conseil")) {
    if (state) {
      const tips = getSimulationTips({
        inflation: state.inflation,
        outputGap: state.outputGap,
        nplRatio: state.nplRatio,
        policyRate: state.policyRate,
        creditGrowth: state.creditGrowth,
        centralBankCredibility: state.centralBankCredibility,
        quarter: state.quarter
      }, 'intermediate')
      if (tips.length > 0) {
        return `Voici mes recommandations d'action pour ce trimestre, Gouverneur ${name} :\n` + tips.map(t => `- ${t}`).join('\n')
      }
    }
    return `Gouverneur ${name}, gardez à l'esprit ces 3 règles d'or :
1. Visez l'inflation cible de **2.0%** (poids important de 35% de la note).
2. Tentez de maintenir l'output gap proche de **0.0%** pour stabiliser la croissance.
3. Modifiez vos taux directeurs par petites touches (paliers de 25 points de base) pour ne pas désorienter les marchés financiers.`
  }

  // K. Question sur le fonctionnement et la présentation du site
  if (q.includes("parle moi du site") || q.includes("fonctionnement du site") || q.includes("a quoi sert") || q.includes("but du site") || q.includes("c'est quoi ce site") || q.includes("comment jouer") || q.includes("que faire") || q.includes("guide") || q.includes("tutoriel") || q.includes("tuto") || q.includes("presentation")) {
    return `Gouverneur ${name}, la **Centrale Bank Simulateur** (CBS) est une plateforme éducative et immersive premium conçue pour vous mettre dans la peau du Wali (Gouverneur) de la banque centrale.

Le site s'articule autour de 3 grands espaces interactifs :

1. 📚 **Les Cours** : 8 chapitres didactiques pour maîtriser la macroéconomie moderne (Règle de Taylor, Courbe de Phillips, Courbe IS, Canaux de transmission, Stabilité financière).
2. 🏛️ **L'Entraînement** : Un laboratoire macro et des campagnes historiques pour pratiquer et tester vos connaissances dans des contextes variés.
3. 🎮 **La Simulation** : Un simulateur dynamique où vous prenez des décisions trimestrielles réelles face à des chocs économiques.

🏛️ *Astuce de navigation :* Si vous débutez, je vous conseille de parcourir les premiers chapitres de cours, puis de lancer le scénario *Standard* en mode Débutant. Le bouton **Assistant** au sommet du panneau de décision est là à tout moment pour vous suggérer le taux directeur optimal issu de la règle de Taylor !`
  }

  // L. Question sur les cours, leçons et chapitres théoriques
  if (q.includes("cours") || q.includes("lecon") || q.includes("chapitre") || q.includes("module") || q.includes("apprendre") || q.includes("enseigner") || q.includes("theorie") || q.includes("syllabus") || q.includes("etudier")) {
    return `Gouverneur ${name}, notre programme de formation macroéconomique comporte **8 modules fondamentaux** pour appréhender le fonctionnement de la politique monétaire au Maroc. Voici le syllabus complet :

1. 📔 **Introduction au Mandat** : Comprendre le rôle constitutionnel de la Centrale Bank Simulateur et notre cible d'inflation stabilisée à $2.0\%$.
2. 🔑 **Le Taux Directeur** : Analyser le principal outil opérationnel et ses délais de transmission à l'économie réelle (2 à 3 trimestres).
3. 📈 **La Courbe IS (Demande globale)** : Étudier la sensibilité de la demande globale au taux d'intérêt réel :
   $$\\tilde{y}_t = \\rho \\tilde{y}_{t-1} - \\sigma (i^D_{t-1} - \\pi^e_{t-1}) + \\delta \\tilde{y}^*_t + u^y_t$$
4. 📊 **La Courbe de Phillips (Offre et Prix)** : Comprendre le lien entre l'activité réelle, l'inflation sous-jacente et les chocs agricoles :
   $$\\pi_t = \\beta_{eff} \\cdot \\pi^e_t + \\kappa \\tilde{y}_t + \\alpha \\Delta p^{imp}_t + \\gamma s^{agri}_t + u^{\\pi}_t$$
5. 🔄 **Les Canaux de Transmission** : Explorer comment une hausse de taux affecte l'activité via les canaux du taux d'intérêt, du crédit, des anticipations et du change.
6. 🎯 **La Règle de Taylor** : Découvrir la formule théorique qui sert de boussole au pilotage du taux directeur face à l'inflation et au gap de production.
7. ⚡ **Les Chocs Macroéconomiques** : Maîtriser l'arbitrage complexe face aux chocs de demande et aux chocs d'offre stagflationnistes.
8. 🛡️ **Stabilité Financière & Macroprudentiel** : Appréhender les cercles vicieux dette-déflation, le ratio de créances en souffrance (NPL) et l'activation du coussin contracyclique (CCyB).

🏛️ *Conseil de Gouvernance :* Toutes ces théories sont appliquées en temps réel dans notre moteur de simulation. L'étude approfondie de ces chapitres de cours est votre meilleur atout pour obtenir la note maximale (Grade A) !`
  }

  if (q.includes("merci") || q.includes("merci beaucoup") || q.includes("thanks") || q.includes("cool") || q.includes("parfait") || q.includes("super")) {
    return `À votre entière disposition, Gouverneur ${name}. C'est un honneur de contribuer à la réussite de votre mandat.`
  }

  if (q.includes("bonjour") || q.includes("salut") || q.includes("hello") || q.includes("coucou") || q.includes("ca va") || q.includes("hey") || q.includes("hi")) {
    return `Bonjour Gouverneur ${name}. Je me tiens prêt à analyser la conjoncture macroéconomique avec vous.`
  }

  // Fallback général
  return `Je prends note de votre question, Gouverneur ${name}.

Pour obtenir des informations détaillées avec leurs formules scientifiques et des recommandations pratiques, essayez de taper des mots clés simples comme : **Taux directeur**, **Inflation**, **NPL**, **Output Gap**, **CCyB**, **Crédibilité** ou **Réserves de change**.`
}

