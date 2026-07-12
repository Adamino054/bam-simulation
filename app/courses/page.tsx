'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Landmark, Percent, TrendingUp, Activity, Network,
  Calculator, Zap, Shield, ChevronDown, ChevronRight,
  BookOpen, CheckCircle2, Circle, ArrowLeft, Lightbulb,
  FlaskConical, Gamepad2, GraduationCap, BarChart2,
  Award, Sparkles, FileText, Check
} from 'lucide-react'
import { ThemeToggle } from '@/components/shell/ThemeToggle'
import { BlockKatex, LatexText } from '@/components/ui/InlineKatex'
import {
  ScoreBreakdown, TransmissionChain, ISCurveDiagram,
  PhillipsCurveDiagram, ChannelsDiagram, TaylorRuleChart,
  ShockMatrix, NplRiskZones,
} from '@/components/ui/CourseDiagrams'
import { QuizCard } from '@/components/ui/QuizCard'
import { NotePad } from '@/components/ui/NotePad'
import { BadgeDisplay } from '@/components/ui/BadgeDisplay'
import { useAuthStore } from '@/store/authStore'
import { getQuiz } from '@/engine/quizzes'
import { BADGES, checkBadgeEligibility } from '@/engine/badges'
import { AssistantBot } from '@/components/ui/AssistantBot'
import { COURSE_MESSAGES } from '@/engine/botMessages'
import type { DifficultyLevel } from '@/engine/difficulty'

// ── Types ────────────────────────────────────────────────────────────────────
interface Module {
  id: string
  number: string
  title: string
  subtitle: string
  category: string
  categoryColor: string
  readTime: string
  icon: React.ElementType
  overview: string
  keyPoints: string[]
  formula?: { latex: string; legend: string[] }
  moroccanExample: string
  gameTip: string
  diagram?: React.ComponentType
}

// ── Module data ──────────────────────────────────────────────────────────────
const MODULES: Module[] = [
  {
    id: 'intro',
    number: '01',
    title: 'La Politique Monétaire',
    subtitle: 'Le mandat de la Banque centrale',
    category: 'Fondamentaux',
    categoryColor: '#5C7E92',
    readTime: '5 min',
    icon: Landmark,
    overview:
      "La politique monétaire est l'ensemble des décisions par lesquelles une banque centrale contrôle la masse monétaire et les taux d'intérêt pour atteindre ses objectifs macroéconomiques. La Banque centrale du Maroc a pour mandat principal d'assurer la stabilité des prix — définie par une inflation proche de 2 % par an — tout en soutenant la croissance économique.",
    keyPoints: [
      "La Banque centrale opère en indépendance vis-à-vis du gouvernement pour éviter les biais inflationnistes politiques (pression à des taux trop bas avant les élections).",
      "La stabilité des prix est la condition préalable à une croissance durable : une inflation trop élevée érode le pouvoir d'achat et décourage l'investissement.",
      "La Banque centrale dispose d'un double mandat implicite : stabilité des prix (priorité) + soutien à la croissance (objectif secondaire).",
      "La crédibilité est cruciale : si les agents économiques croient que la Banque centrale tiendra sa cible, ils n'augmentent pas leurs prix par anticipation — réduisant ainsi le coût de la désinflation.",
    ],
    moroccanExample:
      "En 2022, face à une inflation de 6,1 % — son plus haut niveau depuis 30 ans — la Banque centrale a relevé son taux directeur de 1,5 % à 3,0 % en deux étapes (septembre 2022 et mars 2023). Cette décision tardive, après des années de politique accommodante, a eu un coût en crédibilité.",
    gameTip:
      "Votre score final est calculé à 35 % sur l'inflation, 25 % sur la croissance et 20 % sur la crédibilité. La stabilité des prix est l'objectif central — mais sacrifier entièrement la croissance pour atteindre 2 % n'est pas optimal.",
    diagram: ScoreBreakdown,
  },
  {
    id: 'policy-rate',
    number: '02',
    title: 'Le Taux Directeur',
    subtitle: 'Transmission et effets sur l\'économie',
    category: 'Instruments',
    categoryColor: '#B41923',
    readTime: '6 min',
    icon: Percent,
    overview:
      "Le taux directeur (i*) est le principal levier de la politique monétaire. C'est le taux auquel la banque centrale prête aux banques commerciales pour leurs besoins de liquidité au jour le jour. Il influence en cascade tous les autres taux de l'économie : du taux interbancaire (TMP) aux crédits immobiliers, en passant par les obligations d'État.",
    keyPoints: [
      "La chaîne de transmission : i* → TMP (taux interbancaire) → i^D (taux débiteur) → Crédit → Investissement → Output gap → Inflation.",
      "La transmission est lente : un changement de taux prend 2 à 4 trimestres pour pleinement impacter l'inflation. Il faut anticiper.",
      "La Borne Zéro (Zero Lower Bound) : le taux directeur ne peut pas descendre en dessous de ~0,5 %. En-dessous, les banques préfèrent stocker du cash.",
      "Des changements trop fréquents et contradictoires nuisent à la crédibilité (signal de confusion dans la stratégie).",
    ],
    formula: {
      latex: 'i^{TMP}_t = i^*_t + \\text{pression liquidité}',
      legend: [
        '$i^*_t$ = taux directeur fixé par la Banque centrale',
        '$i^{TMP}_t$ = taux du marché monétaire (interbancaire, TMP)',
        '$\\lambda$ = vitesse de transmission $TMP \\to$ taux débiteur ($\\approx 0{,}35$ au Maroc)',
      ],
    },
    moroccanExample:
      "En juin 2020, la Banque centrale a baissé son taux de 2,25 % à 1,5 % — son plus bas historique — pour soutenir l'économie face à la pandémie. En septembre 2022, le cycle s'est inversé avec une première hausse à 2,0 % pour lutter contre l'inflation importée. La borne basse effective au Maroc est estimée à 0,5 %.",
    gameTip:
      "Dans le simulateur, chaque variation de taux se fait par pas de 25 points de base (0,25 %). Les effets sur l'output gap et l'inflation apparaissent avec un décalage d'1 à 2 trimestres. Anticipez toujours 2 trimestres en avance.",
    diagram: TransmissionChain,
  },
  {
    id: 'is-curve',
    number: '03',
    title: 'Courbe IS & Output Gap',
    subtitle: 'La demande agrégée et le cycle économique',
    category: 'Modèles',
    categoryColor: '#4A9D7C',
    readTime: '8 min',
    icon: TrendingUp,
    overview:
      "L'output gap ($ỹ_t$) mesure l'écart entre le PIB réel observé et le PIB potentiel de l'économie. Un output gap positif (surchauffe) génère des pressions inflationnistes ; un gap négatif (sous-utilisation) crée un risque de déflation et de chômage élevé. La courbe IS décrit comment le taux d'intérêt réel détermine cet output gap.",
    keyPoints: [
      "$\\sigma = 0{,}12$ : sensibilité au taux réel — faible au Maroc car le capital est peu mobile et les entreprises dépendent peu du financement externe.",
      "$\\rho = 0{,}70$ : persistance du cycle — l'économie ne retourne pas immédiatement à son potentiel après un choc.",
      "$\\delta = 0{,}30$ : degré d'ouverture — le Maroc dépend significativement de la demande européenne (tourisme, IDE, transferts).",
      "Le taux réel $r_t = i^D_t - \\pi^e_t$. Si l'inflation monte, le taux réel baisse et stimule la demande même sans baisser $i^*_t$.",
    ],
    formula: {
      latex: '\\tilde{y}_t = \\rho\\cdot\\tilde{y}_{t-1} - \\sigma(i^D_t - \\pi^e_t) + \\delta\\cdot\\tilde{y}^*_t + u^y_t',
      legend: [
        '$ỹ_t$ = output gap (% du PIB potentiel)',
        '$\\rho$ = persistance cyclique ($0{,}70$)',
        '$\\sigma$ = sensibilité au taux réel ($0{,}12$)',
        '$\\delta$ = ouverture commerciale ($0{,}30$)',
        '$ỹ^*_t$ = output gap de la zone euro (demande externe)',
        '$u^y_t$ = chocs de demande actifs',
      ],
    },
    moroccanExample:
      "En 2020, l'output gap marocain a plongé à −4 % du PIB potentiel, causé par la fermeture du tourisme (8 % du PIB), l'effondrement des transferts MRE et la récession européenne. La réponse de la Banque centrale (baisse de 75 bp + emergency lending 120 mds MAD) a contribué à ramener l'output gap à −1,5 % en 2021.",
    gameTip:
      "Regardez l'output gap comme un thermomètre de tension économique. En dessous de −1,5 % : relâchez les taux pour éviter la spirale déflationniste. Au-dessus de +1,5 % : resserrez avant que l'inflation ne s'emballe. La diagonale entre −1,5 % et +1,5 % est votre 'zone verte'.",
    diagram: ISCurveDiagram,
  },
  {
    id: 'phillips',
    number: '04',
    title: 'Courbe de Phillips',
    subtitle: 'La relation inflation-activité économique',
    category: 'Modèles',
    categoryColor: '#4A9D7C',
    readTime: '7 min',
    icon: Activity,
    overview:
      "La courbe de Phillips, dans sa version néo-keynésienne, établit que l'inflation dépend des anticipations des agents économiques ($\\beta$), de la pression de la demande ($\\kappa \\cdot ỹ_t$), des mouvements du taux de change ($\\alpha \\cdot \\Delta e_t$) et des chocs d'offre (agricoles, pétroliers). Ce modèle capture les deux grandes sources d'inflation au Maroc : la demande et l'offre.",
    keyPoints: [
      "$\\beta \\approx 0{,}95$ : les anticipations d'inflation sont le facteur dominant (critique de Lucas). Si les agents anticipent $4 \\%$, l'inflation sera proche de $4 \\%$ même sans surchauffe.",
      "$\\kappa = 0{,}15$ : chaque point d'output gap génère $+0{,}15$ pt d'inflation. La relation est modérée au Maroc (marchés peu concurrentiels).",
      "$\\alpha = 0{,}08$ : le pass-through taux de change $\\to$ inflation est faible sous le régime de quasi-parité dirham/euro-dollar.",
      "$\\gamma = 0{,}20$ : les chocs agricoles ont un fort impact (l'agriculture représente $>10 \\%$ du PIB marocain et une part élevée du panier IPC).",
    ],
    formula: {
      latex: '\\pi_t = \\beta\\cdot\\pi^e_t + \\kappa\\cdot\\tilde{y}_t + \\alpha\\cdot\\Delta e_t + \\gamma\\cdot u^{agri}_t + u^{offre}_t',
      legend: [
        '$\\pi_t$ = inflation (% annuel)',
        '$\\pi^e_t$ = anticipations d\'inflation',
        '$\\beta$ = poids des anticipations ($0{,}95$)',
        '$\\kappa$ = sensibilité à l\'output gap ($0{,}15$)',
        '$\\alpha$ = pass-through taux de change ($0{,}08$)',
        '$\\gamma$ = sensibilité agricole ($0{,}20$)',
      ],
    },
    moroccanExample:
      "En 2022, l'inflation marocaine de 6,1 % s'expliquait par : choc pétrolier (+2,2 pp via u^offre), pass-through des prix importés (+α·Δe ≈ +0,8 pp), sécheresse agricole (γ ≈ +0,6 pp), et demande post-COVID (κ·ỹ > 0). Les anticipations se sont progressivement désancrées (+β).",
    gameTip:
      "La courbe de Phillips crée le dilemme fondamental du jeu : baisser l'inflation impose un output gap négatif (récession partielle). Face à un choc d'offre (pétrole, sécheresse), ne sur-réagissez pas — resserrer fortement ne fait qu'aggraver la récession sans réduire un choc temporaire.",
    diagram: PhillipsCurveDiagram,
  },
  {
    id: 'channels',
    number: '05',
    title: 'Canaux de Transmission',
    subtitle: 'Les 4 mécanismes d\'action de la politique monétaire',
    category: 'Mécanismes',
    categoryColor: '#C9A86A',
    readTime: '9 min',
    icon: Network,
    overview:
      "La politique monétaire ne touche pas directement les prix — elle agit via 4 canaux de transmission distincts. Comprendre ces canaux permet d'utiliser les bons instruments au bon moment et d'anticiper les effets secondaires de chaque décision.",
    keyPoints: [
      "Canal des taux d'intérêt : $i^*_t \\uparrow \\implies TMP \\uparrow \\implies i^D_t \\uparrow \\implies$ Crédit plus cher $\\implies$ Investissement $\\downarrow \\implies$ Output gap $ỹ_t \\downarrow \\implies$ Inflation $\\pi_t \\downarrow$. C'est le canal principal.",
      "Canal du crédit : des taux élevés augmentent les $NPL$ (créances douteuses), ce qui pousse les banques à rationner le crédit indépendamment du taux directeur. C'est le canal Mishkin.",
      "Canal des anticipations : si la Banque centrale est crédible, une simple communication hawkish suffit à ancrer les anticipations à $2 \\%$ — sans même bouger le taux. C'est le canal de Forward Guidance.",
      "Canal du taux de change : hausse de $i^*_t \\implies$ entrées de capitaux étrangers $\\implies$ appréciation du dirham $\\implies$ importations moins chères $\\implies$ inflation importée $\\downarrow$. Pertinent au Maroc avec sa politique de change géré.",
    ],
    moroccanExample:
      "L'expérience 2022-2023 a montré les limites du canal des taux au Maroc : les banques ont tardé à répercuter les hausses de la Banque centrale sur les taux débiteurs (λ = 0,35 seulement). La Banque centrale a compensé via le canal des anticipations — en signalant clairement sa détermination à lutter contre l'inflation.",
    gameTip:
      "La Communication (Forward Guidance) est votre 4e instrument gratuit dans le simulateur. Un signal 'hawkish' réduit l'output gap via le canal des anticipations sans modifier le taux directeur — utile quand vous voulez peser sur l'inflation sans écraser la croissance.",
    diagram: ChannelsDiagram,
  },
  {
    id: 'taylor',
    number: '06',
    title: 'La Règle de Taylor',
    subtitle: 'Stratégie optimale de politique monétaire',
    category: 'Stratégie',
    categoryColor: '#C9A86A',
    readTime: '6 min',
    icon: Calculator,
    overview:
      "Proposée par John Taylor en 1993, cette règle donne le taux directeur 'optimal' en fonction de l'écart d'inflation à la cible et de l'output gap. Elle sert de référence normative pour évaluer si une banque centrale est trop accommodante (taux trop bas) ou trop restrictive (taux trop haut). Dans le simulateur, votre performance est comparée à ce taux de Taylor calculé à chaque trimestre.",
    keyPoints: [
      "$r^* = 1{,}5 \\%$ : taux réel neutre estimé pour le Maroc (ni stimulant ni restrictif).",
      "$\\phi_\\pi = 1{,}5$ : coefficient sur l'écart d'inflation. Il doit être $> 1$ (principe de Taylor) pour que le taux réel monte effectivement quand l'inflation augmente.",
      "$\\phi_y = 0{,}5$ : réponse à l'output gap — plus faible que la réponse à l'inflation, reflétant la priorité à la stabilité des prix.",
      "Le 'Coin de Taylor' : si votre taux diverge trop du taux de Taylor (> 1,5 pp), vous risquez soit une surchauffe, soit une récession inutile.",
    ],
    formula: {
      latex: "i^*_{Taylor} = r^* + \\pi^* + \\phi_\\pi(\\pi_t - \\pi^*) + \\phi_y \\cdot \\tilde{y}_t",
      legend: [
        "$r^*$ = taux réel neutre ($1{,}5 \\%$)",
        "$\\pi^*$ = cible d'inflation ($2{,}0 \\%$)",
        "$\\phi_\\pi$ = réponse à l'écart d'inflation ($1{,}5$)",
        "$\\phi_y$ = réponse à l'output gap ($0{,}5$)",
      ],
    },
    moroccanExample:
      "En 2022, avec π = 6,1 % et ỹ ≈ 0,5 %, la règle de Taylor prescrivait : i* = 1,5 + 2,0 + 1,5×(6,1−2,0) + 0,5×0,5 ≈ 9,9 %. La Banque centrale n'est montée qu'à 3 % — justifié par la structure de financement des entreprises marocaines (très sensibles aux taux) et la faiblesse du marché obligataire.",
    gameTip:
      "Dans l'écran de débrief, vous voyez votre taux moyen vs le taux de Taylor. Un écart négatif persistant (trop accommodant) génère presque toujours une inflation au-dessus de la cible. Utilisez la règle de Taylor comme boussole, pas comme contrainte stricte.",
    diagram: TaylorRuleChart,
  },
  {
    id: 'shocks',
    number: '07',
    title: 'Les Chocs Macroéconomiques',
    subtitle: 'Naviguer dans l\'incertitude',
    category: 'Scénarios',
    categoryColor: '#C25450',
    readTime: '7 min',
    icon: Zap,
    overview:
      "L'économie marocaine est particulièrement exposée aux chocs exogènes en raison de sa dépendance aux importations d'énergie, à l'agriculture pluviale et à la demande européenne. Ces chocs perturbent simultanément l'offre, la demande et l'inflation — créant des dilemmes complexes pour le banquier central qui ne peut généralement agir que sur un côté à la fois.",
    keyPoints: [
      "Choc d'offre négatif (pétrole, sécheresse) : inflation $\\pi_t \\uparrow$ ET croissance $g_t \\downarrow$ — le pire des cas. Faut-il resserrer (inflation) ou assouplir (croissance) ? Réponse : mesure, pas sur-réaction.",
      "Choc de demande négatif (récession zone euro, COVID) : inflation $\\pi_t \\downarrow$ ET croissance $g_t \\downarrow$ — réponse dovish claire. Baissez les taux et activez l'emergency lending.",
      "Choc financier (fuite des capitaux, prime de risque) : hausse des taux débiteurs indépendamment de $i^*_t$ — utilisez les réserves de change et l'intervention FX.",
      "Les chocs durent 2 à 6 trimestres dans le simulateur. L'inflation core (hors volatile) est votre meilleur indicateur de la tendance fondamentale.",
    ],
    moroccanExample:
      "La sécheresse historique de 2022 a réduit la valeur ajoutée agricole de −14,6 %, impactant 35 % de la population active rurale. Simultanément, les prix pétroliers ont bondi de +60 % suite à la guerre en Ukraine. La Banque centrale a dû gérer un choc d'offre double — le pire scénario.",
    gameTip:
      "Face à un choc d'offre (pétrole, sécheresse), regardez l'inflation core — si elle reste ancré proche de 2 %, le choc est probablement temporaire et ne justifie pas un resserrement agressif. Un resserrement excessif sur un choc temporaire coûte 1-2 points de croissance inutilement.",
    diagram: ShockMatrix,
  },
  {
    id: 'financial-stability',
    number: '08',
    title: 'Stabilité Financière',
    subtitle: 'Macroprudentiel, NPL et risques systémiques',
    category: 'Avancé',
    categoryColor: '#5C7E92',
    readTime: '8 min',
    icon: Shield,
    overview:
      "La politique macroprudentielle vise à prévenir les risques systémiques — ceux qui menacent l'ensemble du système financier, pas seulement une banque isolée. La Banque centrale surveille les créances en souffrance ($NPL$), la croissance du crédit, et peut activer le coussin contracyclique ($CCyB$) pour préparer le système bancaire aux crises futures.",
    keyPoints: [
      "$NPL$ (Non-Performing Loans) : au-delà de $10\\% - 12\\%$, les banques commencent à rationner le crédit même si le taux directeur est bas — le canal du crédit est bloqué.",
      "$CCyB$ (Coussin Contracyclique) : constituer des réserves en période de boom (quand le crédit croît trop vite) pour les libérer en période de crise.",
      "Piège de la Dette-Déflation (Irving Fisher, 1933) : déflation ($\\pi_t < 0$) + $NPL$ élevés $\\implies$ dette réelle s'alourdit $\\implies$ crédit se contracte $\\implies$ récession $\\implies$ déflation.",
      "La Borne Zéro (ZLB) : quand le taux est à $0{,}5 \\%$ et l'inflation est négative, le taux réel monte automatiquement — paradoxe déflationniste. Seul l'Emergency Lending permet de briser la spirale.",
    ],
    moroccanExample:
      "Le ratio NPL marocain a atteint 8,9 % en 2023 (vs 7,5 % en 2019), principalement dans le segment PME post-COVID. La Banque centrale a activé des moratoires et des garanties de l'État pour éviter que les NPL ne dépassent le seuil critique de 12 % qui aurait déclenché un credit crunch.",
    gameTip:
      "Dans le simulateur, si votre NPL dépasse 12 % ET l'inflation devient négative simultanément, vous êtes dans le 'Piège de la Dette-Déflation' — une alerte rouge apparaîtra. Activez l'Emergency Lending (10-20 mds MAD) immédiatement pour recapitaliser le système. Ne baissez plus le taux directeur — il est déjà inefficace.",
    diagram: NplRiskZones,
  },
]

// ── Category badge ────────────────────────────────────────────────────────────
function CategoryBadge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
      style={{ backgroundColor: `${color}18`, color, fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}
    >
      <span style={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: color, display: 'inline-block' }} />
      {label}
    </span>
  )
}

// ── Module card (accordion) ───────────────────────────────────────────────────
// ── Module card (accordion) ───────────────────────────────────────────────────
function ModuleCard({ mod, isOpen, onToggle, isCompleted, onComplete, preferredLevel, onQuizComplete }: {
  mod: Module
  isOpen: boolean
  onToggle: () => void
  isCompleted: boolean
  onComplete: () => void
  preferredLevel: DifficultyLevel
  onQuizComplete: (score: number, total: number) => void
}) {
  const Icon = mod.icon
  const [quizQuestions, setQuizQuestions] = useState(() => getQuiz(mod.id, preferredLevel))

  useEffect(() => {
    setQuizQuestions(getQuiz(mod.id, preferredLevel))
  }, [mod.id, preferredLevel])

  return (
    <motion.div
      layout
      className="rounded-lg overflow-hidden"
      style={{ border: `1px solid ${isOpen ? mod.categoryColor + '44' : 'var(--border-default)'}`, backgroundColor: 'var(--bg-panel)', transition: 'border-color 0.25s ease' }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-5 py-4 text-left"
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
      >
        {/* Number + Icon */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="font-editorial text-2xl" style={{ color: mod.categoryColor, opacity: 0.5, lineHeight: 1, width: '28px' }}>
            {mod.number}
          </span>
          <div className="w-9 h-9 rounded-md flex items-center justify-center" style={{ backgroundColor: `${mod.categoryColor}18` }}>
            <Icon size={17} style={{ color: mod.categoryColor }} />
          </div>
        </div>

        {/* Title block */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <CategoryBadge label={mod.category} color={mod.categoryColor} />
            <span className="label-caps" style={{ color: 'var(--text-tertiary)', fontSize: '8px' }}>{mod.readTime}</span>
            {isCompleted && <CheckCircle2 size={10} style={{ color: mod.categoryColor }} />}
          </div>
          <span className="font-semibold text-sm block" style={{ color: 'var(--text-primary)' }}>{mod.title}</span>
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{mod.subtitle}</span>
        </div>

        {/* Chevron */}
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25 }} style={{ flexShrink: 0 }}>
          <ChevronDown size={16} style={{ color: 'var(--text-tertiary)' }} />
        </motion.div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-5 pb-6 pt-1 border-t" style={{ borderColor: 'var(--border-subtle)' }}>

              {/* Overview */}
              <div className="mb-4">
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)', lineHeight: 1.75 }}>
                  {mod.overview}
                </p>
              </div>

              {/* Diagram */}
              {mod.diagram && (
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart2 size={11} style={{ color: mod.categoryColor }} />
                    <span className="label-caps" style={{ color: mod.categoryColor, fontSize: '9px' }}>Schéma explicatif</span>
                  </div>
                  <mod.diagram />
                </div>
              )}

              {/* Key points */}
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen size={12} style={{ color: mod.categoryColor }} />
                  <span className="label-caps" style={{ color: mod.categoryColor, fontSize: '9px' }}>Concepts clés</span>
                </div>
                <ul className="flex flex-col gap-2.5">
                  {mod.keyPoints.map((pt, i) => (
                    <li key={i} className="flex gap-3 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      <span className="font-mono flex-shrink-0 mt-0.5" style={{ color: mod.categoryColor, fontSize: '10px' }}>→</span>
                      <LatexText text={pt} />
                    </li>
                  ))}
                </ul>
              </div>

              {/* Formula */}
              {mod.formula && (
                <div className="mb-5 rounded-md p-4" style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderLeft: `3px solid ${mod.categoryColor}` }}>
                   <div className="flex items-center gap-2 mb-3">
                    <FlaskConical size={11} style={{ color: mod.categoryColor }} />
                    <span className="label-caps" style={{ color: mod.categoryColor, fontSize: '11px' }}>Formule mathématique</span>
                  </div>
                  <BlockKatex math={mod.formula.latex} color={mod.categoryColor} />
                  <ul className="flex flex-col gap-1.5 mt-3">
                    {mod.formula.legend.map((leg, i) => (
                      <li key={i} className="flex gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <span style={{ color: mod.categoryColor, fontFamily: 'monospace', flexShrink: 0 }}>·</span>
                        <LatexText text={leg} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Moroccan example */}
              <div className="mb-5 rounded-md p-4" style={{ backgroundColor: 'rgba(92,126,146,0.06)', border: '1px solid rgba(92,126,146,0.15)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Landmark size={11} style={{ color: '#5C7E92' }} />
                  <span className="label-caps" style={{ color: '#5C7E92', fontSize: '9px' }}>Exemple marocain réel</span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {mod.moroccanExample}
                </p>
              </div>

              {/* Game tip */}
              <div className="mb-5 rounded-md p-4" style={{ backgroundColor: `${mod.categoryColor}0C`, border: `1px solid ${mod.categoryColor}22` }}>
                <div className="flex items-center gap-2 mb-2">
                  <Gamepad2 size={11} style={{ color: mod.categoryColor }} />
                  <span className="label-caps" style={{ color: mod.categoryColor, fontSize: '9px' }}>Conseil pour le simulateur</span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {mod.gameTip}
                </p>
              </div>

              {/* Quiz Card integration */}
              <div className="mb-5 border-t pt-5" style={{ borderColor: 'var(--border-subtle)' }}>
                <QuizCard
                  questions={quizQuestions}
                  moduleColor={mod.categoryColor}
                  onComplete={onQuizComplete}
                  onRetry={() => setQuizQuestions(getQuiz(mod.id, preferredLevel))}
                />
              </div>

              {/* NotePad integration */}
              <div className="mb-5 border-t pt-5" style={{ borderColor: 'var(--border-subtle)' }}>
                <NotePad moduleId={mod.id} moduleColor={mod.categoryColor} />
              </div>

              {/* Complete button */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onComplete() }}
                className="flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium transition-all"
                style={{
                  backgroundColor: isCompleted ? `${mod.categoryColor}20` : 'var(--bg-elevated)',
                  color: isCompleted ? mod.categoryColor : 'var(--text-secondary)',
                  border: `1px solid ${isCompleted ? mod.categoryColor + '44' : 'var(--border-default)'}`,
                  cursor: 'pointer',
                }}
              >
                {isCompleted ? <CheckCircle2 size={13} /> : <Circle size={13} />}
                {isCompleted ? 'Module complété ✓' : 'Marquer comme lu'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Page principale ──────────────────────────────────────────────────────────
export default function CoursesPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [openModule, setOpenModule] = useState<string | null>('intro')
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<'courses' | 'badges'>('courses')

  const player = useAuthStore(s => s.getCurrentPlayer())
  const storePreferredLevel = player?.preferredLevel ?? 'beginner'
  const setPreferredLevel = useAuthStore(s => s.setPreferredLevel)
  const [localLevel, setLocalLevel] = useState<DifficultyLevel>('beginner')

  // Sync store preferredLevel with local state
  useEffect(() => {
    if (player) {
      setLocalLevel(player.preferredLevel)
    }
  }, [player, player?.preferredLevel])

  useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem('cbs-courses-completed')
      if (saved) setCompleted(new Set(JSON.parse(saved)))
    } catch { /* ignore */ }
  }, [])

  const checkAndAwardBadges = (currentCompleted: string[]) => {
    const playerState = useAuthStore.getState().getCurrentPlayer()
    if (!playerState) return
    
    const data = {
      completedModules: currentCompleted,
      quizScores: playerState.quizScores ?? [],
      gameHistory: playerState.gameHistory ?? [],
    }

    BADGES.forEach(badge => {
      if (!playerState.badges?.includes(badge.id)) {
        if (checkBadgeEligibility(badge.id, data)) {
          useAuthStore.getState().addBadge(badge.id)
        }
      }
    })
  }

  const toggleComplete = (id: string) => {
    setCompleted(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      const nextArr = Array.from(next)
      try { localStorage.setItem('cbs-courses-completed', JSON.stringify(nextArr)) } catch { /* ignore */ }
      
      // Check and award course badges
      setTimeout(() => checkAndAwardBadges(nextArr), 50)
      return next
    })
  }

  const handleQuizComplete = (moduleId: string, score: number, total: number) => {
    if (!player) return
    const addQuizScore = useAuthStore.getState().addQuizScore
    addQuizScore({
      moduleId,
      score,
      total,
      date: new Date().toISOString(),
      level: localLevel,
    })
    
    // Check and award quiz/course badges
    setTimeout(() => checkAndAwardBadges(Array.from(completed)), 50)
  }

  const handleLevelChange = (level: DifficultyLevel) => {
    setLocalLevel(level)
    if (player) {
      setPreferredLevel(level)
    }
  }

  if (!mounted) return null

  const progress = Math.round((completed.size / MODULES.length) * 100)

  const categoryGroups: Record<string, { color: string; modules: Module[] }> = {}
  MODULES.forEach(m => {
    if (!categoryGroups[m.category]) categoryGroups[m.category] = { color: m.categoryColor, modules: [] }
    categoryGroups[m.category].modules.push(m)
  })

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-base)' }}>

      {/* ── NAV ──────────────────────────────────────────────────────── */}
      <nav
        className="flex items-center justify-between px-6"
        style={{ height: '52px', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-base)', position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(8px)' }}
      >
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/')} className="flex items-center gap-1.5 label-caps" style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}>
            <ArrowLeft size={12} />
            Accueil
          </button>
          <span style={{ color: 'var(--border-default)' }}>·</span>
          <GraduationCap size={14} style={{ color: 'var(--accent-cool)' }} />
          <span className="label-caps" style={{ color: 'var(--text-secondary)' }}>Cours de Macroéconomie</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2">
            <div className="h-1.5 w-24 rounded-full" style={{ backgroundColor: 'var(--bg-hover)' }}>
              <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${progress}%`, backgroundColor: 'var(--accent-cool)' }} />
            </div>
            <span className="label-caps" style={{ color: 'var(--text-tertiary)', fontSize: '9px' }}>{completed.size}/{MODULES.length}</span>
          </div>
          <ThemeToggle />
          <button onClick={() => router.push('/dashboard')} className="label-caps px-3 py-1.5 rounded-md" style={{ backgroundColor: 'var(--accent-primary)', color: '#fff', border: 'none', cursor: 'pointer' }}>
            Jouer
          </button>
        </div>
      </nav>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-10">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(92,126,146,0.15)' }}>
              <GraduationCap size={20} style={{ color: 'var(--accent-cool)' }} />
            </div>
            <div>
              <span className="label-caps block" style={{ color: 'var(--accent-cool)', marginBottom: '2px' }}>Banque centrale · Simulateur</span>
              <h1 className="font-editorial text-2xl sm:text-3xl" style={{ color: 'var(--text-primary)', lineHeight: 1.1 }}>
                Cours de Macroéconomie
              </h1>
            </div>
          </div>
          <p className="text-sm leading-relaxed max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
            8 modules pour comprendre les mécanismes qui gouvernent l&apos;économie marocaine — et maîtriser chaque instrument du simulateur.
            Chaque module contient les concepts théoriques, les formules du moteur de jeu et des exemples réels.
          </p>

          {/* Progress bar */}
          {completed.size > 0 && (
            <motion.div
              className="mt-5 flex items-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: 'var(--bg-hover)' }}>
                <motion.div
                  className="h-2 rounded-full"
                  style={{ backgroundColor: 'var(--accent-cool)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
              <span className="label-caps flex-shrink-0" style={{ color: 'var(--accent-cool)', fontSize: '9px' }}>
                {progress}% — {completed.size}/{MODULES.length} modules
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* ── Tabs selector ────────────────────────────────────────────── */}
        <div className="flex border-b mb-8" style={{ borderColor: 'var(--border-subtle)' }}>
          <button
            onClick={() => setActiveTab('courses')}
            className="px-6 py-3 font-semibold text-sm transition-all relative"
            style={{
              color: activeTab === 'courses' ? 'var(--accent-cool)' : 'var(--text-tertiary)',
              borderBottom: activeTab === 'courses' ? '2px solid var(--accent-cool)' : '2px solid transparent',
              background: 'none',
              cursor: 'pointer',
            }}
          >
            📚 Cours & Modules
          </button>
          <button
            onClick={() => setActiveTab('badges')}
            className="px-6 py-3 font-semibold text-sm transition-all relative"
            style={{
              color: activeTab === 'badges' ? 'var(--accent-cool)' : 'var(--text-tertiary)',
              borderBottom: activeTab === 'badges' ? '2px solid var(--accent-cool)' : '2px solid transparent',
              background: 'none',
              cursor: 'pointer',
            }}
          >
            🏆 Mes Badges & Succès
          </button>
        </div>

        {activeTab === 'courses' ? (
          <>
            {/* Study Level Control */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-subtle)' }}>
              <div className="flex items-center gap-2">
                <GraduationCap size={16} style={{ color: 'var(--accent-cool)' }} />
                <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  Niveau d&apos;étude des Quizzes :
                </span>
              </div>
              <div className="flex rounded-lg overflow-hidden p-0.5" style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-default)' }}>
                {(['beginner', 'intermediate', 'expert'] as DifficultyLevel[]).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => handleLevelChange(lvl)}
                    className="px-4 py-1.5 rounded-md text-xs font-semibold transition-all"
                    style={{
                      backgroundColor: localLevel === lvl ? 'var(--accent-cool)' : 'transparent',
                      color: localLevel === lvl ? '#fff' : 'var(--text-secondary)',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {lvl === 'beginner' ? '🌱 Débutant' : lvl === 'intermediate' ? '📈 Intermédiaire' : '🎯 Expert'}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick nav by category */}
            <motion.div
              className="flex flex-wrap gap-2 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              {Object.entries(categoryGroups).map(([cat, { color }]) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    const firstMod = categoryGroups[cat].modules[0]
                    setOpenModule(firstMod.id)
                    setTimeout(() => document.getElementById(`mod-${firstMod.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)
                  }}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={{ backgroundColor: `${color}14`, color, border: `1px solid ${color}30`, cursor: 'pointer' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = `${color}28` }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = `${color}14` }}
                >
                  {cat}
                </button>
              ))}
            </motion.div>

            {/* Modules accordion */}
            <div className="flex flex-col gap-3">
              {MODULES.map((mod, i) => (
                <motion.div
                  key={mod.id}
                  id={`mod-${mod.id}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  <ModuleCard
                    mod={mod}
                    isOpen={openModule === mod.id}
                    onToggle={() => setOpenModule(openModule === mod.id ? null : mod.id)}
                    isCompleted={completed.has(mod.id)}
                    onComplete={() => toggleComplete(mod.id)}
                    preferredLevel={localLevel}
                    onQuizComplete={(score, total) => handleQuizComplete(mod.id, score, total)}
                  />
                </motion.div>
              ))}
            </div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <BadgeDisplay />
          </motion.div>
        )}

        {/* ── CTA bas de page ──────────────────────────────────────────── */}
        <motion.div
          className="mt-12 rounded-lg p-8 text-center"
          style={{ backgroundColor: 'var(--bg-panel)', border: '1px solid var(--border-default)', background: 'radial-gradient(ellipse at 50% 100%, rgba(92,126,146,0.08) 0%, var(--bg-panel) 60%)' }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <Lightbulb size={28} style={{ color: 'var(--accent-warm)', margin: '0 auto 12px' }} />
          <h3 className="font-editorial text-xl mb-2" style={{ color: 'var(--text-primary)' }}>Prêt à mettre en pratique ?</h3>
          <p className="text-sm mb-6" style={{ color: 'var(--text-tertiary)' }}>
            Les cours sont conçus pour accompagner le simulateur — chaque concept a un équivalent direct dans le jeu.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-8 py-3 rounded-lg font-semibold text-sm flex items-center gap-2 mx-auto transition-all"
            style={{ background: 'linear-gradient(135deg, #C41923 0%, #8B131B 100%)', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(180,25,35,0.3)', transition: 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(180,25,35,0.45)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(180,25,35,0.3)' }}
          >
            Lancer le simulateur
            <ChevronRight size={16} />
          </button>
        </motion.div>

      </main>

      <footer className="px-6 py-5 text-center" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <p className="label-caps" style={{ color: 'var(--text-tertiary)' }}>
          Projet de Fin d&apos;Année 2025 · Banque centrale · Simulateur de politique monétaire
        </p>
      </footer>

      {/* Mascot Bot */}
      <AssistantBot messages={COURSE_MESSAGES[openModule || 'intro']?.map(m => m.text) ?? []} context="courses" />
    </div>
  )
}

