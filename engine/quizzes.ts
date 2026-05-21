/**
 * Quizzes par module de cours — adaptés au niveau de difficulté.
 * Chaque module a un set de questions par niveau.
 */

import type { DifficultyLevel } from './difficulty'

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export interface ModuleQuiz {
  moduleId: string
  questions: Record<DifficultyLevel, QuizQuestion[]>
}

export const QUIZZES: ModuleQuiz[] = [
  {
    moduleId: 'intro',
    questions: {
      beginner: [
        { id: 'intro-b1', question: "Quel est l'objectif principal de la Banque centrale ?", options: ['Maximiser la croissance', 'Stabiliser les prix', 'Réduire le chômage', 'Augmenter les exportations'], correctIndex: 1, explanation: "La stabilité des prix (inflation proche de 2%) est le mandat principal de la Banque centrale." },
        { id: 'intro-b2', question: "Que signifie une inflation de 2% ?", options: ['Les prix baissent de 2%', 'Les prix augmentent de 2% par an', 'Le PIB croît de 2%', 'Le chômage est de 2%'], correctIndex: 1, explanation: "L'inflation mesure la hausse générale des prix. 2% signifie que les prix montent de 2% par an en moyenne." },
        { id: 'intro-b3', question: "Pourquoi la crédibilité est-elle importante ?", options: ["Elle n'a aucune importance", 'Elle permet de contrôler les anticipations', 'Elle augmente le PIB directement', 'Elle réduit la dette'], correctIndex: 1, explanation: "Si les agents font confiance à la Banque centrale, ils n'augmentent pas leurs prix par anticipation." },
        { id: 'intro-b4', question: "À qui appartient la Banque centrale (BAM) ?", options: ["À l'État marocain", "Aux banques privées", "Au FMI", "À des actionnaires étrangers"], correctIndex: 0, explanation: "Bank Al-Maghrib est un établissement public de l'État marocain disposant de sa propre personnalité morale." },
        { id: 'intro-b5', question: "Quel est le surnom officiel du dirigeant de Bank Al-Maghrib ?", options: ['Le Wali', 'Le Directeur', 'Le Président', 'Le Ministre'], correctIndex: 0, explanation: "Le gouverneur de Bank Al-Maghrib porte le titre officiel de Wali." }
      ],
      intermediate: [
        { id: 'intro-i1', question: "Quel est le poids de l'inflation dans le scoring ?", options: ['20%', '25%', '35%', '50%'], correctIndex: 2, explanation: "Le score inflation représente 35 points sur 100 — c'est le critère le plus important." },
        { id: 'intro-i2', question: "Pourquoi la Banque centrale est-elle indépendante du gouvernement ?", options: ['Pour augmenter les impôts', 'Pour éviter les biais inflationnistes politiques', 'Pour gérer le budget', "Ce n'est pas le cas"], correctIndex: 1, explanation: "L'indépendance évite que les politiciens baissent les taux avant les élections pour stimuler artificiellement l'économie." },
        { id: 'intro-i3', question: "Qu'est-ce que le double mandat implicite de BAM ?", options: ['Croissance + Emploi', 'Stabilité des prix + Soutien à la croissance', 'Réduction de la dette + Inflation', 'Exportations + Importations'], correctIndex: 1, explanation: "BAM doit prioritairement stabiliser les prix, mais soutient aussi la croissance comme objectif secondaire." },
        { id: 'intro-i4', question: "Quel organe interne prend les décisions de taux d'intérêt ?", options: ['Le Conseil de la Banque', 'Le Ministère des Finances', 'La Commission du Crédit', 'La Direction du Trésor'], correctIndex: 0, explanation: "Le Conseil de la Banque prend les décisions souveraines de politique monétaire." }
      ],
      expert: [
        { id: 'intro-e1', question: "En 2022, à quel niveau l'inflation marocaine a-t-elle culminé ?", options: ['3,5%', '4,8%', '6,1%', '8,3%'], correctIndex: 2, explanation: "L'inflation a atteint 6,1% en 2022, son plus haut depuis 30 ans." },
        { id: 'intro-e2', question: "Quel mécanisme lie crédibilité et désinflation ?", options: ['Courbe IS', 'Canal des anticipations', 'Loi d\'Okun', 'Balance des paiements'], correctIndex: 1, explanation: "Une Banque centrale crédible ancre les anticipations, réduisant le coût en PIB de la désinflation." },
        { id: 'intro-e3', question: "Quel est le coût de la désinflation quand la crédibilité est faible ?", options: ['Aucun', 'Faible récession', 'Forte récession nécessaire', 'Déflation automatique'], correctIndex: 2, explanation: "Sans crédibilité, la désinflation nécessite un output gap négatif prolongé — un sacrifice de croissance." },
        { id: 'intro-e4', question: "Que mesurent les 4 composantes du scoring ?", options: ['PIB, Emploi, Exports, Investissement', 'Inflation, Croissance, Stabilité, Crédibilité', 'Taux, Réserves, Liquidité, NPL', 'Prix, Change, Balance, Dette'], correctIndex: 1, explanation: "Le score évalue l'inflation (35pts), la croissance (25pts), la stabilité (20pts) et la crédibilité (20pts)." },
        { id: 'intro-e5', question: "Qui préside le Conseil de la Banque de Bank Al-Maghrib ?", options: ['Le Wali', 'Le Ministre de l\'Économie', 'Le Chef du Gouvernement', 'Un commissaire nommé par le parlement'], correctIndex: 0, explanation: "Le Conseil de la Banque est légalement présidé par le Wali de Bank Al-Maghrib." }
      ],
    },
  },
  {
    moduleId: 'policy-rate',
    questions: {
      beginner: [
        { id: 'pr-b1', question: "Que se passe-t-il quand le taux directeur monte ?", options: ['Les crédits deviennent moins chers', 'Les crédits deviennent plus chers', 'Le PIB augmente', "L'inflation augmente"], correctIndex: 1, explanation: "Un taux directeur plus élevé rend les emprunts plus coûteux, ce qui freine la demande." },
        { id: 'pr-b2', question: "De combien peut-on changer le taux à chaque trimestre ?", options: ['0,10%', '0,25%', '0,50%', '1,00%'], correctIndex: 1, explanation: "Dans le simulateur, les variations se font par pas de 25 points de base (0,25%)." },
        { id: 'pr-b3', question: "En combien de trimestres l'effet se fait-il sentir ?", options: ['Immédiatement', '1 trimestre', '2-3 trimestres', '10 trimestres'], correctIndex: 2, explanation: "La transmission monétaire prend environ 2 à 3 trimestres pour impacter pleinement l'inflation." },
        { id: 'pr-b4', question: "Si l'inflation est trop basse (ex. 0,5%), quelle action convient ?", options: ['Baisser le taux directeur', 'Augmenter le taux directeur', 'Ne rien changer', 'Fermer les banques'], correctIndex: 0, explanation: "Baisser le taux directeur stimule le crédit et relance l'activité et l'inflation." }
      ],
      intermediate: [
        { id: 'pr-i1', question: "Quelle est la chaîne de transmission du taux directeur ?", options: ['i* → PIB → Inflation', 'i* → TMP → i^D → Crédit → Output gap → Inflation', 'i* → Change → Exports', 'i* → NPL → Crédit'], correctIndex: 1, explanation: "Le taux directeur se transmet via le marché interbancaire, puis les taux débiteurs, puis le crédit et la demande." },
        { id: 'pr-i2', question: "Qu'est-ce que la Borne Zéro (ZLB) ?", options: ['Le taux ne peut pas dépasser 10%', 'Le taux ne peut pas descendre sous ~0,5%', 'Le crédit tombe à zéro', 'La croissance est nulle'], correctIndex: 1, explanation: "La borne basse effective empêche le taux de descendre trop bas car les banques stockeraient du cash." },
        { id: 'pr-i3', question: "Que vaut λ (vitesse de transmission) au Maroc ?", options: ['0,10', '0,35', '0,70', '1,00'], correctIndex: 1, explanation: "λ = 0,35 signifie que ~35% de la variation du TMP est répercutée chaque trimestre sur le taux débiteur." },
        { id: 'pr-i4', question: "Qu'est-ce que le TMP ?", options: ['Taux Moyen Pondéré du marché interbancaire', 'Taux Mensuel Prévisionnel', 'Taux Marginal de Prêt', 'Taux Maximum de Placement'], correctIndex: 0, explanation: "Le TMP est le Taux Moyen Pondéré sur le marché au jour le jour où les banques s'empruntent des liquidités." }
      ],
      expert: [
        { id: 'pr-e1', question: "Pourquoi des changements contradictoires nuisent-ils à la crédibilité ?", options: ['Ils coûtent cher', 'Ils signalent une confusion stratégique', 'Ils violent la loi', 'Ils augmentent les NPL'], correctIndex: 1, explanation: "Des revirements fréquents suggèrent que la Banque centrale n'a pas de vision claire, désancrant les anticipations." },
        { id: 'pr-e2', question: "En juin 2020, à quel niveau BAM a-t-elle baissé son taux ?", options: ['2,00%', '1,50%', '1,00%', '0,50%'], correctIndex: 1, explanation: "BAM a baissé à 1,50% — son plus bas historique — pour soutenir l'économie face au COVID." },
        { id: 'pr-e3', question: "Quelle est la borne basse effective estimée pour le Maroc ?", options: ['0,0%', '0,25%', '0,50%', '1,00%'], correctIndex: 2, explanation: "La borne basse effective au Maroc est estimée à 0,5% en raison de la structure du marché monétaire." }
      ],
    },
  },
  {
    moduleId: 'is-curve',
    questions: {
      beginner: [
        { id: 'is-b1', question: "Qu'est-ce que l'output gap ?", options: ["L'écart entre PIB réel et PIB potentiel", "Le taux de chômage", "Le déficit budgétaire", "La balance commerciale"], correctIndex: 0, explanation: "L'output gap mesure si l'économie produit au-dessus (surchauffe) ou en-dessous (récession) de son potentiel." },
        { id: 'is-b2', question: "Un output gap positif signifie :", options: ['Récession', 'Surchauffe économique', 'Équilibre parfait', 'Déflation'], correctIndex: 1, explanation: "Un output gap positif = l'économie produit plus que son potentiel, créant des pressions inflationnistes." },
        { id: 'is-b3', question: "Comment appelle-t-on une baisse du PIB sur plusieurs trimestres ?", options: ['Une récession', 'Une expansion', 'Une inflation', 'Une parité'], correctIndex: 0, explanation: "Une baisse durable de l'activité économique caractérise une récession." }
      ],
      intermediate: [
        { id: 'is-i1', question: "Que signifie σ = 0,12 ?", options: ['Forte sensibilité aux taux', 'Faible sensibilité aux taux réels', 'Haute ouverture commerciale', 'Persistance cyclique'], correctIndex: 1, explanation: "σ = 0,12 est faible car au Maroc le capital est peu mobile et les entreprises dépendent peu du financement externe." },
        { id: 'is-i2', question: "Que mesure le paramètre δ = 0,30 ?", options: ['Inflation core', "Degré d'ouverture commerciale", 'Taux de change', 'Liquidité bancaire'], correctIndex: 1, explanation: "δ = 0,30 capture la dépendance du Maroc à la demande européenne (tourisme, IDE, transferts)." },
        { id: 'is-i3', question: "En 2020, à combien l'output gap marocain a-t-il plongé ?", options: ['-1%', '-2%', '-4%', '-8%'], correctIndex: 2, explanation: "L'output gap a atteint -4% du PIB potentiel en raison de la fermeture du tourisme et de la récession européenne." }
      ],
      expert: [
        { id: 'is-e1', question: "Comment le taux réel affecte-t-il la demande si l'inflation monte ?", options: ["Le taux réel monte, freinant la demande", "Le taux réel baisse, stimulant la demande", "Aucun effet", "Le change se déprécie"], correctIndex: 1, explanation: "Taux réel = nominal - inflation anticipée. Si l'inflation monte, le taux réel baisse et stimule la demande automatiquement." },
        { id: 'is-e2', question: "Quelle zone d'output gap est considérée 'verte' ?", options: ['-0,5% à +0,5%', '-1,5% à +1,5%', '-3% à +3%', '0% exactement'], correctIndex: 1, explanation: "La zone [-1,5%, +1,5%] est considérée comme une zone de confort où ni l'inflation ni la déflation ne menacent." }
      ],
    },
  },
  {
    moduleId: 'phillips',
    questions: {
      beginner: [
        { id: 'ph-b1', question: "Qu'est-ce que la courbe de Phillips ?", options: ['La relation entre PIB et emploi', 'La relation entre inflation et activité', 'La courbe des taux', 'Le cycle du crédit'], correctIndex: 1, explanation: "La courbe de Phillips lie l'inflation à l'activité économique : plus de demande = plus d'inflation." },
        { id: 'ph-b2', question: "Pourquoi les anticipations d'inflation sont-elles importantes ?", options: ['Elles ne le sont pas', 'Elles déterminent largement l\'inflation réelle', 'Elles affectent uniquement le PIB', 'Elles contrôlent le change'], correctIndex: 1, explanation: "Si les agents anticipent 4% d'inflation, ils ajustent leurs prix en conséquence, créant effectivement 4% d'inflation." },
        { id: 'ph-b3', question: "Quel terme désigne une situation combinant inflation et chômage élevé ?", options: ['La stagflation', 'La déflation', 'La parité', 'La ZLB'], correctIndex: 0, explanation: "La stagflation associe une stagnation économique (récession/chômage) à une inflation élevée." }
      ],
      intermediate: [
        { id: 'ph-i1', question: "Que vaut β (poids des anticipations) ?", options: ['0,50', '0,75', '0,95', '1,00'], correctIndex: 2, explanation: "β ≈ 0,95 signifie que les anticipations sont le facteur dominant dans la formation des prix (critique de Lucas)." },
        { id: 'ph-i2', question: "Face à un choc d'offre temporaire, faut-il resserrer fortement ?", options: ['Oui, toujours', 'Non, ça aggrave la récession', 'Ça dépend du taux de change', 'Seul le CCyB est utile'], correctIndex: 1, explanation: "Un resserrement agressif sur un choc temporaire coûte de la croissance sans réduire un choc qui disparaîtra seul." }
      ],
      expert: [
        { id: 'ph-e1', question: "Quel est le pass-through taux de change → inflation au Maroc ?", options: ['α = 0,02', 'α = 0,08', 'α = 0,25', 'α = 0,50'], correctIndex: 1, explanation: "α = 0,08 : le pass-through est faible sous le régime de quasi-parité dirham/euro-dollar." },
        { id: 'ph-e2', question: "En 2022, quelles étaient les sources de l'inflation de 6,1% ?", options: ['Uniquement la demande', 'Pétrole + imports + sécheresse + demande post-COVID', 'Seulement le taux de change', 'Politique budgétaire expansionniste'], correctIndex: 1, explanation: "L'inflation de 2022 combinait choc pétrolier, pass-through imports, sécheresse agricole et reprise post-COVID." }
      ],
    },
  },
  {
    moduleId: 'channels',
    questions: {
      beginner: [
        { id: 'ch-b1', question: "Combien de canaux de transmission existe-t-il ?", options: ['2', '3', '4', '6'], correctIndex: 2, explanation: "4 canaux : taux d'intérêt, crédit, anticipations et taux de change." },
        { id: 'ch-b2', question: "Quel est le canal principal ?", options: ['Le canal du crédit', "Le canal des taux d'intérêt", 'Le canal du change', 'Le canal fiscal'], correctIndex: 1, explanation: "Le canal des taux d'intérêt (i* → TMP → i^D → Crédit → Demande → Inflation) est le mécanisme principal." }
      ],
      intermediate: [
        { id: 'ch-i1', question: "Qu'est-ce que le Forward Guidance ?", options: ['Une hausse de taux', 'Un signal de communication sur la politique future', 'Une injection de liquidité', 'Un achat de devises'], correctIndex: 1, explanation: "Le Forward Guidance utilise la communication (dovish/hawkish) pour influencer les anticipations sans bouger le taux." },
        { id: 'ch-i2', question: "Pourquoi le canal du crédit peut-il être bloqué ?", options: ['Le taux est trop bas', 'Les NPL élevés poussent les banques à rationner le crédit', 'Le change est fixe', "L'inflation is trop basse"], correctIndex: 1, explanation: "Quand les NPL sont élevés, les banques deviennent averses au risque et rationnent le crédit indépendamment du taux directeur." }
      ],
      expert: [
        { id: 'ch-e1', question: "Pourquoi λ = 0,35 est problématique pour la transmission ?", options: ['Trop rapide', 'Trop lent — 3 trimestres pour transmettre', 'Trop volatile', "N'existe pas"], correctIndex: 1, explanation: "Les banques marocaines tardent à répercuter les variations — seuls 35% de la variation sont transmis par trimestre." },
        { id: 'ch-e2', question: "Comment le canal du change fonctionne-t-il ?", options: ['Hausse i* → fuite de capitaux → dépréciation', 'Hausse i* → entrées de capitaux → appréciation → imports moins chers', 'Le change est fixe donc ce canal est nul', 'Le canal ne fonctionne que dans les pays développés'], correctIndex: 1, explanation: "Une hausse du taux attire les capitaux, apprécie le dirham et réduit le coût des importations." }
      ],
    },
  },
  {
    moduleId: 'taylor',
    questions: {
      beginner: [
        { id: 'ty-b1', question: "Qui a proposé la règle de Taylor ?", options: ['Keynes', 'Taylor', 'Friedman', 'Phillips'], correctIndex: 1, explanation: "John Taylor a proposé cette règle en 1993 pour guider les décisions de taux directeur." },
        { id: 'ty-b2', question: "Quelle est la cible d'inflation de BAM ?", options: ['0%', '1%', '2%', '4%'], correctIndex: 2, explanation: "La Banque centrale vise 2% d'inflation annuelle — assez pour que l'économie avance sans éroder le pouvoir d'achat." }
      ],
      intermediate: [
        { id: 'ty-i1', question: "Que dit le principe de Taylor ?", options: ['φ_π doit être < 1', 'φ_π doit être > 1', 'φ_y doit être = 0', 'r* doit être négatif'], correctIndex: 1, explanation: "φ_π > 1 assure que le taux réel augmente quand l'inflation monte, stabilisant effectivement les prix." },
        { id: 'ty-i2', question: "Quel est le taux réel neutre estimé pour le Maroc ?", options: ['0,5%', '1,0%', '1,5%', '2,5%'], correctIndex: 2, explanation: "r* = 1,5% est le taux réel estimé qui ni stimule ni freine l'économie marocaine." }
      ],
      expert: [
        { id: 'ty-e1', question: "En 2022, que prescrivait la règle de Taylor ?", options: ['2,0%', '5,0%', '≈ 9,9%', '12,0%'], correctIndex: 2, explanation: "i* = 1,5 + 2,0 + 1,5×(6,1−2,0) + 0,5×0,5 ≈ 9,9%. BAM n'est montée qu'à 3% — un écart justifié par la structure de l'économie." },
        { id: 'ty-e2', question: "Qu'est-ce que le 'Coin de Taylor' ?", options: ['Un outil fiscal', 'Un écart > 1,5 pp entre taux réel et taux Taylor', 'Un indicateur de change', 'Le ratio dette/PIB'], correctIndex: 1, explanation: "Si votre taux diverge de plus de 1,5 pp du taux de Taylor, vous risquez une surchauffe ou une récession inutile." }
      ],
    },
  },
  {
    moduleId: 'shocks',
    questions: {
      beginner: [
        { id: 'sh-b1', question: "Quel type de choc est le plus difficile à gérer ?", options: ['Choc de demande positif', "Choc d'offre négatif", 'Choc externe positif', 'Aucun'], correctIndex: 1, explanation: "Un choc d'offre négatif fait monte l'inflation ET baisser la croissance — le pire des cas pour un banquier central." },
        { id: 'sh-b2', question: "Combien de trimestres durent les chocs dans le simulateur ?", options: ['1', '2 à 6', '10', '20'], correctIndex: 1, explanation: "Les chocs durent entre 2 et 6 trimestres, créant des perturbations temporaires mais significatives." }
      ],
      intermediate: [
        { id: 'sh-i1', question: "Face à un choc de demande négatif (COVID), que faut-il faire ?", options: ['Resserrer', 'Assouplir + emergency lending', 'Ne rien faire', 'Augmenter les réserves'], correctIndex: 1, explanation: "Un choc de demande négatif fait baisser inflation ET croissance — une réponse accommodante est claire." },
        { id: 'sh-i2', question: "Quel indicateur différencie un choc temporaire d'un choc persistant ?", options: ['Le PIB', "L'inflation core", "Le taux de change", "Le chômage"], correctIndex: 1, explanation: "L'inflation core (hors alimentaire et énergie) indique la tendance fondamentale. Si elle reste ancrée, le choc est probablement temporaire." }
      ],
      expert: [
        { id: 'sh-e1', question: "En 2022, quel double choc d'offre le Maroc a-t-il subi ?", options: ['COVID + récession', 'Pétrole + sécheresse', 'Change + fuite de capitaux', 'Crédit + NPL'], correctIndex: 1, explanation: "Le Maroc a subi simultanément un choc pétrolier (+60%) et une sécheresse historique (-14,6% VA agricole)." },
        { id: 'sh-e2', question: "Pourquoi ne faut-il pas sur-resserrer face à un choc d'offre temporaire ?", options: ['Parce que le choc disparaîtra seul', "Parce que ça aggrave la récession sans réduire le choc", "Les deux réponses précédentes", "Aucune de ces réponses"], correctIndex: 2, explanation: "Le choc disparaît naturellement et un resserrement excessif sacrifie 1-2 points de croissance inutilement." }
      ],
    },
  },
  {
    moduleId: 'financial-stability',
    questions: {
      beginner: [
        { id: 'fs-b1', question: "Que sont les NPL ?", options: ['Des obligations', 'Des créances en souffrance', 'Des réserves de change', 'Des taux directeurs'], correctIndex: 1, explanation: "NPL (Non-Performing Loans) = crédits que les emprunteurs ne remboursent plus. Un indicateur de fragilité bancaire." },
        { id: 'fs-b2', question: "À partir de quel ratio NPL le crédit se bloque-t-il ?", options: ['5%', '8%', '10-12%', '20%'], correctIndex: 2, explanation: "Au-delà de 10-12% de NPL, les banques rationnent fortement le crédit même si les taux sont bas." }
      ],
      intermediate: [
        { id: 'fs-i1', question: "Qu'est-ce que le CCyB ?", options: ['Un taux directeur', 'Un coussin contracyclique de capital', 'Un ratio de change', 'Un indicateur de PIB'], correctIndex: 1, explanation: "Le CCyB oblige les banques à constituer des réserves en période de boom pour les libérer en crise." },
        { id: 'fs-i2', question: "Qu'est-ce que le piège de la dette-déflation ?", options: ['Inflation trop élevée', 'Spirale : déflation → dette réelle ↑ → crédit ↓ → récession → plus de déflation', 'Hausse du change', 'Excès de crédit'], correctIndex: 1, explanation: "Irving Fisher (1933) a décrit cette spirale mortelle où la déflation alourdit la dette réelle." }
      ],
      expert: [
        { id: 'fs-e1', question: "Quel outil brise la spirale de dette-déflation à la ZLB ?", options: ['Baisser encore le taux', 'Emergency Lending', 'Forward Guidance', 'CCyB'], correctIndex: 1, explanation: "À la ZLB, le taux est inefficace. Seul l'Emergency Lending (injection directe de liquidité aux banques) peut briser la spirale." },
        { id: 'fs-e2', question: "Quel ratio NPL le Maroc a-t-il atteint en 2023 ?", options: ['5,2%', '7,5%', '8,9%', '12,0%'], correctIndex: 2, explanation: "Le ratio NPL marocain a atteint 8,9% en 2023, principalement dans le segment PME post-COVID." }
      ],
    },
  },
]

/** Fisher-Yates shuffle helper */
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Get a randomized and shuffled subset of quiz questions for a module at a specific level */
export function getQuiz(moduleId: string, level: DifficultyLevel): QuizQuestion[] {
  const quiz = QUIZZES.find(q => q.moduleId === moduleId)
  if (!quiz) return []
  
  const baseQuestions = quiz.questions[level] ?? quiz.questions.intermediate;
  if (!baseQuestions || baseQuestions.length === 0) return [];
  
  // 1. Mélanger le pool de questions et en sélectionner 3
  const shuffledPool = shuffleArray(baseQuestions);
  const selectedQuestions = shuffledPool.slice(0, Math.min(3, shuffledPool.length));
  
  // 2. Pour chaque question sélectionnée, mélanger les options de réponse et corriger le correctIndex
  return selectedQuestions.map((q) => {
    const originalCorrectOption = q.options[q.correctIndex];
    const shuffledOptions = shuffleArray(q.options);
    const newCorrectIndex = shuffledOptions.indexOf(originalCorrectOption);
    
    return {
      ...q,
      id: q.id, // Garder l'id pour éviter les soucis de clé React
      question: q.question,
      options: shuffledOptions,
      correctIndex: newCorrectIndex,
      explanation: q.explanation,
    };
  });
}
