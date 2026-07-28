/**
 * Mode Découverte — contenu 100 % vulgarisé.
 *
 * Ce fichier contient tout le contenu pédagogique du mode Découverte :
 * histoires illustrées, quiz sans jargon, cartes de prédiction, paires
 * expert ↔ métaphore, mission simplifiée et système de progression (XP).
 *
 * Comme le reste du dossier engine/, il est en TypeScript pur :
 * aucune dépendance à React, Zustand ou Next.js.
 */

import type { EconomicState, Shock } from './state'

/* ══════════════════════════════════════════════════════════════════
   NIVEAUX & XP
   ══════════════════════════════════════════════════════════════════ */

export interface DiscoveryLevel {
  level: number
  title: string
  emoji: string
  minXp: number
}

export const DISCOVERY_LEVELS: DiscoveryLevel[] = [
  { level: 1, title: 'Curieux',             emoji: '🐣', minXp: 0 },
  { level: 2, title: 'Apprenti',            emoji: '🎒', minXp: 120 },
  { level: 3, title: 'Explorateur',         emoji: '🧭', minXp: 300 },
  { level: 4, title: 'As de la Monnaie',    emoji: '🃏', minXp: 550 },
  { level: 5, title: 'Capitaine',           emoji: '🧑‍✈️', minXp: 850 },
  { level: 6, title: "Sage de l'Économie",  emoji: '🦉', minXp: 1200 },
]

export interface LevelProgress {
  current: DiscoveryLevel
  next: DiscoveryLevel | null
  /** Progression 0-100 vers le prochain niveau */
  progressPct: number
}

export function getLevelProgress(xp: number): LevelProgress {
  let current = DISCOVERY_LEVELS[0]
  for (const lvl of DISCOVERY_LEVELS) {
    if (xp >= lvl.minXp) current = lvl
  }
  const next = DISCOVERY_LEVELS.find(l => l.minXp > current.minXp) ?? null
  const progressPct = next
    ? Math.min(100, Math.round(((xp - current.minXp) / (next.minXp - current.minXp)) * 100))
    : 100
  return { current, next, progressPct }
}

/* ══════════════════════════════════════════════════════════════════
   QUIZ VULGARISÉ (utilisé aussi par les checkpoints des chapitres)
   ══════════════════════════════════════════════════════════════════ */

export interface DiscoveryQuizQuestion {
  id: string
  emoji: string
  question: string
  options: { text: string; correct: boolean }[]
  /** Explication amicale affichée après la réponse */
  explanation: string
  /** Petit pont vers le vocabulaire du mode expert */
  expertNote?: string
}

export const DISCOVERY_QUIZ: DiscoveryQuizQuestion[] = [
  {
    id: 'q-inflation',
    emoji: '🥖',
    question: 'Ta baguette coûtait 2 dh l’an dernier. Cette année elle coûte 2,20 dh. Comment ça s’appelle ?',
    options: [
      { text: "L'inflation : les prix montent", correct: true },
      { text: 'Une promotion', correct: false },
      { text: 'Le boulanger est de mauvaise humeur', correct: false },
      { text: 'La déflation : les prix baissent', correct: false },
    ],
    explanation: 'Quand la plupart des prix montent en même temps, on parle d’inflation. Un peu, ça va. Trop, ça fait mal au porte-monnaie !',
    expertNote: 'En mode expert, l’inflation est mesurée en % par an. La cible de la banque centrale est 2 %.',
  },
  {
    id: 'q-banque-centrale',
    emoji: '🏦',
    question: 'C’est quoi le travail principal de la banque centrale ?',
    options: [
      { text: 'Garder les prix stables pour tout le pays', correct: true },
      { text: 'Vendre des voitures', correct: false },
      { text: 'Donner des crédits aux particuliers', correct: false },
      { text: 'Imprimer des billets pour tout le monde gratuitement', correct: false },
    ],
    explanation: 'La banque centrale, c’est la banque des banques. Sa grande mission : que les prix restent calmes et que tout le monde garde confiance dans la monnaie.',
    expertNote: 'En mode expert, tu incarnes justement son gouverneur !',
  },
  {
    id: 'q-taux',
    emoji: '🚗',
    question: 'Le « taux directeur », c’est un peu comme quoi dans une voiture ?',
    options: [
      { text: 'La pédale de frein ET d’accélérateur', correct: true },
      { text: 'Le klaxon', correct: false },
      { text: 'Les essuie-glaces', correct: false },
      { text: 'La radio', correct: false },
    ],
    explanation: 'Taux plus haut = on freine l’économie (les crédits coûtent plus cher). Taux plus bas = on accélère (emprunter devient facile).',
    expertNote: 'En mode expert, tu bouges ce taux par petits pas de 0,25 %.',
  },
  {
    id: 'q-credit-cher',
    emoji: '💳',
    question: 'La banque centrale AUGMENTE son taux. Que se passe-t-il pour ton crédit auto ?',
    options: [
      { text: 'Il devient plus cher', correct: true },
      { text: 'Il devient gratuit', correct: false },
      { text: 'Rien ne change jamais', correct: false },
      { text: 'La banque te rembourse', correct: false },
    ],
    explanation: 'Les banques empruntent à la banque centrale. Si ça leur coûte plus cher, elles te prêtent plus cher aussi. Résultat : on achète moins, et les prix se calment.',
    expertNote: 'C’est le « canal du crédit » du mode expert.',
  },
  {
    id: 'q-trop-freiner',
    emoji: '🥶',
    question: 'Si la banque centrale freine trop fort, trop longtemps... que risque-t-il de se passer ?',
    options: [
      { text: 'Moins d’activité et plus de chômage', correct: true },
      { text: 'Tout le monde devient riche', correct: false },
      { text: 'Il pleut plus souvent', correct: false },
      { text: 'Les magasins ouvrent la nuit', correct: false },
    ],
    explanation: 'Freiner calme les prix, mais si on exagère, les entreprises vendent moins, investissent moins... et embauchent moins. Tout est une question d’équilibre !',
    expertNote: 'En mode expert, cet équilibre s’appelle l’arbitrage inflation / activité.',
  },
  {
    id: 'q-ballon',
    emoji: '🎈',
    question: 'On compare souvent les prix à un ballon. Pourquoi ?',
    options: [
      { text: 'Trop gonflé il explose, trop dégonflé il ne vole plus', correct: true },
      { text: 'Parce que les ballons sont chers', correct: false },
      { text: 'Parce que les billets volent', correct: false },
      { text: 'Aucun rapport', correct: false },
    ],
    explanation: 'Un peu d’air (un peu d’inflation) c’est normal et même sain. Trop d’air, il éclate (les prix s’envolent). Pas assez, il retombe (l’économie s’endort).',
  },
  {
    id: 'q-cible',
    emoji: '🎯',
    question: 'La banque centrale vise environ 2 % d’inflation par an. Pourquoi pas 0 % ?',
    options: [
      { text: 'Un petit peu d’inflation aide l’économie à avancer', correct: true },
      { text: 'Parce que 2 est son chiffre porte-bonheur', correct: false },
      { text: 'Parce que 0 % est impossible à écrire', correct: false },
      { text: 'Pour embêter les gens', correct: false },
    ],
    explanation: 'À 0 %, l’économie risque de s’endormir : les gens attendent que les prix baissent pour acheter. Un petit 2 % maintient tout le monde en mouvement.',
    expertNote: 'En mode expert, ton score dépend de ta distance à cette cible de 2 %.',
  },
  {
    id: 'q-confiance',
    emoji: '🤝',
    question: 'Pourquoi la CONFIANCE est-elle si importante pour une banque centrale ?',
    options: [
      { text: 'Si les gens la croient, les prix se calment presque tout seuls', correct: true },
      { text: 'Pour gagner des concours de popularité', correct: false },
      { text: 'Ça ne sert à rien', correct: false },
      { text: 'Pour vendre plus de billets', correct: false },
    ],
    explanation: 'Si tout le monde croit que les prix resteront calmes, personne ne panique, personne n’augmente ses prix « au cas où ». La confiance est un vrai super-pouvoir !',
    expertNote: 'En mode expert, c’est la jauge « Crédibilité » (0 à 100).',
  },
  {
    id: 'q-secheresse',
    emoji: '🌵',
    question: 'Une grande sécheresse frappe le pays. Quel effet sur les prix des légumes ?',
    options: [
      { text: 'Ils montent, car il y a moins de récoltes', correct: true },
      { text: 'Ils baissent, car il fait chaud', correct: false },
      { text: 'Aucun effet', correct: false },
      { text: 'Les légumes deviennent gratuits', correct: false },
    ],
    explanation: 'Moins de récoltes = moins de légumes à vendre = tout le monde se les arrache = prix qui montent. C’est ce qu’on appelle un choc !',
    expertNote: 'En mode expert, cela s’appelle un « choc d’offre agricole ».',
  },
  {
    id: 'q-salaire',
    emoji: '💸',
    question: 'Ton salaire ne bouge pas mais tous les prix doublent. Que peux-tu acheter ?',
    options: [
      { text: 'Deux fois moins de choses qu’avant', correct: true },
      { text: 'Deux fois plus de choses', correct: false },
      { text: 'Exactement pareil', correct: false },
      { text: 'Tout le magasin', correct: false },
    ],
    explanation: 'C’est ça le danger de l’inflation : même avec les mêmes billets en poche, tu deviens plus pauvre en vrai. Voilà pourquoi on la surveille de près !',
  },
  {
    id: 'q-chomage',
    emoji: '🏭',
    question: 'Quand l’économie tourne au ralenti (les usines produisent moins), que se passe-t-il souvent ?',
    options: [
      { text: 'Le chômage augmente', correct: true },
      { text: 'Tout le monde trouve un travail', correct: false },
      { text: 'Les vacances sont plus longues', correct: false },
      { text: 'Rien du tout', correct: false },
    ],
    explanation: 'Moins d’activité = moins besoin de bras. C’est pour ça que la banque centrale ne pense pas qu’aux prix : elle garde un œil sur l’emploi.',
    expertNote: 'En mode expert, ce lien s’appelle la « loi d’Okun ».',
  },
  {
    id: 'q-annonce',
    emoji: '📢',
    question: 'La banque centrale annonce : « Nous garderons les prix calmes, promis ». À quoi ça sert ?',
    options: [
      { text: 'À rassurer tout le monde et guider les attentes', correct: true },
      { text: 'À faire joli dans les journaux', correct: false },
      { text: 'À rien, personne n’écoute', correct: false },
      { text: 'À vendre des t-shirts', correct: false },
    ],
    explanation: 'Parler, c’est déjà agir ! Si les commerçants croient l’annonce, ils n’augmentent pas leurs prix par peur, et la promesse se réalise presque toute seule.',
    expertNote: 'En mode expert, cet outil s’appelle la « forward guidance ».',
  },
]

/* ══════════════════════════════════════════════════════════════════
   HISTOIRES — chapitres illustrés
   ══════════════════════════════════════════════════════════════════ */

export type SlideWidget = 'balloon' | 'pedal' | 'seesaw' | 'trust' | null

export interface StorySlide {
  emoji: string
  title: string
  text: string
  funFact?: string
  expertLink?: string
  widget?: SlideWidget
}

export interface StoryChapter {
  id: string
  emoji: string
  title: string
  tagline: string
  color: string
  slides: StorySlide[]
  /** 2 questions rapides de fin de chapitre */
  checkpoint: DiscoveryQuizQuestion[]
  xpReward: number
}

export const STORY_CHAPTERS: StoryChapter[] = [
  {
    id: 'monnaie',
    emoji: '💰',
    title: "C'est quoi l'argent ?",
    tagline: 'Du troc aux billets, en 4 images',
    color: '#C9A86A',
    xpReward: 40,
    slides: [
      {
        emoji: '🐐🔄🌾',
        title: 'Avant, on échangeait...',
        text: 'Il y a très longtemps, pas de billets ! Pour avoir du blé, il fallait échanger une chèvre. Problème : et si le vendeur de blé ne voulait pas de chèvre ? Tout devenait compliqué.',
        funFact: 'Ça s’appelait le troc. Imagine payer ton téléphone en poulets... 🐔',
      },
      {
        emoji: '🪙',
        title: 'Puis la monnaie est née',
        text: 'Les humains ont inventé un objet que TOUT LE MONDE accepte : la monnaie. D’abord des coquillages, puis des pièces en or, puis des billets. La monnaie, c’est de la confiance qu’on se passe de main en main.',
        funFact: 'Au Maroc, la monnaie s’appelle le dirham, un mot vieux de plus de 1 000 ans !',
      },
      {
        emoji: '🏦',
        title: 'Et qui fabrique les billets ?',
        text: 'Une seule institution a le droit de créer les billets d’un pays : la banque centrale. Si n’importe qui pouvait en imprimer, ils ne vaudraient plus rien du tout !',
        expertLink: 'C’est cette banque centrale que tu piloteras dans le mode expert.',
      },
      {
        emoji: '⚖️',
        title: 'Ni trop, ni trop peu',
        text: 'Trop de billets en circulation ? Ils perdent de la valeur et les prix s’envolent. Pas assez ? Plus personne ne peut acheter ni vendre. Tout l’art, c’est de trouver le bon dosage.',
        funFact: 'Dans un pays qui a imprimé trop de billets, un pain a déjà coûté... des milliards ! 🍞💸',
      },
    ],
    checkpoint: [
      {
        id: 'cp-monnaie-1',
        emoji: '🐐',
        question: 'Pourquoi le troc était-il compliqué ?',
        options: [
          { text: 'Il fallait trouver quelqu’un qui veut exactement ce qu’on a', correct: true },
          { text: 'Les chèvres étaient trop mignonnes', correct: false },
          { text: 'Il n’y avait pas de sacs', correct: false },
        ],
        explanation: 'Exactement ! La monnaie a tout simplifié : tout le monde l’accepte, donc plus besoin de trouver l’échange parfait.',
      },
      {
        id: 'cp-monnaie-2',
        emoji: '🖨️',
        question: 'Qui a le droit de fabriquer les billets d’un pays ?',
        options: [
          { text: 'La banque centrale, et elle seule', correct: true },
          { text: 'Tous ceux qui ont une imprimante', correct: false },
          { text: 'Les supermarchés', correct: false },
        ],
        explanation: 'Oui ! C’est justement pour que la monnaie garde sa valeur et que tout le monde lui fasse confiance.',
      },
    ],
  },
  {
    id: 'prix',
    emoji: '🎈',
    title: 'Le ballon des prix',
    tagline: "L'inflation expliquée avec un ballon",
    color: '#C25450',
    xpReward: 40,
    slides: [
      {
        emoji: '🛒',
        title: 'Les prix bougent tout le temps',
        text: 'Tu l’as sûrement remarqué au marché : le prix des tomates, de l’essence ou du pain change. Quand PRESQUE TOUT monte en même temps, on appelle ça l’inflation.',
      },
      {
        emoji: '🎈',
        title: 'Imagine un ballon',
        text: 'Les prix du pays, c’est comme un ballon. Un peu d’air dedans : parfait, il flotte tranquillement. Trop d’air : il gonfle, gonfle... et BOUM ! Pas assez : il retombe tout mou par terre.',
        widget: 'balloon',
        funFact: 'Essaie toi-même : gonfle le ballon avec le curseur ci-dessus !',
      },
      {
        emoji: '🥵',
        title: 'Trop d’inflation, ça fait mal',
        text: 'Si les prix montent trop vite, ton argent de poche achète de moins en moins de choses. Les familles n’arrivent plus à suivre, tout le monde s’inquiète.',
        funFact: 'Avec une inflation de 100 %, un jus à 10 dh coûte 20 dh l’année suivante !',
      },
      {
        emoji: '🥶',
        title: 'Mais des prix qui baissent, c’est pire !',
        text: 'Surprise : des prix qui baissent partout, c’est mauvais signe. Les gens attendent pour acheter (« ça sera moins cher demain »), les magasins ne vendent plus, les emplois disparaissent. L’économie s’endort.',
        expertLink: 'En mode expert, ce piège s’appelle la déflation.',
      },
      {
        emoji: '🎯',
        title: 'Le chiffre magique : 2 %',
        text: 'Voilà pourquoi les banques centrales du monde entier visent une petite inflation d’environ 2 % par an. Le ballon reste juste assez gonflé pour voler, sans risque d’exploser.',
        expertLink: 'En mode expert, ton score dépend de ta capacité à rester proche de cette cible de 2 %.',
      },
    ],
    checkpoint: [
      {
        id: 'cp-prix-1',
        emoji: '🎈',
        question: 'L’inflation, c’est quand...',
        options: [
          { text: 'presque tous les prix montent en même temps', correct: true },
          { text: 'un seul magasin augmente ses prix', correct: false },
          { text: 'les ballons coûtent cher', correct: false },
        ],
        explanation: 'C’est ça ! Un seul prix qui bouge, ce n’est pas l’inflation. C’est le mouvement d’ENSEMBLE qui compte.',
      },
      {
        id: 'cp-prix-2',
        emoji: '🎯',
        question: 'Quelle inflation vise la banque centrale ?',
        options: [
          { text: 'Environ 2 % par an : ni trop, ni trop peu', correct: true },
          { text: '100 % pour aller plus vite', correct: false },
          { text: '0 %, les prix ne doivent jamais bouger', correct: false },
        ],
        explanation: 'Bravo ! 2 %, c’est le point d’équilibre : le ballon vole sans exploser.',
      },
    ],
  },
  {
    id: 'banque',
    emoji: '🏦',
    title: 'La banque des banques',
    tagline: 'Et sa pédale magique : le taux directeur',
    color: '#5C7E92',
    xpReward: 40,
    slides: [
      {
        emoji: '🏦',
        title: 'Une banque très spéciale',
        text: 'La banque centrale ne ressemble pas aux autres : tu ne peux pas y ouvrir un compte. Ses clients, ce sont... les banques elles-mêmes ! Quand elles ont besoin d’argent, c’est elle qui leur en prête.',
        funFact: 'Chaque pays a la sienne ! Dans le jeu, la Banque Centrale s’appelle la CBS.',
      },
      {
        emoji: '💲',
        title: 'Et ce prêt a un prix',
        text: 'Quand la banque centrale prête aux banques, elle leur demande un petit pourcentage en plus : c’est le fameux TAUX DIRECTEUR. C’est LE bouton le plus puissant de toute l’économie.',
        expertLink: 'En mode expert, c’est le premier levier que tu manipules, en points de %.',
      },
      {
        emoji: '🚗',
        title: 'Une pédale de frein... et d’accélérateur',
        text: 'Taux qui MONTE : les crédits deviennent chers, les gens achètent moins, les prix se calment. On FREINE. Taux qui BAISSE : emprunter devient facile, tout le monde consomme et investit. On ACCÉLÈRE.',
        widget: 'pedal',
        funFact: 'Essaie la pédale ci-dessus et regarde l’économie réagir !',
      },
      {
        emoji: '⏳',
        title: 'Attention : ça réagit avec du retard',
        text: 'Quand tu freines, l’économie ne ralentit pas tout de suite. Comme un gros bateau, elle met du temps à tourner : plusieurs mois, parfois un an ! Un bon capitaine anticipe.',
        expertLink: 'En mode expert, chaque tour de jeu = 3 mois (un trimestre). Tes décisions agissent sur plusieurs tours.',
      },
    ],
    checkpoint: [
      {
        id: 'cp-banque-1',
        emoji: '👥',
        question: 'Qui sont les clients de la banque centrale ?',
        options: [
          { text: 'Les banques du pays', correct: true },
          { text: 'Les enfants sages', correct: false },
          { text: 'Les supermarchés', correct: false },
        ],
        explanation: 'Oui ! C’est la banque DES banques. Et grâce à ça, elle influence tous les crédits du pays.',
      },
      {
        id: 'cp-banque-2',
        emoji: '🚗',
        question: 'Pour calmer des prix qui montent trop vite, la banque centrale doit...',
        options: [
          { text: 'augmenter son taux directeur (freiner)', correct: true },
          { text: 'baisser son taux directeur (accélérer)', correct: false },
          { text: 'fermer les magasins', correct: false },
        ],
        explanation: 'Exactement ! Taux plus haut = crédits plus chers = on dépense moins = les prix se calment.',
      },
    ],
  },
  {
    id: 'equilibre',
    emoji: '⚖️',
    title: 'Le grand équilibre',
    tagline: 'Prix calmes OU emplois : pourquoi choisir ?',
    color: '#4A9D7C',
    xpReward: 40,
    slides: [
      {
        emoji: '🤔',
        title: 'Le dilemme du gouverneur',
        text: 'Si freiner calmait les prix sans aucun inconvénient, le métier serait facile ! Mais freiner a un coût : les entreprises vendent moins, investissent moins... et embauchent moins.',
      },
      {
        emoji: '⚖️',
        title: 'Une balançoire à équilibrer',
        text: 'D’un côté : des prix calmes. De l’autre : des emplois pour tous. Appuie trop d’un côté, et l’autre remonte ! Tout le travail de la banque centrale, c’est de garder la balançoire à peu près droite.',
        widget: 'seesaw',
        funFact: 'Joue avec la balançoire ci-dessus pour sentir le dilemme !',
      },
      {
        emoji: '🥵➡️🥶',
        title: 'L’histoire vraie du grand coup de frein',
        text: 'Dans les années 1980 aux États-Unis, les prix montaient de 13 % par an ! Le patron de la banque centrale a freiné très très fort. Les prix se sont calmés... mais le chômage a explosé pendant 2 ans. Un choix douloureux mais courageux.',
        expertLink: 'Tu peux revivre cette histoire dans le mode expert : c’est le scénario « Choc Volcker 1979 ».',
      },
      {
        emoji: '🧭',
        title: 'Ni pompier, ni pyromane',
        text: 'Le secret : agir tôt et en douceur. Petit coup de frein quand ça chauffe, petit coup d’accélérateur quand ça ralentit. Les gestes brusques, eux, cassent la machine.',
        expertLink: 'En mode expert, les changements de cap brutaux font baisser ta jauge de crédibilité.',
      },
    ],
    checkpoint: [
      {
        id: 'cp-equilibre-1',
        emoji: '🏭',
        question: 'Quel est le prix à payer quand on freine trop fort l’économie ?',
        options: [
          { text: 'Plus de chômage', correct: true },
          { text: 'Plus de soleil', correct: false },
          { text: 'Aucun, freiner est gratuit', correct: false },
        ],
        explanation: 'Voilà le dilemme ! C’est pour ça qu’un bon gouverneur dose ses gestes avec précision.',
      },
      {
        id: 'cp-equilibre-2',
        emoji: '🧭',
        question: 'Quelle est la meilleure façon de piloter l’économie ?',
        options: [
          { text: 'Agir tôt, par petites touches douces', correct: true },
          { text: 'Donner de grands coups de volant', correct: false },
          { text: 'Ne jamais rien faire', correct: false },
        ],
        explanation: 'Exactement. Douceur et anticipation : c’est la marque des grands capitaines.',
      },
    ],
  },
  {
    id: 'confiance',
    emoji: '🤝',
    title: 'Le super-pouvoir de la confiance',
    tagline: 'Quand parler suffit à calmer les prix',
    color: '#B41923',
    xpReward: 40,
    slides: [
      {
        emoji: '🔮',
        title: 'Les prix de demain se décident aujourd’hui',
        text: 'Drôle de secret : si tout le monde CROIT que les prix vont monter, chacun augmente les siens « au cas où »... et les prix montent pour de vrai ! Nos attentes fabriquent la réalité.',
        expertLink: 'En mode expert, cela s’appelle les « anticipations d’inflation ».',
      },
      {
        emoji: '🤝',
        title: 'La confiance, arme secrète',
        text: 'Une banque centrale que tout le monde croit n’a presque pas besoin d’agir : elle annonce « les prix resteront calmes », les gens la croient, personne ne panique... et les prix restent calmes. Magique ? Non : crédible !',
        widget: 'trust',
      },
      {
        emoji: '💔',
        title: 'La confiance se perd vite',
        text: 'Mais attention : elle met des années à se construire et un instant à se briser. Une promesse non tenue, des zigzags incompréhensibles... et plus personne n’écoute. Il faut alors freiner deux fois plus fort pour le même résultat.',
        expertLink: 'En mode expert, la jauge « Crédibilité » (0-100) mesure exactement ça.',
      },
      {
        emoji: '📢',
        title: 'Parler, c’est déjà agir',
        text: 'Voilà pourquoi les banquiers centraux pèsent chacun de leurs mots. Une simple phrase en conférence de presse peut faire bouger toute l’économie. Avec la confiance, la parole devient un vrai levier.',
        expertLink: 'En mode expert, cet outil s’appelle la « forward guidance » : tu choisis un ton rassurant, neutre ou ferme.',
      },
    ],
    checkpoint: [
      {
        id: 'cp-confiance-1',
        emoji: '🔮',
        question: 'Que se passe-t-il si tout le monde croit que les prix vont monter ?',
        options: [
          { text: 'Chacun augmente ses prix... et ils montent pour de vrai', correct: true },
          { text: 'Rien, les croyances ne comptent pas', correct: false },
          { text: 'Les prix baissent', correct: false },
        ],
        explanation: 'Oui ! C’est une prophétie auto-réalisatrice. D’où l’importance de rassurer tout le monde.',
      },
      {
        id: 'cp-confiance-2',
        emoji: '🤝',
        question: 'Pourquoi une banque centrale crédible a-t-elle la vie plus facile ?',
        options: [
          { text: 'Ses annonces suffisent à calmer les prix', correct: true },
          { text: 'Elle reçoit des cadeaux', correct: false },
          { text: 'Elle n’a plus besoin de billets', correct: false },
        ],
        explanation: 'Exactement : quand on te croit, ta parole travaille pour toi. C’est le super-pouvoir ultime du gouverneur.',
      },
    ],
  },
]

/* ══════════════════════════════════════════════════════════════════
   JEU DE PRÉDICTIONS — « Devine la suite ! »
   ══════════════════════════════════════════════════════════════════ */

export interface PredictionCard {
  id: string
  emoji: string
  situation: string
  question: string
  optionA: { emoji: string; text: string }
  optionB: { emoji: string; text: string }
  correct: 'A' | 'B'
  explanation: string
}

export const PREDICTION_CARDS: PredictionCard[] = [
  {
    id: 'p-taux-hausse',
    emoji: '📈',
    situation: 'La banque centrale AUGMENTE son taux directeur.',
    question: 'Que deviennent les crédits ?',
    optionA: { emoji: '💸', text: 'Plus chers' },
    optionB: { emoji: '🎁', text: 'Moins chers' },
    correct: 'A',
    explanation: 'Les banques empruntent plus cher à la banque centrale, donc elles prêtent plus cher aussi. C’est le coup de frein !',
  },
  {
    id: 'p-taux-baisse',
    emoji: '📉',
    situation: 'La banque centrale BAISSE son taux directeur.',
    question: 'Que font les gens et les entreprises ?',
    optionA: { emoji: '🛍️', text: 'Ils empruntent et dépensent plus' },
    optionB: { emoji: '🛌', text: 'Ils arrêtent tout et dorment' },
    correct: 'A',
    explanation: 'Crédits pas chers = on achète des maisons, des machines, des voitures. L’économie accélère !',
  },
  {
    id: 'p-secheresse',
    emoji: '🌵',
    situation: 'Une grande sécheresse détruit une partie des récoltes.',
    question: 'Que font les prix des aliments ?',
    optionA: { emoji: '🚀', text: 'Ils montent' },
    optionB: { emoji: '🕳️', text: 'Ils baissent' },
    correct: 'A',
    explanation: 'Moins de récoltes = moins à vendre = tout le monde se les arrache = prix en hausse. Un vrai choc pour le panier des familles.',
  },
  {
    id: 'p-petrole',
    emoji: '⛽',
    situation: 'Le prix du pétrole double dans le monde entier.',
    question: 'Effet sur les prix chez nous ?',
    optionA: { emoji: '📈', text: 'Beaucoup de prix montent (transport, usines...)' },
    optionB: { emoji: '😴', text: 'Aucun effet, on ne roule pas en pétrole' },
    correct: 'A',
    explanation: 'Presque tout ce qu’on achète a voyagé en camion ou est fabriqué en usine. Pétrole cher = tout devient un peu plus cher.',
  },
  {
    id: 'p-surchauffe',
    emoji: '🥵',
    situation: 'Les prix montent de 8 % par an, tout le monde s’inquiète.',
    question: 'Que devrait faire la banque centrale ?',
    optionA: { emoji: '🧊', text: 'Freiner : augmenter son taux' },
    optionB: { emoji: '🔥', text: 'Accélérer : baisser son taux' },
    correct: 'A',
    explanation: 'Quand ça surchauffe, on freine ! Crédits plus chers, dépenses en baisse, et les prix finissent par se calmer.',
  },
  {
    id: 'p-recession',
    emoji: '🥶',
    situation: 'Les usines tournent au ralenti, le chômage grimpe, les prix n’augmentent presque plus.',
    question: 'Que devrait faire la banque centrale ?',
    optionA: { emoji: '🔥', text: 'Accélérer : baisser son taux' },
    optionB: { emoji: '🧊', text: 'Freiner encore plus fort' },
    correct: 'A',
    explanation: 'L’économie a un coup de froid : on baisse le taux pour relancer les crédits, les achats et les embauches.',
  },
  {
    id: 'p-confiance-perdue',
    emoji: '💔',
    situation: 'La banque centrale change d’avis tous les mois et personne ne comprend sa stratégie.',
    question: 'Que devient sa parole ?',
    optionA: { emoji: '🙉', text: 'Plus personne ne l’écoute, elle doit agir plus fort' },
    optionB: { emoji: '👑', text: 'On lui fait encore plus confiance' },
    correct: 'A',
    explanation: 'Les zigzags détruisent la confiance. Et sans confiance, chaque coup de frein doit être deux fois plus violent. Aïe !',
  },
  {
    id: 'p-annonce',
    emoji: '📢',
    situation: 'Une banque centrale très respectée annonce : « Les prix resteront calmes. »',
    question: 'Que font les commerçants ?',
    optionA: { emoji: '😌', text: 'Ils restent tranquilles et ne montent pas leurs prix' },
    optionB: { emoji: '😱', text: 'Ils doublent leurs prix par panique' },
    correct: 'A',
    explanation: 'Quand la banque centrale est crédible, sa parole suffit à garder tout le monde calme. Le super-pouvoir de la confiance !',
  },
  {
    id: 'p-retard',
    emoji: '⏳',
    situation: 'La banque centrale freine aujourd’hui pour calmer les prix.',
    question: 'Quand l’effet se fait-il vraiment sentir ?',
    optionA: { emoji: '📅', text: 'Dans plusieurs mois' },
    optionB: { emoji: '⚡', text: 'Dans la seconde' },
    correct: 'A',
    explanation: 'L’économie est un gros bateau : elle tourne lentement. Un bon capitaine agit tôt, sans attendre que le problème soit énorme.',
  },
  {
    id: 'p-deflation',
    emoji: '🕳️',
    situation: 'Les prix BAISSENT partout depuis des mois.',
    question: 'Bonne ou mauvaise nouvelle ?',
    optionA: { emoji: '😟', text: 'Mauvaise : les gens attendent pour acheter, l’économie s’endort' },
    optionB: { emoji: '🎉', text: 'Excellente : tout est soldé pour toujours' },
    correct: 'A',
    explanation: 'Surprenant mais vrai : si tout baisse, chacun attend demain pour acheter... les magasins ne vendent plus et les emplois disparaissent.',
  },
]

/* ══════════════════════════════════════════════════════════════════
   JEU DES PAIRES — mot d'expert ↔ image simple
   ══════════════════════════════════════════════════════════════════ */

export interface MatchingPair {
  id: string
  /** Le terme tel qu'il apparaît dans le mode expert */
  expert: string
  /** Sa traduction imagée */
  simple: string
  emoji: string
}

export const MATCHING_PAIRS: MatchingPair[] = [
  { id: 'm-inflation',   expert: 'Inflation',            simple: 'Le ballon des prix qui gonfle',            emoji: '🎈' },
  { id: 'm-taux',        expert: 'Taux directeur',       simple: 'La pédale de frein / accélérateur',        emoji: '🚗' },
  { id: 'm-credibilite', expert: 'Crédibilité',          simple: 'La jauge de confiance du public',          emoji: '🤝' },
  { id: 'm-chomage',     expert: 'Taux de chômage',      simple: 'Les gens qui cherchent du travail',        emoji: '💼' },
  { id: 'm-pib',         expert: 'Croissance du PIB',    simple: 'Le gâteau du pays qui grandit',            emoji: '🎂' },
  { id: 'm-choc',        expert: "Choc d'offre",         simple: 'Une sécheresse ou un pétrole plus cher',   emoji: '🌵' },
  { id: 'm-guidance',    expert: 'Forward guidance',     simple: 'Rassurer tout le monde en parlant',        emoji: '📢' },
  { id: 'm-credit',      expert: 'Canal du crédit',      simple: 'Le chemin du taux jusqu’à ton prêt auto',  emoji: '💳' },
]

/* ══════════════════════════════════════════════════════════════════
   BADGES DU MODE DÉCOUVERTE
   ══════════════════════════════════════════════════════════════════ */

export interface DiscoveryBadge {
  id: string
  emoji: string
  title: string
  description: string
  color: string
}

export const DISCOVERY_BADGES: DiscoveryBadge[] = [
  { id: 'premiere-lecon',  emoji: '🌟', title: 'Premier pas',          description: 'Terminer ta première histoire',              color: '#C9A86A' },
  { id: 'grand-lecteur',   emoji: '📚', title: 'Grand Lecteur',        description: 'Terminer les 5 histoires',                   color: '#5C7E92' },
  { id: 'sans-faute',      emoji: '🎯', title: 'Sans faute',           description: 'Réussir un quiz parfait (100 %)',            color: '#4A9D7C' },
  { id: 'en-feu',          emoji: '🔥', title: 'En feu !',             description: '8 bonnes prédictions d’affilée',             color: '#C25450' },
  { id: 'champion-paires', emoji: '🧩', title: 'Champion des paires',  description: 'Finir le jeu des paires sans erreur',        color: '#C9A86A' },
  { id: 'ballon-dor',      emoji: '🏅', title: 'Ballon d’Or',          description: 'Garder le ballon dans la zone verte à 80 %', color: '#C9A86A' },
  { id: 'capitaine',       emoji: '⛵', title: 'Capitaine',            description: 'Terminer ta première mission',               color: '#5C7E92' },
  { id: 'trois-etoiles',   emoji: '✨', title: 'Trois étoiles',        description: 'Réussir une mission avec 3 étoiles',         color: '#B41923' },
  { id: 'legende',         emoji: '👑', title: 'Légende',              description: 'Atteindre le niveau Sage de l’Économie',     color: '#B41923' },
]

export function getDiscoveryBadge(id: string): DiscoveryBadge | undefined {
  return DISCOVERY_BADGES.find(b => b.id === id)
}

/* ══════════════════════════════════════════════════════════════════
   MISSION CAPITAINE — la simulation vulgarisée
   ══════════════════════════════════════════════════════════════════ */

export const MISSION_QUARTERS = 12

/**
 * État de départ de la mission : les prix s'emballent depuis des mois
 * (économie en surchauffe, anticipations désancrées). C'est un vrai défi
 * de désinflation : freiner trop tue les emplois, ne rien faire laisse
 * les prix s'envoler. Les décisions du joueur comptent vraiment.
 */
export const MISSION_INITIAL_STATE: EconomicState = {
  quarter: 0,
  date: { year: 2025, q: 1 },

  inflation: 4.6,
  inflationCore: 4.2,
  inflationExpected: 4.2,

  gdpGrowth: 3.8,
  outputGap: 1.2,
  unemployment: 10.2,

  policyRate: 2.75,
  interbankRate: 2.75,
  lendingRate: 5.20,

  reserveRequirement: 4.0,
  creditGrowth: 6.5,
  liquidityNeed: 80.0,
  nplRatio: 7.5,

  exchangeRate: 100.0,
  externalDemand: 0.3,

  centralBankCredibility: 65,
  currentAccountBalance: -2.5,
  fiscalStance: 'neutral',

  financialInnovationActive: false,
  assetBubbleIndex: 0,
}

export type MissionChoiceId = 'brake' | 'hold' | 'boost'

export interface MissionChoice {
  id: MissionChoiceId
  emoji: string
  label: string
  description: string
  /** Traduction en langage expert (affichée avec les lunettes 🤓) */
  expertNote: string
  policyRateChangeBp: number
  color: string
}

export const MISSION_CHOICES: MissionChoice[] = [
  {
    id: 'brake',
    emoji: '🧊',
    label: 'Calmer les prix',
    description: 'Rendre les crédits plus chers pour freiner la machine.',
    expertNote: 'Taux directeur : +0,75 % (politique restrictive)',
    policyRateChangeBp: 75,
    color: '#5C7E92',
  },
  {
    id: 'hold',
    emoji: '🛡️',
    label: 'Ne rien changer',
    description: 'Garder le cap : parfois, la patience est la meilleure décision.',
    expertNote: 'Taux directeur inchangé (statu quo)',
    policyRateChangeBp: 0,
    color: '#C9A86A',
  },
  {
    id: 'boost',
    emoji: '🔥',
    label: 'Réchauffer l’économie',
    description: 'Rendre les crédits moins chers pour relancer les achats et les emplois.',
    expertNote: 'Taux directeur : −0,75 % (politique accommodante)',
    policyRateChangeBp: -75,
    color: '#C25450',
  },
]

/** Événements scénarisés de la mission (des chocs traduits en langage simple) */
export interface MissionEvent {
  atQuarter: number
  emoji: string
  news: string
  shock: Shock
}

export const MISSION_EVENTS: MissionEvent[] = [
  {
    atQuarter: 1,
    emoji: '🌵',
    news: 'Grande sécheresse ! Les récoltes sont mauvaises : les fruits et légumes deviennent plus chers au marché.',
    shock: {
      id: 'mission_drought',
      label: 'Sécheresse',
      type: 'supply',
      magnitude: 0.5,
      remainingQuarters: 2,
      description: 'Mauvaises récoltes : les prix alimentaires grimpent.',
      inflationImpact: 1.1,
      outputGapImpact: -0.4,
      lendingRateImpact: 0,
      externalDemandImpact: 0,
    },
  },
  {
    atQuarter: 4,
    emoji: '🌍',
    news: 'Nos voisins traversent une petite crise : ils achètent beaucoup moins de nos produits. Les usines ralentissent.',
    shock: {
      id: 'mission_external',
      label: 'Ralentissement chez les voisins',
      type: 'external',
      magnitude: 0.5,
      remainingQuarters: 2,
      description: 'La demande étrangère faiblit : les exportations reculent.',
      inflationImpact: -0.2,
      outputGapImpact: -0.7,
      lendingRateImpact: 0,
      externalDemandImpact: -1.0,
    },
  },
  {
    atQuarter: 8,
    emoji: '🛍️',
    news: 'Fièvre d’achats dans tout le pays ! Les magasins sont pris d’assaut... et les prix repartent vers le haut.',
    shock: {
      id: 'mission_demand',
      label: 'Fièvre d’achats',
      type: 'demand',
      magnitude: 0.5,
      remainingQuarters: 2,
      description: 'La demande s’emballe : pression à la hausse sur les prix.',
      inflationImpact: 0.6,
      outputGapImpact: 0.8,
      lendingRateImpact: 0,
      externalDemandImpact: 0,
    },
  },
]

/** Traduit un choc aléatoire du moteur en flash info tout simple */
export function plainShockNews(shock: Shock): { emoji: string; text: string } {
  const id = shock.id
  if (id.startsWith('oil')) {
    return { emoji: '⛽', text: 'Le pétrole coûte plus cher dans le monde : le transport et plein de produits augmentent.' }
  }
  if (id.startsWith('agricultural') || id.startsWith('drought') || id.includes('drought')) {
    return { emoji: '🌾', text: 'Mauvaises récoltes cette saison : les aliments coûtent plus cher au marché.' }
  }
  if (id.startsWith('external')) {
    return { emoji: '🌍', text: 'Nos voisins achètent moins chez nous : les usines tournent au ralenti.' }
  }
  if (id.startsWith('risk')) {
    return { emoji: '🏦', text: 'Les banques ont un peu peur : elles prêtent moins facilement.' }
  }
  if (id.startsWith('capital')) {
    return { emoji: '✈️', text: 'Des investisseurs retirent leur argent du pays : la finance se tend.' }
  }
  return { emoji: '⚡', text: `Événement surprise : ${shock.description}` }
}

/* ── Jauges à émotions (traduction des indicateurs experts) ─────── */

export interface MoodGauge {
  emoji: string
  label: string
  color: string
  /** Position 0-100 sur la jauge */
  pct: number
  /** Nom de l'indicateur en mode expert */
  expertName: string
  /** Valeur exacte formatée pour les lunettes d'expert */
  expertValue: string
}

/** 🎈 Les prix — traduit l'inflation */
export function pricesMood(inflation: number): MoodGauge {
  const pct = Math.max(0, Math.min(100, ((inflation + 2) / 10) * 100))
  const expertValue = `Inflation : ${inflation.toFixed(1)} % par an (cible : 2 %)`
  if (inflation < 0)   return { emoji: '🥶', label: 'Les prix baissent... mauvais signe !', color: '#5C7E92', pct, expertName: 'Inflation', expertValue }
  if (inflation < 1)   return { emoji: '😴', label: 'Prix très (trop ?) calmes', color: '#5C7E92', pct, expertName: 'Inflation', expertValue }
  if (inflation <= 3)  return { emoji: '😊', label: 'Prix tranquilles, zone idéale !', color: '#4A9D7C', pct, expertName: 'Inflation', expertValue }
  if (inflation <= 5)  return { emoji: '😬', label: 'Les prix commencent à chauffer', color: '#C9A86A', pct, expertName: 'Inflation', expertValue }
  return { emoji: '🥵', label: 'Les prix s’envolent !', color: '#C25450', pct, expertName: 'Inflation', expertValue }
}

/** 💼 Les emplois — traduit le chômage */
export function jobsMood(unemployment: number): MoodGauge {
  const pct = Math.max(0, Math.min(100, (1 - (unemployment - 6) / 10) * 100))
  const expertValue = `Taux de chômage : ${unemployment.toFixed(1)} %`
  if (unemployment < 9)    return { emoji: '😄', label: 'Presque tout le monde travaille !', color: '#4A9D7C', pct, expertName: 'Chômage', expertValue }
  if (unemployment < 11.5) return { emoji: '🙂', label: 'Le travail se porte bien', color: '#4A9D7C', pct, expertName: 'Chômage', expertValue }
  if (unemployment < 13)   return { emoji: '😟', label: 'Le travail se fait plus rare', color: '#C9A86A', pct, expertName: 'Chômage', expertValue }
  return { emoji: '😢', label: 'Beaucoup de gens cherchent un travail', color: '#C25450', pct, expertName: 'Chômage', expertValue }
}

/** 🤝 La confiance — traduit la crédibilité */
export function trustMood(credibility: number): MoodGauge {
  const pct = Math.max(0, Math.min(100, credibility))
  const expertValue = `Crédibilité de la banque centrale : ${Math.round(credibility)} / 100`
  if (credibility >= 80) return { emoji: '🤝', label: 'On te fait énormément confiance', color: '#4A9D7C', pct, expertName: 'Crédibilité', expertValue }
  if (credibility >= 60) return { emoji: '🙂', label: 'On te fait plutôt confiance', color: '#4A9D7C', pct, expertName: 'Crédibilité', expertValue }
  if (credibility >= 40) return { emoji: '😕', label: 'Les gens commencent à douter de toi', color: '#C9A86A', pct, expertName: 'Crédibilité', expertValue }
  return { emoji: '😠', label: 'Plus grand monde ne te croit...', color: '#C25450', pct, expertName: 'Crédibilité', expertValue }
}

/** 🎂 Le gâteau du pays — traduit la croissance du PIB */
export function growthMood(gdpGrowth: number): MoodGauge {
  const pct = Math.max(0, Math.min(100, ((gdpGrowth + 2) / 8) * 100))
  const expertValue = `Croissance du PIB : ${gdpGrowth.toFixed(1)} % par an`
  if (gdpGrowth >= 4)  return { emoji: '🚀', label: 'Le pays produit à toute vitesse !', color: '#4A9D7C', pct, expertName: 'Croissance PIB', expertValue }
  if (gdpGrowth >= 2)  return { emoji: '😊', label: 'Le gâteau du pays grandit bien', color: '#4A9D7C', pct, expertName: 'Croissance PIB', expertValue }
  if (gdpGrowth >= 0)  return { emoji: '😐', label: 'Le pays avance au ralenti', color: '#C9A86A', pct, expertName: 'Croissance PIB', expertValue }
  return { emoji: '📉', label: 'Le pays produit moins qu’avant !', color: '#C25450', pct, expertName: 'Croissance PIB', expertValue }
}

/* ── Saisons de la mission ──────────────────────────────────────── */

const SEASONS = ['🌸 Printemps', '☀️ Été', '🍂 Automne', '❄️ Hiver'] as const

export function missionSeasonLabel(quarter: number): string {
  const year = Math.floor(quarter / 4) + 1
  return `${SEASONS[quarter % 4]} · Année ${year}`
}

/* ── Verdict de fin de mission ──────────────────────────────────── */

/**
 * La manœuvre « de manuel » pour un état donné.
 * C'est LA règle que le mode Découverte enseigne (et que Floussi conseille) :
 * freiner quand les prix chauffent, réchauffer quand l'économie gèle.
 */
export function textbookChoice(state: EconomicState): MissionChoiceId {
  if (state.inflation > 3.2) return 'brake'
  if (state.inflation < 1.2 || state.unemployment > 12 || state.outputGap < -1.5) return 'boost'
  return 'hold'
}

export interface MissionVerdict {
  stars: 0 | 1 | 2 | 3
  score: number
  title: string
  comment: string
  /** Nombre de manœuvres « de manuel » réussies */
  goodMoves: number
  totalMoves: number
  /** Conseils personnalisés en langage simple */
  tips: string[]
}

/**
 * Note la mission sur 100 :
 * résultats économiques (prix, emplois, stabilité, confiance) + qualité
 * du pilotage (a-t-on manœuvré dans le bon sens au bon moment ?).
 *
 * @param fullHistory états successifs, état initial inclus (longueur = tours + 1)
 * @param actions     choix du joueur à chaque tour
 */
export function computeMissionVerdict(
  fullHistory: EconomicState[],
  actions: MissionChoiceId[],
): MissionVerdict {
  const results = fullHistory.slice(1)
  if (results.length === 0 || actions.length === 0) {
    return { stars: 0, score: 0, title: 'Mission écourtée', comment: 'La mission s’est terminée trop vite pour être notée.', goodMoves: 0, totalMoves: 0, tips: [] }
  }

  const avgInflationGap =
    results.reduce((sum, s) => sum + Math.abs(s.inflation - 2), 0) / results.length
  const avgUnemployment =
    results.reduce((sum, s) => sum + s.unemployment, 0) / results.length
  const avgAbsOutputGap =
    results.reduce((sum, s) => sum + Math.abs(s.outputGap), 0) / results.length
  const finalTrust = results[results.length - 1].centralBankCredibility

  // Pilotage (30 pts) : chaque tour, la décision va-t-elle dans le bon sens ?
  let pilotScore = 0
  let goodMoves = 0
  actions.forEach((choice, i) => {
    const seen = fullHistory[i] // l'état que le joueur avait sous les yeux
    const expected = textbookChoice(seen)
    if (choice === expected) {
      pilotScore += 1
      goodMoves += 1
    } else if (choice === 'hold' || expected === 'hold') {
      pilotScore += 0.4 // prudence excessive ou geste doux : pas parfait, pas grave
    }
    // sens totalement opposé (chauffer quand ça brûle...) : 0 point
  })
  const pilotPts = 30 * (pilotScore / actions.length)

  // Prix (25 pts) : parfait à 0 d'écart de la cible, nul à 2,5 pts d'écart
  const pricePts = Math.max(0, Math.min(25, 25 * (1 - avgInflationGap / 2.5)))
  // Emplois (12 pts) : parfait à 9,5 % de chômage, nul à 13 %
  const jobsPts = Math.max(0, Math.min(12, 12 * (1 - (avgUnemployment - 9.5) / 3.5)))
  // Stabilité (13 pts) : ni surchauffe ni récession (|output gap| moyen faible)
  const stabilityPts = Math.max(0, Math.min(13, 13 * (1 - avgAbsOutputGap / 2.5)))
  // Confiance (20 pts) : parfait à 85+, nul sous 30
  const trustPts = Math.max(0, Math.min(20, 20 * ((finalTrust - 30) / 55)))

  const score = Math.round(pilotPts + pricePts + jobsPts + stabilityPts + trustPts)
  // Seuils calibrés empiriquement : suivre la règle de manuel ≈ 58-62 pts,
  // stratégies extrêmes (toujours freiner / toujours chauffer) ≈ 40-46 pts.
  const stars: 0 | 1 | 2 | 3 = score >= 58 ? 3 : score >= 50 ? 2 : score >= 30 ? 1 : 0

  const tips: string[] = []
  const pilotRatio = goodMoves / actions.length
  if (pilotRatio >= 0.7) {
    tips.push(`🧭 Superbe pilotage : ${goodMoves} manœuvres de manuel sur ${actions.length} ! Tu freines quand ça chauffe et tu réchauffes quand ça gèle.`)
  } else {
    tips.push(`🧭 Ton gouvernail : ${goodMoves} manœuvres de manuel sur ${actions.length}. Rappel du réflexe : prix qui s’envolent → freiner 🧊, économie gelée → réchauffer 🔥.`)
  }
  if (avgInflationGap > 1.6) {
    tips.push('🎈 Les prix sont restés trop loin de la zone idéale. Face à des prix qui s’emballent, freine tôt et tiens bon plusieurs saisons !')
  } else {
    tips.push('🎈 Bravo, tu as ramené le ballon des prix vers la zone idéale. C’était la partie la plus dure !')
  }
  if (avgUnemployment > 11.5) {
    tips.push('💼 Beaucoup de gens ont cherché du travail pendant ton mandat. Quand les prix se calment enfin, pense à relâcher le frein.')
  } else if (avgAbsOutputGap > 1.8) {
    tips.push('🌡️ L’économie a fait les montagnes russes (trop chaude, puis trop froide...). Les petits gestes réguliers battent les grands coups de volant.')
  } else {
    tips.push('💼 Les emplois ont plutôt bien résisté sous ton commandement.')
  }
  if (finalTrust < 60) {
    tips.push('🤝 Ta cote de confiance a souffert : évite les zigzags (freiner puis accélérer d’un coup) et rapproche les prix de la cible.')
  } else {
    tips.push('🤝 Le public a gardé confiance en toi jusqu’au bout. C’est la marque des grands !')
  }

  const title =
    stars === 3 ? 'Capitaine légendaire !' :
    stars === 2 ? 'Très bon capitaine' :
    stars === 1 ? 'Capitaine en apprentissage' :
    'Naufrage évité de justesse...'

  const comment =
    stars === 3 ? 'Prix calmes, emplois solides, confiance intacte : tu as toutes les qualités d’un vrai gouverneur. Le mode expert t’attend !' :
    stars === 2 ? 'Un pilotage solide malgré les tempêtes. Encore un peu d’entraînement et les 3 étoiles sont à toi.' :
    stars === 1 ? 'Tu as tenu la barre jusqu’au bout, c’est déjà beaucoup ! Relis les histoires et retente ta chance.' :
    'L’économie a beaucoup tangué... Pas grave : chaque grand capitaine a commencé par un naufrage. Rejoue !'

  return { stars, score, title, comment, goodMoves, totalMoves: actions.length, tips }
}

/* ── Conseil du tour (aide contextuelle en langage simple) ───────── */

export function missionAdvice(state: EconomicState): { emoji: string; text: string } {
  // Le conseil suit exactement la « règle de manuel » notée par le verdict :
  // Floussi ne doit jamais dire une chose et le score en récompenser une autre.
  const expected = textbookChoice(state)
  if (expected === 'brake') {
    return state.inflation > 4.2
      ? { emoji: '🥵', text: 'Les prix s’envolent ! Un bon coup de frein (🧊) s’impose, même s’il faudra plusieurs saisons pour en voir l’effet.' }
      : { emoji: '😬', text: 'Les prix chauffent encore trop. Garder le pied sur le frein (🧊) semble raisonnable.' }
  }
  if (expected === 'boost') {
    return state.unemployment > 12
      ? { emoji: '💼', text: 'Beaucoup de gens cherchent du travail. Réchauffer l’économie (🔥) peut relancer les embauches.' }
      : { emoji: '🥶', text: 'L’économie a un coup de froid. Un peu de chaleur (🔥) l’aiderait à repartir.' }
  }
  return { emoji: '😊', text: 'Tout est à peu près en équilibre. Parfois, la meilleure décision est de ne rien changer (🛡️) !' }
}

/* ── Astuces de la mascotte ─────────────────────────────────────── */

export const MASCOT_TIPS_HUB: string[] = [
  'Bienvenue ! Moi c’est Floussi 🪙, ta pièce porte-bonheur. Je t’accompagne partout ici !',
  'Commence par les Histoires 📖 : 5 petites aventures pour tout comprendre sans une seule formule.',
  'Chaque activité te fait gagner des points d’expérience (XP). Monte de niveau jusqu’à devenir Sage de l’Économie 🦉 !',
  'La Mission Capitaine ⛵ te fait piloter une vraie économie... celle du mode expert, mais sans les chiffres compliqués !',
  'Astuce : dans la mission, mets les lunettes 🤓 pour découvrir les vrais mots des économistes.',
  'Quand tu te sentiras à l’aise, tente le mode expert 🏛️ : c’est la même économie, avec toutes les manettes !',
]

export const MASCOT_TIPS_MISSION: string[] = [
  'Tes trois jauges racontent tout : les prix 🎈, les emplois 💼 et la confiance 🤝.',
  'Rappelle-toi : tes décisions agissent avec du retard, comme un gros bateau qui tourne.',
  'La zone verte des prix, c’est autour de 2 %. Ni trop chaud, ni trop froid !',
  'Évite les zigzags : freiner puis accélérer d’un coup fait fondre la confiance.',
  'Mets les lunettes d’expert 🤓 pour voir les vrais chiffres derrière les émojis !',
]
