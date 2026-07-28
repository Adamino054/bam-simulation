# CBS — Centrale Bank Simulateur · Documentation complète du site

> **Usage de ce dossier** : ce document décrit exhaustivement ce que fait l'application, écran par écran, modèle par modèle, avec 35 captures d'écran dans le dossier `captures/`. Il est conçu pour être donné tel quel à un assistant IA (ou à un relecteur humain) afin de rédiger un rapport de stage : toutes les informations factuelles (formules, paramètres, barèmes, flux) proviennent directement du code source, dont les chemins sont cités.

---

## 1. Fiche d'identité du projet

| | |
|---|---|
| **Nom** | CBS — Centrale Bank Simulateur (« Central Bank Simulator ») |
| **Nature** | Serious game web : le joueur incarne le gouverneur de la **Banque Centrale** d'une économie émergente inspirée du Maroc et pilote la politique monétaire trimestre par trimestre |
| **Cadre** | Projet de Fin d'Année (PFA), commandité par la Banque Centrale du Royaume du Maroc |
| **Objectif pédagogique** | Rendre tangibles les mécanismes de transmission de la politique monétaire, pour deux publics : le grand public (Mode Découverte, zéro formule) et les étudiants/professionnels (Mode Expert, simulation académique complète) |
| **Stack** | Next.js 16 (App Router, Turbopack) · React 18 · TypeScript strict · Zustand v5 (état global persisté) · Tailwind CSS · Framer Motion (animations) · Recharts (graphiques) · KaTeX (formules) · Lucide (icônes) |
| **Backend** | Aucun serveur de données : tout est persisté en `localStorage` navigateur. Deux routes API server-side seulement : `/api/chat` (coach IA) et `/api/central-bank-policy` (synchronisation du taux directeur réel) |
| **Déterminisme** | Chaque partie a une graine (`seed`) : mêmes décisions + même graine = même trajectoire. C'est ce qui rend le duel multijoueur équitable et les bugs reproductibles |

---

## 2. Architecture technique

### 2.1 Arborescence

| Dossier | Contenu |
|---|---|
| `engine/` | **Moteur macroéconomique pur** : TypeScript sans aucune dépendance à React/Next/Zustand (règle d'or du projet — testable en ligne de commande). Contient : `state.ts`, `parameters.ts`, `simulator.ts`, `scoring.ts`, `scenarios.ts`, `campaigns.ts`, `difficulty.ts`, `pressConferences.ts`, `quizzes.ts`, `badges.ts`, `botMessages.ts`, `monteCarlo.ts`, `discovery.ts`, `centralBankPolicy.ts`, `historicalMacro.ts`, plus `models/` (isCurve, phillips, taylorRule, creditChannel, monetaryMarket) et `shocks/` (oil, agricultural, externalDemand, capitalFlight, riskPremium, base) |
| `store/` | 4 stores Zustand persistés : `gameStore` (partie Expert, clé `cbs-game-state`), `authStore` (comptes et profils, clé `cbs-auth`), `multiplayerStore` (duel/coop, clé `cbs-multiplayer`), `discoveryStore` (progression Découverte par pseudo, clé `cbs-discovery`) |
| `app/` | Pages Next.js App Router (19 écrans + 2 routes API, cartographiés au §3) |
| `components/` | `game/` (DecisionPanel, Dashboard, Timeline, LeftPanel, BloombergTicker, PressConferenceModal, OnboardingTour, TurnButton, DebriefChart, FanChartModal, EconomyChart, HistoryDrawer, ShockBannerList, BotHelpPopover…), `ui/` (AssistantBot, MetricCard, QuizCard, NotePad, BadgeDisplay, CourseDiagrams, GovernorCertificate, PerformanceRadar, InlineKatex, NewsAlert, Sparkline, Toast…), `discovery/` (Floussi, Mascot, Coach, GameFx, QuizGame, PredictionGame, MatchingGame, BalloonGame, BigGauge, StoryWidgets, Confetti, DiscoveryHeader), `shell/` (Header, ThemeToggle) |
| `lib/` | `constants.ts` (cible 2 %, bornes des instruments…), `design-tokens.ts` (palette institutionnelle rouge #B41923/or/vert/bleu + deux thèmes clair/sombre en variables CSS), `format.ts`, `typography.ts`, `audio.ts` |
| `public/docs/` | **Les 5 documents du projet intégrés au site** (voir §9) |

### 2.2 Comptes et persistance

- Authentification **100 % locale** (`store/authStore.ts`) : un compte = pseudo + mot de passe haché côté client (hash simple non cryptographique, assumé : aucune donnée sensible).
- Chaque profil (`PlayerProfile`) stocke : `gameHistory` (mandats terminés : scénario, score, grade, moyennes d'inflation/croissance/crédibilité, niveau, mode libre ou non), `badges`, `quizScores` (par module et par niveau), `notes` (prise de notes de cours), `preferredLevel`.
- Fermer l'onglet ne perd rien ; vider le `localStorage` efface tout. `/admin` liste les comptes du poste ; `/players` en fait un palmarès public trié.

### 2.3 Design system

`lib/design-tokens.ts` définit la palette (rouge institutionnel #B41923, or, vert, bleu) et les deux thèmes clair/sombre exposés en variables CSS ; Tailwind les consomme via `tailwind.config.ts`. Tout le style passe par les tokens (`var(--text-primary)`, etc.), jamais de couleurs codées en dur. Un `ThemeToggle` (soleil/lune) est présent sur chaque écran. Typographies : une éditoriale à empattements pour les titres (esprit « rapport annuel de banque centrale »), une mono pour les données.

---

## 3. Carte complète des écrans

Après connexion, la page `/choix` oriente le joueur vers l'un des **deux univers** : le **Mode Découverte** (grand public, zéro formule) ou le **Mode Expert** (simulation académique complète). Les deux partagent le même compte mais ont chacun leur progression.

| Route | Écran | Rôle | Capture |
|---|---|---|---|
| `/` | Landing page | Vitrine animée (hero, parallaxe) ; le bouton d'action mène au login ou au hub selon l'état de connexion | 01–03 |
| `/login` | Connexion | Inscription et connexion locales par pseudo + mot de passe | 04–05 |
| `/choix` | Choix du mode | Aiguillage post-connexion : Découverte 🐣 ou Expert 🏛 (affiche le niveau XP découverte) | 06 |
| `/decouverte` | Hub Découverte | Accueil vulgarisé : Histoires, Salle de Jeux, Mission, progression XP | 07 |
| `/decouverte/histoire` | Les Histoires | Chapitres illustrés avec points de contrôle quiz | 08–09 |
| `/decouverte/jeux` | La Salle de Jeux | 4 mini-jeux pédagogiques avec records et étoiles de maîtrise | 10–11 |
| `/decouverte/millionaire` | Jeu du Millionaire | Quiz progressif type « Qui veut gagner des millions » économique | 12 |
| `/decouverte/mission` | La Mission | Simulation simplifiée par « saisons », notée en étoiles | 13–14 |
| `/dashboard` | Hub Expert | Statistiques du joueur, choix du scénario de mandat et du niveau, reprise de partie | 15 |
| `/play` | Écran de jeu | La simulation elle-même : décisions, graphiques, ticker, assistant | 30–33 |
| `/debrief` | Débrief | Score détaillé de fin de mandat, commentaire, diplôme, enregistrement au profil | 34–35 |
| `/campaign` | Brief de campagne | Contexte historique, KPI de départ, conditions de victoire/défaite | — |
| `/multiplayer` | Multijoueur | Duel de Gouverneurs (compétitif) ou Co-Gouvernance (coopératif), à deux sur le même poste | 25 |
| `/courses` | Académie | 8 modules de cours théoriques avec quiz notés, prise de notes, badges, documents de référence | 16–18 |
| `/training` | Entraînement | Laboratoire sandbox (équations en direct) + accès aux campagnes historiques | 19 |
| `/lab` | Laboratoire | Exploration interactive des équations IS/Phillips et prévisions stochastiques | 20 |
| `/history` | Mon historique | Parties passées du joueur, distribution des grades | 21 |
| `/players` | Palmarès | Classement public des gouverneurs (tous les comptes locaux + personnages fictifs) | 22 |
| `/admin` | Admin | Vue d'administration des comptes joueurs enregistrés sur le poste | 23 |
| `/about` | À propos | Présentation du projet, méthodologie **et les 5 documents du projet** | 24 |
| `/api/chat` | API | Coach IA (Gemini) avec repli automatique sur le guide local | — |
| `/api/central-bank-policy` | API | Récupère le taux directeur et la réserve obligatoire réels sur le site de la banque centrale (avec table de repli historique 2008→2025) | — |
| `/docs/*.html` et `.pdf` | Documents | Les présentations du projet servies statiquement | 26–29 |

---

## 4. Description détaillée écran par écran

### 4.1 Landing page `/` (captures 01, 02, 03)

Page vitrine publique animée : hero éditorial avec le nom du jeu, slogan, boutons « Jouer » / « Accéder aux cours », sections de présentation des fonctionnalités (simulation, académie, multijoueur), aperçu graphique de l'économie (EcoPreviewChart), et footer avec liens Cours / Entraînement / Simulation / À propos. L'assistant Floussi est déjà présent en bas à droite (contexte « landing »).

### 4.2 Connexion `/login` (captures 04, 05)

Deux onglets : **Connexion** et **Inscription**. Champs pseudo + mot de passe (avec œil d'affichage), messages d'erreur animés (secousse), redirection vers `/choix` en cas de succès. Aucune donnée ne quitte le navigateur.

### 4.3 Choix du mode `/choix` (capture 06)

Aiguillage à deux grandes cartes : **Mode Découverte** (« pour tout comprendre sans une seule formule ») et **Mode Expert** (« la simulation académique complète »). Affiche le niveau XP Découverte du joueur s'il existe. C'est le cœur du positionnement « éco inclusif » du projet : deux portes d'entrée pour deux publics.

### 4.4 Mode Découverte

Univers entièrement vulgarisé (`engine/discovery.ts` + `store/discoveryStore.ts`) : **pas une seule formule**, des métaphores du quotidien (la baguette à 2 dh, le « ballon des prix », la pédale de frein/accélérateur), la mascotte **Floussi** (une pièce de monnaie qui parle) et un système **XP/niveaux/badges** indépendant du mode Expert, sauvegardé par pseudo.

- **Hub `/decouverte`** (capture 07) : accueil avec les 4 activités (Histoires, Salle de Jeux, Million, Mission), barre d'XP, badges.
- **Les Histoires `/decouverte/histoire`** (captures 08, 09) : chapitres illustrés slide par slide — la naissance de la monnaie, le ballon des prix, **la banque des banques** (et sa « pédale magique » : le taux directeur), le grand équilibre… Chaque chapitre est ponctué de **points de contrôle quiz** et rapporte de l'XP (une seule fois par chapitre). Des encarts « fun fact » et « lien expert » font le pont vers le vocabulaire officiel.
- **La Salle de Jeux `/decouverte/jeux`** (captures 10, 11) : 4 mini-jeux très visuels avec effets partagés (`components/discovery/GameFx.tsx` : anneau de score SVG, pop d'XP, explosion de particules, flamme de série, bannière de record) et écrans de fin uniformes (anneau + 3 étoiles + record). Les **étoiles de maîtrise** (12 max) sont agrégées dans le menu :
  1. **Le Grand Quiz** — 8 questions sans jargon, avec explication amicale et « note expert » (record : meilleur score) ;
  2. **Prédictions** — deviner l'effet d'un événement sur l'économie (record : meilleure série) ;
  3. **Paires magiques** — memory associant chaque terme expert à sa métaphore (record : moins d'erreurs) ;
  4. **Le Gardien du 2 %** — maintenir le « ballon des prix » dans la zone verte en dosant frein et accélérateur (record : % de temps en zone). Capture 11.
- **Le Million `/decouverte/millionaire`** (capture 12) : quiz à paliers façon « Qui veut gagner des millions », questions économiques de difficulté croissante.
- **La Mission `/decouverte/mission`** (captures 13, 14) : la passerelle vers le mode Expert. Écran d'intro « **Mission Capitaine** » : « Le pays te confie la barre de son économie pendant 2 ans (8 saisons) » — bouton « **Prendre la barre !** ». En jeu : 4 jauges à émojis (Les prix 🎈, Les emplois 💼, La confiance 🤝, Le gâteau du pays 🎂), un flash info par saison, les conseils de Floussi, et **une seule décision par saison** : *Calmer les prix* (frein) / *Ne rien changer* / *Réchauffer l'économie* (accélérateur). Un encart « Secret de fabrication » assume la passerelle : « cette mission tourne sur le VRAI moteur économique du mode expert — les mêmes équations, cachées derrière des émojis » ; des « **lunettes d'expert** » affichent les vrais chiffres. Le verdict final est noté en **étoiles** avec un axe « résultats » et un axe « **pilotage** » (30 pts) qui note la conformité des décisions à la politique qu'un manuel recommanderait (`textbookChoice()` : freiner si l'inflation dépasse 3,2 %, etc.) — les conseils de Floussi (`missionAdvice()`) dérivent de la même fonction pour que conseil et notation restent cohérents. Seuils d'étoiles calibrés empiriquement : 3★ ≥ 58, 2★ ≥ 50, 1★ ≥ 30.

### 4.5 Hub Expert `/dashboard` (capture 15)

Point d'entrée du mode Expert : cartes de statistiques personnelles (parties jouées, score moyen, meilleur grade, scénario favori, taux de réussite), **sélection du scénario de mandat** et du **niveau de difficulté**, reprise d'une partie en cours, **palmarès intégré**, et navigation vers tous les autres écrans. Le bouton « Commencer la partie » affiche « Synchronisation Banque Centrale… » pendant qu'il récupère le taux directeur réel (voir §8).

### 4.6 Écran de jeu `/play` (captures 30, 31, 32, 33)

L'écran central de la simulation, en 3 colonnes :

- **HUD gauche** (`LeftPanel`) : état « BANQUE CENTRALE T1 2025 · STABLE », bulletin de conjoncture rédigé, les 4 **objectifs de politique monétaire** avec leur état en temps réel (Stabilité des prix — cible 1,5-2,5 % ; Plein potentiel PIB — zone confort −1,5/+1,5 ; Crédibilité ≥ 70 ; Stabilité financière NPL < 10 %), jauge de crédibilité (CRITIQUE/FRAGILE/MODÉRÉE/SOLIDE), métriques monétaires (taux directeur, TMP, taux débiteur, crédit) et chocs actifs.
- **Centre** : cartes de métriques animées (Inflation, Croissance PIB, Chômage, Output gap, Crédibilité, Solde courant), **graphiques Recharts** à onglets (Activité / Taux / Financier) avec cible d'inflation en pointillés, et le **ticker « Bloomberg CBS Feed »** : bandeau défilant de dépêches économiques contextuelles.
- **Panneau de décision droit** (`DecisionPanel`) : les instruments du trimestre (selon le niveau), l'assistant, la **cible règle de Taylor** affichée en aide (aux niveaux qui y ont droit, avec l'écart en points de base), et le bouton « **Trimestre suivant →** » (`TurnButton`, devient « Terminer la partie → » au dernier trimestre).
- **Frise du mandat** (`Timeline`) en haut : progression T1→T20, pastilles annuelles notées vert/ambre/rouge selon la déviation moyenne de l'inflation à la cible (≤ 0,5 pp / ≤ 1 pp / au-delà), événement saisonnier (ex. « Ramadan & Semis »).
- **Visite guidée** (`OnboardingTour`, capture 30) à la première partie : tutoriel pas à pas de l'interface (panneau de décision → tableau de bord → frise → validation du trimestre), avec « Passer l'introduction complète ».
- **Conférence de presse annuelle** (`PressConferenceModal`, capture 33) : une fois par an, un journaliste d'un média fictif (« L'Économiste », « Médias24 »…) interpelle le gouverneur en direct (« CBS Direct · Conférence de Presse Annuelle »). **Trois déclarations officielles possibles**, chacune avec des effets immédiats chiffrés sur la crédibilité, les anticipations d'inflation, le taux débiteur, l'output gap ou la liquidité — c'est la mécanique qui matérialise le rôle de la *communication* dans la politique monétaire. Flash d'appareils photo à l'envoi.
- **Alertes chocs** (`NewsAlert`/`ShockBannerList`) : bandeaux « FLASH INFO — BANQUE CENTRALE » à l'arrivée d'un choc (sécheresse, pétrole, fuite de capitaux…).
- **Mode libre** : 25 trimestres sans mandat imposé, pour expérimenter.

#### Les 7 instruments de politique monétaire

| Instrument | Champ (`PolicyAction`) | Plage | Effet principal |
|---|---|---|---|
| Taux directeur | `policyRateChangeBp` | −100 à +100 bp, pas de 25 | Transmission via TMP → taux débiteur → demande (courbe IS) |
| Réserves obligatoires | `reserveRequirementChangeBp` | −200 à +200 bp, pas de 50 | Liquidité bancaire et spread interbancaire |
| Opérations d'open market | `marketOperationsBnMad` | injection/ponction −20 à +20 mds MAD | Besoin de liquidité du système |
| Forward guidance | `communicationStance` | dovish / neutral / hawkish | Ancrage des anticipations d'inflation |
| Intervention de change | `fxInterventionBnMad` | −10 à +30 mds MAD | Réserves de change, stabilité externe, crédibilité |
| Prêt d'urgence | `emergencyLendingBnMad` | 0 / 5 / 10 / 20 mds MAD | Soutien au système bancaire en crise (NPL, crédit) |
| Coussin contracyclique (CCyB) | `ccybRate` | 0 à 2,5 % | Outil macroprudentiel : freine le crédit en surchauffe, protège en crise |

### 4.7 Débrief `/debrief` (captures 34, 35)

Fin de mandat : **grade A→F** et score final (ex. capture 34 : Grade A, 73/80 au niveau Débutant), commentaire rédigé du mandat, détail des 4 axes de score avec jauges (Stabilité des prix, Croissance, Stabilité trajectoire, Crédibilité), **« Félicitations, vous êtes diplômé ! »** avec bouton « Réclamer mon diplôme » (certificat de gouverneur nominatif généré, `GovernorCertificate`), radar de performance, graphique comparatif du mandat (votre taux vs **règle de Taylor théorique** vs **taux réel historique** de la banque centrale sur la même période), rapport du Gouverneur (meilleure décision / plus grosse erreur), **fiche pédagogique « Que s'est-il réellement passé historiquement ? »** (texte factuel par scénario : décisions réelles de la Banque Centrale en 2020, 2022, 2018+ ; Volcker 1979 ; crise 2008), synthèse vocale du commentaire (Web Speech API), et enregistrement automatique du `GameRecord` au profil — c'est lui qui alimente l'historique et le palmarès.

### 4.8 Campagnes historiques `/campaign` et `/training` (capture 19)

Deux scénarios spéciaux (`engine/campaigns.ts`) transposent des épisodes célèbres, en format court **8 trimestres** avec conditions de victoire/défaite explicites, briefés sur `/campaign` (contexte, KPI de départ, objectifs) avant lancement :

| Campagne | Situation initiale | Victoire | Défaite |
|---|---|---|---|
| **Choc Volcker 1979** | Inflation 15 %, anticipations désancrées (12 %), crédibilité 35/100 | Inflation < 3,0 % au 8ᵉ trimestre, crédibilité toujours > 0 | Crédibilité à 0 (démission forcée) ou inflation ≥ 3 % à la fin |
| **Crise Systémique 2008** | NPL à 18 %, crédit en contraction (−4 %), besoin de liquidité critique (220 mds MAD) | NPL < 10 % et croissance du crédit > 2 % à la fin | Canal du crédit non restauré à l'issue des 8 trimestres |

Le `gameStore` détecte la fin de campagne et fixe `campaignStatus` à `won` ou `lost`. La page `/training` sert de hub d'entraînement : sandbox d'équations + accès à ces campagnes.

### 4.9 Multijoueur local `/multiplayer` (capture 25)

Deux joueurs sur le même poste, store dédié (`store/multiplayerStore.ts`) avec phases explicites : `setup → playing → turnTransition/quarterReview → finished`.

- **Duel de Gouverneurs (compétitif)** : deux banques centrales **rivales** — chaque joueur pilote sa propre économie (états, chocs et historiques séparés) avec la **même graine aléatoire** (mêmes chocs pour les deux, seule la politique diffère). **Écran de passage de relais** entre les tours pour que l'autre joueur ne voie pas les choix adverses ; **bilan trimestriel comparatif** côte à côte ; en fin de partie, scores comparés + **badges humoristiques** attribués aux deux joueurs.
- **Co-Gouvernance (coopératif)** : une **seule économie partagée** — les deux joueurs doivent chacun **verrouiller** leur accord (`p1Locked`/`p2Locked`) pour valider la décision commune du trimestre.

### 4.10 Académie `/courses` (captures 16, 17, 18)

- **8 modules théoriques** progressifs, groupés par catégories (Fondamentaux, Instruments, Modèles…) : 01 La Politique Monétaire (mandat de la Banque centrale), 02 Le Taux Directeur, la courbe IS, la courbe de Phillips, la règle de Taylor, les canaux de transmission, les chocs, la stabilité financière. Chaque module contient : vue d'ensemble, points clés, **formule rendue en KaTeX** avec légende, **exemple marocain réel**, conseil de jeu (« game tip » relié au simulateur), et un **diagramme interactif** dédié (`CourseDiagrams` : chaîne de transmission, courbes IS/Phillips, graphique de la règle de Taylor comparant taux Taylor et taux observé de la banque centrale 2022/2024, matrice des chocs, zones de risque NPL).
- **Quiz notés par module** (`engine/quizzes.ts`) avec **trois niveaux d'étude** (Débutant/Intermédiaire/Expert) sélectionnables ; les scores sont enregistrés au profil par niveau.
- **Prise de notes intégrée** (NotePad) par module, persistée.
- **Onglet « Mes Badges & Succès »** : la collection de badges (voir §6.3).
- **Section « Aller plus loin — documents de référence »** (capture 18, ajoutée lors de cette itération) : liens vers la présentation des modèles mathématiques, le dossier théorique et le guide des fonctionnalités PDF (voir §9).

### 4.11 Laboratoire `/lab` et Entraînement `/training` (captures 19, 20)

- **Sandbox d'équations** : manipuler en direct la courbe IS *(ỹₜ = ρỹₜ₋₁ − σ(i^D − πᵉ) + δỹ*)* et la courbe de Phillips *(πₜ = βπᵉ + κỹₜ)* avec des curseurs pour chaque paramètre et visualisation immédiate de l'effet.
- **Prévisions stochastiques** (`engine/monteCarlo.ts`) : éventails de trajectoires (« fan charts » à la Banque d'Angleterre) à 4 trimestres par tirages gaussiens sur IS & Phillips — la matérialisation visuelle de l'incertitude des prévisions. Également accessible en jeu via `FanChartModal`.

### 4.12 Historique `/history`, Palmarès `/players`, Admin `/admin` (captures 21, 22, 23)

- **`/history`** : cartes de toutes les parties passées du joueur (scénario, niveau, score, grade, moyennes) + distribution des grades.
- **`/players`** : « Classement des Gouverneurs » — palmarès mêlant les comptes réels du poste et des personnages fictifs de référence : **Gouverneur Floussi (96 pts, « Gouverneur de Légende »)**, Taylor Rule Bot (91), Ilyass E. (87), Prof. Alami (82), Claude Sonnet (78), Simulation Rookie (52). Le joueur y prend rang selon son meilleur score, avec des titres par palier (Platine ≥ 90, Or ≥ 80, Argent ≥ 70, Bronze ≥ 50). Message d'ambition : « Battez le score historique de 96 points du légendaire Gouverneur Floussi ».
- **`/admin`** : table d'administration des comptes locaux (pseudo, statistiques, suppression).

### 4.13 À propos `/about` (capture 24)

Présentation du projet (PFA commandité par la Banque centrale du Royaume du Maroc, moteur isolé du code d'interface, courbe de Phillips augmentée des anticipations, courbe IS dynamique, canal du crédit, marché monétaire stylisé, calibration sur la littérature des économies émergentes à régime de change administré) **+ la section « Documents du projet »** (ajoutée lors de cette itération) avec les 5 documents cliquables (voir §9).

---

## 5. Le moteur macroéconomique (`engine/`)

Le cœur scientifique du projet. La fonction `step(state, action, shocks, seed)` (`engine/simulator.ts`) fait passer l'économie d'un trimestre au suivant en enchaînant **10 blocs** dans cet ordre :

1. **Nouveau taux directeur et réserves obligatoires** — application de la décision (bornes : taux ∈ [0,5 % ; 10 %], pas de 25 bp).
2. **Marché monétaire** (`models/monetaryMarket.ts`) — calcul du **TMP** (taux moyen pondéré interbancaire) : système de corridor autour du taux directeur, plus un spread croissant avec les créances en souffrance et le manque de liquidité : `TMP = i* + α_liq·(NPL/10) + (L−80)×0,002`.
3. **Canal du crédit** (`models/creditChannel.ts`) — taux débiteur en **ajustement partiel** (λ = 0,35 : ~3 trimestres de répercussion, marge bancaire 2,0 pts) ; croissance du crédit selon l'activité, le coût du crédit et les anticipations (θ = 4,0/0,8/0,5/0,3) ; **amplification à la Bernanke & Gertler (1995)** volontairement surcalibrée pour rendre le mécanisme visible en quelques trimestres ; pénalité NPL (1 pt de NPL en plus → −0,5 pt de croissance du crédit).
4. **Courbe IS** (`models/isCurve.ts`) — demande réagissant au taux débiteur réel et aux anticipations : **ỹₜ = ρ·ỹₜ₋₁ − σ·(i^D − πᵉ) + δ·ỹ* + u^y** avec ρ = 0,70 (persistance), σ = 0,12 (sensibilité au taux réel, volontairement faible : capital peu mobile), δ = 0,30 (ouverture, demande extérieure).
5. **Courbe de Phillips** (`models/phillips.ts`) — inflation tirée par les anticipations et l'output gap : **πₜ = β·πᵉ + κ·ỹₜ + α·Δp^imp + u^π** avec β = 0,95 (poids des anticipations — la désinflation vient surtout de l'ancrage par la crédibilité), κ = 0,15 (pente), α = 0,08 (pass-through de change), γ = 0,20 (sensibilité aux chocs agricoles, part agricole > 10 % du PIB). Inflation core lissée 0,6/0,4.
6. **Indicateurs dérivés** — croissance du PIB autour d'un potentiel de 3,0 % ; **loi d'Okun dynamique** Δu = −λ·Δỹ avec λ = 0,40 (calibrage économies MENA), chômage naturel 9,5 % ; NPL : base 7,0 %, sensibilité 0,8 au taux débiteur et 1,5 à la récession.
7. **Crédibilité, compte courant, politique budgétaire** — la crédibilité de la banque centrale (0-100, départ 70) évolue selon les résultats et la cohérence des décisions (les revirements brusques coûtent) ; elle conditionne l'ancrage de πᵉ avec la forward guidance.
8. **Décrément des chocs actifs** (durée restante).
9. **Nouveaux chocs aléatoires** — tirés selon le scénario et le multiplicateur du niveau (×0,6 débutant / ×1,0 / ×1,4 expert), familles : offre (pétrole, agricole/sécheresse), demande (demande extérieure), financier (fuite de capitaux, prime de risque), avec durées et impacts propres (`engine/shocks/`).
10. **Nouvel état** — assemblage de l'`EconomicState` du trimestre suivant.

**Règle de Taylor** affichée en aide (non contraignante) : **i = r* + π + φ_π·(π − π*) + φ_y·ỹ** avec r* = 1,5 %, π* = 2,0 %, φ_π = 1,50 (principe de Taylor respecté), φ_y = 0,50.

**État économique** (`EconomicState`) : trimestre, date, inflation (totale/core/anticipée), croissance PIB, output gap, chômage, taux (directeur/interbancaire/débiteur), réserves obligatoires, croissance du crédit, besoin de liquidité, ratio NPL, taux de change, demande extérieure, crédibilité, solde courant, politique budgétaire, innovation financière, indice de bulle d'actifs.

**État initial calibré** (scénario standard, T1 2025) : inflation 2,1 %, croissance 4,8 %, chômage 13,3 %, output gap +0,84, taux directeur 2,25 %, taux débiteur 4,70 %, réserves obligatoires 0 %, NPL 8,19 %, crédibilité 70/100, solde courant −2,5 % du PIB — valeurs alignées sur les données réelles récentes (voir §8).

**Les 6 scénarios** (`engine/scenarios.ts`) : Scénario standard (situation de départ normale) · Choc inflationniste 2022 (inflation 4 %, chocs énergétiques) · Choc COVID-2020 (choc de demande) · Flexibilité du dirham (transition de change) · Choc Volcker 1979 (hyperinflation, désancrage sévère) · Crise Systémique 2008 (contraction du crédit, explosion des NPL). Chaque scénario porte une description et des conseils **différents selon le niveau choisi** (`descriptionByLevel`, `hintsByLevel`) — le même écran parle simplement au débutant et techniquement à l'expert.

**Prévisions Monte-Carlo** (`engine/monteCarlo.ts`) : à partir de l'état courant, simulation de dizaines de trajectoires à 4 trimestres avec bruits gaussiens sur IS et Phillips, rendues en éventail de quantiles (fan chart).

---

## 6. Systèmes de jeu

### 6.1 Niveaux de difficulté (`engine/difficulty.ts`)

| Paramètre | 🌱 Débutant | 📈 Intermédiaire | 🎯 Expert |
|---|---|---|---|
| Instruments visibles | 3 (taux, réserves, open market) | 5 (+ forward guidance, change) | 7 (+ prêt d'urgence, CCyB) |
| Durée du mandat | 16 trimestres | 20 trimestres | 25 trimestres |
| Probabilité de chocs | × 0,6 | × 1,0 | × 1,4 |
| Poids du score (inflation/croissance/stabilité/crédibilité) | 35/20/15/10 (total 80) | 35/25/20/20 (total 100) | 40/20/20/20 (total 100) |
| Tolérance d'inflation (scoring) | ± 1,5 pp | ± 1,0 pp | ± 0,5 pp |
| Seuils de grade A/B/C/D | 70/55/40/25 | 85/70/55/40 | 90/80/65/50 |
| Aides (hint Taylor, recommandations) | Toutes | Hint Taylor seul | Aucune |
| Métriques avancées (NPL, CCyB…) | Masquées | Masquées | Affichées |

### 6.2 Score de fin de mandat (`engine/scoring.ts`)

Quatre axes, pondérés selon le niveau :
- **Stabilité des prix** : déviation absolue moyenne de l'inflation à la cible de 2 % ; plein score dans la tolérance du niveau, décroissance linéaire jusqu'à 0 à 4 pp.
- **Croissance** : croissance moyenne du PIB, maximum à 4 % (seuil plancher : 0,5 % débutant / 1,0 / 1,5 expert).
- **Stabilité macro** : variance de l'inflation + ½ variance de l'output gap (dénominateur 7/5/3 selon niveau) ; **en Expert uniquement**, pénalité macroprudentielle de −2 pts par point de NPL moyen au-dessus de 7,5 %.
- **Crédibilité** : crédibilité moyenne sur le mandat (plein score à 80+, plancher 20/30/40 selon niveau).

Le total est converti en **grade A→F** selon les seuils du niveau, accompagné d'un commentaire rédigé (`generateCommentary`) et d'un rapport du Gouverneur (meilleure décision, plus grosse erreur).

### 6.3 Badges et progression

- **Badges Expert** (`engine/badges.ts`), trois catégories : *cours* (Fondamentaux, Modéliste, Technicien, Survivant, Maître Économiste — > 80 % à tous les quiz), *simulation* (Première Partie, Grade A…), *maîtrise*.
- **Badges Découverte** : liés aux mini-jeux, aux chapitres d'histoires et à la « Légende » (niveau XP max).
- **Badges multijoueur humoristiques** : attribués en fin de duel/coop.
- **Système XP Découverte** : toutes les activités rapportent de l'XP ; six niveaux — 🐣 Curieux (0) → 🎒 Apprenti (120) → 🧭 Explorateur (300) → 🪙 As de la Monnaie (550) → ⚓ Capitaine (850) → 🦉 Sage de l'Économie (1 200). Le dernier niveau débloque le badge « Légende ».

### 6.4 Conférences de presse (`engine/pressConferences.ts`)

Une par année de mandat. Question d'un journaliste fictif, trois réponses possibles, chacune appliquant immédiatement des effets chiffrés (crédibilité, anticipations, taux débiteur, output gap, liquidité) via `answerPressConference()` du `gameStore`.

---

## 7. Intelligence artificielle intégrée

- **AssistantBot / coach Floussi** (`components/ui/AssistantBot.tsx` + `app/api/chat/route.ts`) : présent sur la landing, en cours et en jeu. Interroge l'API **Gemini** côté serveur avec un prompt système strict (rôle de conseiller de politique monétaire, ne pas inventer de données ni de décisions de la Banque Centrale) et le contexte de jeu. **Résilience** : indicateur d'état (« Connexion sécurisée… » → « Gemini connecté » / « Guide CBS actif ») et **repli automatique** sur un moteur de réponses local à base de règles (`engine/botMessages.ts`, réponses expertes rédigées sur la CBS, les scénarios, les instruments, la règle de Taylor…) si l'API est indisponible — l'assistant ne tombe jamais en panne.
- **Recommandations contextuelles en jeu** (niveau Débutant) : messages de situation (« La situation macroéconomique est globalement stable. Ajustez vos taux avec parcimonie. »).
- **Floussi Découverte** (`components/discovery/Floussi.tsx`, `Coach.tsx`) : la mascotte commente chaque saison de la Mission avec des conseils dérivés de la même logique que la notation (cohérence conseil/score).

---

## 8. Ancrage sur les données réelles

- **Synchronisation du taux directeur réel** (`engine/centralBankPolicy.ts` + `app/api/central-bank-policy/route.ts`) : au lancement d'une partie (scénarios ≥ 2008), l'application interroge la page officielle « Historique des décisions de politique monétaire » du site de la banque centrale, **parse le HTML en français** (dates « 17 mars 2020 », « taux directeur x,xx % », « réserve obligatoire ») et initialise la partie avec le taux directeur et la réserve obligatoire **réellement en vigueur à la date du scénario**. En cas d'échec réseau, une **table de repli historique** couvre 2008→2025 (3,25 % en 2008 → 1,50 % en juin 2020 → 3,00 % en mars 2023 → 2,25 % en mars 2025). Le bouton de lancement affiche « Synchronisation Banque Centrale… » pendant l'appel.
- **Calibration du moteur** : littérature économies émergentes à change rigide, rapports annuels de la Banque Centrale (2019-2024), modèle QPM du FMI adapté au Maroc, PNUD Morocco Macro Model (2022). Détail paramètre par paramètre dans `SPECIFICATIONS_ACADEMIQUES.md` et le Dossier théorique (§9).
- **Fiches historiques du débrief** : textes factuels sur les décisions réelles (résumés au §4.7).
- **Comparaison en débrief** : votre trajectoire de taux vs la trajectoire réelle du taux directeur sur la période du scénario.

---

## 9. Les documents du projet intégrés au site

Cinq documents produits pendant le stage, désormais **servis par le site** depuis `public/docs/` et accessibles depuis deux endroits : la page **À propos** (les 5) et la section « **Aller plus loin** » de l'**Académie** (les 3 académiques). Ils s'ouvrent dans un nouvel onglet.

| Document | URL | Contenu |
|---|---|---|
| **Présentation — Les modèles mathématiques** (« Les maths de CBS, sans les maths ») | `/docs/presentation-modeles-mathematiques.html` | 15 diapositives : les 8 modèles du moteur expliqués en français courant, chacun avec **son propre mini-simulateur interactif** (bougez un curseur, le résultat se recalcule avec les vraies formules du moteur) ; détail technique repliable (formule exacte, symboles, sources) |
| **Dossier théorique des modèles** (« D'où viennent les formules de CBS ») | `/docs/dossier-theorique-modeles.html` | 14 pages : pour chaque équation, la généalogie académique (corridor de taux/Woodford, IS/Phillips nouvelle-keynésienne, Bernanke & Gertler, Okun, Taylor, fan charts/Banque d'Angleterre, Svensson, Tobin, Mundell-Fleming…), ce qui est standard vs simplification pédagogique assumée, la calibration constante par constante avec sa justification dans le code, et la bibliographie complète |
| **Business Model Canvas — Éco Inclusif** | `/docs/business-model-canvas.html` | Le canvas complet du projet : proposition de valeur, segments (grand public et élèves servis gratuitement ; enseignants/établissements, institutions publiques et ONG payeurs), ressources, canaux, structure de coûts et revenus (licences établissements 40 %, licences B2B 30 %, subventions & mécénat 20 %, ateliers & certifications 10 %) |
| **Présentation du Business Model** | `/docs/presentation-business-model.html` | La version présentation du canvas : mission d'inclusion économique et stratégie de diffusion |
| **Guide des fonctionnalités (PDF)** | `/docs/guide-fonctionnalites-cbs.pdf` | 12 pages : toute l'application expliquée écran par écran — le document d'accueil des stagiaires (mise en route, carte des écrans, comptes, mode Expert, campagnes, multijoueur, apprendre, mode Découverte, progression, moteur, architecture, glossaire) |

---

## 10. Travaux réalisés dans cette itération (juillet 2026)

1. **Anonymisation institutionnelle complète** : toute mention du nom propre de la banque centrale marocaine (nom complet, abréviations « BAM »/« BKAM ») a été remplacée par « **Banque Centrale** » dans l'intégralité du site — textes d'interface, fiches historiques du débrief, prompt du coach IA, réponses du bot, contenu Découverte, commentaires du code, documents HTML, spécifications académiques, placeholder du login. Le nom et prénom de l'ancien gouverneur ont été **supprimés partout** ; l'entrée « légende » du palmarès (96 pts) est désormais portée par le personnage fictif **Gouverneur Floussi** (la mascotte du jeu). Renommages techniques associés : module `engine/bkamPolicy.ts` → `engine/centralBankPolicy.ts`, route `/api/bkam-policy` → `/api/central-bank-policy`, fonctions (`fetchCentralBankPolicySettings`…), identifiants internes (`bam-speech-*` → `cbs-speech-*`, clés localStorage, keyframes CSS, variables). *Seule subsiste l'URL du site officiel dans le code serveur — c'est la source de données du taux réel, jamais affichée à l'écran.*
2. **Intégration des documents** : les 4 présentations HTML + le guide PDF ont été déplacés dans `public/docs/` avec des URL propres, et reliés au site : section « Documents du projet » sur `/about`, section « Aller plus loin — documents de référence » en bas de `/courses`.
3. **Vérifications** : typecheck TypeScript strict ✅, build de production Next.js ✅ (24 routes), visite automatisée complète du site en production (Playwright headless) avec une partie Expert jouée du premier trimestre au débrief ✅, zéro erreur console.

---

## 11. Index des captures d'écran (`captures/`)

| # | Fichier | Ce qu'on y voit |
|---|---|---|
| 01 | `01-accueil-hero.png` | Landing page — hero éditorial, titre du jeu, boutons d'action |
| 02 | `02-accueil-fonctionnalites.png` | Landing — sections fonctionnalités (simulation, académie…) |
| 03 | `03-accueil-bas-de-page.png` | Landing — bas de page, CTA cours, footer (Cours/Entraînement/Simulation/À propos) |
| 04 | `04-login.png` | Écran de connexion (onglets Connexion/Inscription) |
| 05 | `05-inscription.png` | Formulaire d'inscription rempli (pseudo « Stagiaire ») |
| 06 | `06-choix-du-mode.png` | Aiguillage post-connexion : Mode Découverte vs Mode Expert |
| 07 | `07-decouverte-hub.png` | Hub Découverte : Histoires, Salle de Jeux, Million, Mission, barre d'XP (page entière) |
| 08 | `08-decouverte-histoires.png` | Menu des chapitres d'histoires illustrés (page entière) |
| 09 | `09-decouverte-histoire-lecture.png` | Lecture d'un chapitre (« La banque des banques ») slide par slide |
| 10 | `10-decouverte-salle-de-jeux.png` | Menu des 4 mini-jeux avec records et étoiles de maîtrise (page entière) |
| 11 | `11-decouverte-jeu-gardien.png` | Mini-jeu « Le Gardien du 2 % » (ballon des prix) en jeu |
| 12 | `12-decouverte-millionaire.png` | Jeu du Million (quiz à paliers) |
| 13 | `13-decouverte-mission.png` | Écran d'intro « Mission Capitaine » (8 saisons, 3 décisions, bouton « Prendre la barre ! ») |
| 14 | `14-decouverte-mission-jeu.png` | La Mission en jeu : Printemps · Année 1, 4 jauges émojis, conseil de Floussi, 3 choix de saison |
| 15 | `15-dashboard-expert.png` | Hub Expert après une partie : stats remplies, choix scénario/niveau, palmarès (page entière) |
| 16 | `16-academie-cours.png` | Académie : en-tête, niveau d'étude des quiz, navigation par catégories |
| 17 | `17-academie-module-ouvert.png` | Module 01 « La Politique Monétaire » ouvert (théorie, points clés) |
| 18 | `18-academie-documents-reference.png` | Section « Aller plus loin — documents de référence » (3 cartes de documents) |
| 19 | `19-entrainement.png` | Page Entraînement : sandbox + campagnes historiques (page entière) |
| 20 | `20-laboratoire.png` | Laboratoire : équations IS/Phillips interactives, prévisions Monte-Carlo (page entière) |
| 21 | `21-mon-historique.png` | Mon historique avec la partie jouée (Grade A) et distribution des grades (page entière) |
| 22 | `22-palmares.png` | Classement des Gouverneurs — Gouverneur Floussi en tête (96 pts) (page entière) |
| 23 | `23-admin.png` | Vue admin des comptes du poste (page entière) |
| 24 | `24-a-propos-documents.png` | À propos + section « Documents du projet » (5 documents) (page entière) |
| 25 | `25-multijoueur.png` | Multijoueur : setup Duel de Gouverneurs / Co-Gouvernance (page entière) |
| 26 | `26-doc-presentation-modeles-math.png` | Document intégré : « Les maths de CBS, sans les maths » (diapo 1/15) |
| 27 | `27-doc-dossier-theorique.png` | Document intégré : dossier théorique des modèles |
| 28 | `28-doc-business-model-canvas.png` | Document intégré : Business Model Canvas Éco Inclusif |
| 29 | `29-doc-presentation-bmc.png` | Document intégré : présentation du Business Model |
| 30 | `30-visite-guidee.png` | Visite guidée (onboarding) à la première partie |
| 31 | `31-ecran-de-jeu.png` | Écran de jeu T1 : HUD gauche, métriques, graphiques, panneau de décision, ticker |
| 32 | `32-ecran-de-jeu-en-mandat.png` | Écran de jeu après plusieurs trimestres (courbes remplies) |
| 33 | `33-conference-de-presse.png` | Conférence de presse annuelle (question du journaliste, 3 déclarations) |
| 34 | `34-debrief-haut.png` | Débrief : Grade A · 73/80, commentaire, diplôme, 4 axes de score |
| 35 | `35-debrief-complet.png` | Débrief complet : radar, comparaison Taylor/taux réel, fiche historique (page entière) |

---

## 12. Glossaire express

| Terme | Définition |
|---|---|
| Taux directeur (i*) | Le taux fixé par la banque centrale ; frein/accélérateur de l'économie |
| Inflation (π) / cible | Hausse générale des prix ; la cible du jeu est 2,0 % par an |
| Output gap (ỹ) | Écart entre production observée et potentielle ; positif = surchauffe |
| Anticipations (πᵉ) | Inflation attendue par les agents ; « désancrées » = plus personne ne croit à la cible |
| TMP | Taux moyen pondéré du marché interbancaire ; premier maillon de la transmission |
| Taux débiteur (i^D) | Taux des crédits bancaires au secteur privé ; celui qui touche l'économie réelle |
| NPL | Créances en souffrance des banques ; élevées, elles bloquent le canal du crédit |
| Forward guidance | Communication sur la politique future (dovish/neutral/hawkish) pour guider les anticipations |
| CCyB | Coussin de fonds propres contracyclique : outil macroprudentiel (0 à 2,5 %) |
| Crédibilité | Capital de confiance de la banque centrale (0-100) ; conditionne l'ancrage des anticipations |
| Règle de Taylor | Taux « recommandé » en fonction de l'inflation et de l'output gap ; affichée en aide aux niveaux bas |
| Seed / graine | Nombre qui fixe l'aléatoire d'une partie ; la rejouer à l'identique reproduit les mêmes chocs |

---

*Document généré le 27 juillet 2026 · source de vérité : le code du dépôt (chemins cités dans chaque section) · captures prises sur le build de production.*
