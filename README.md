# CBS - Centrale Bank Simulateur

CBS est un serious game web pedagogique consacre aux mecanismes de politique monetaire. Le joueur incarne un gouverneur de banque centrale et prend des decisions de politique monetaire dans plusieurs contextes macroeconomiques.

Le projet sert de support d'apprentissage pour illustrer, de maniere interactive, les arbitrages entre inflation, activite economique, stabilite financiere, credibilite et transmission monetaire.

## Fonctionnalites principales

- Simulation de politique monetaire avec plusieurs scenarios.
- Modes de difficulte : debutant, intermediaire et expert.
- Scenarios standards, scenarios de crise et scenarios historiques calibres.
- Espace de decouverte avec contenus interactifs.
- Section cours avec modules pedagogiques, quiz et visualisations.
- Section entrainement pour tester des situations ciblees.
- Laboratoire de simulation et analyses Monte-Carlo.
- Mode multijoueur.
- Debriefing final avec score, trajectoires et certificat.
- Assistant CBS integre.

## Technologies

| Couche | Technologie |
| --- | --- |
| Framework | Next.js 16.2.5, App Router, Turbopack |
| Langage | TypeScript |
| Interface | React 18 |
| Style | Tailwind CSS et CSS global |
| Etat | Zustand avec persistance locale |
| Animations | Framer Motion |
| Graphiques | Recharts |
| Formules | KaTeX et react-katex |
| Icones | Lucide React |

## Lancement local

Depuis le dossier du projet :

```bash
npm install
npm run dev
```

Puis ouvrir :

```text
http://localhost:3000
```

Sous PowerShell, si `npm` est bloque par la politique d'execution, utiliser :

```powershell
npm.cmd install
npm.cmd run dev
```

## Commandes utiles

```bash
npm run dev
```

Lance le serveur de developpement.

```bash
npm run build
```

Compile l'application pour la production.

```bash
npm run start
```

Lance l'application compilee apres `npm run build`.

```bash
npm run lint
```

Verifie la qualite du code avec ESLint.

```bash
npm run typecheck
```

Verifie les types TypeScript sans generer de build.

## Architecture du projet

```text
app/                  Pages Next.js et routes applicatives
components/           Composants React reutilisables
engine/               Moteurs de simulation, scenarios, scoring et donnees
engine/models/        Blocs macroeconomiques du moteur standard
engine/v5/            Moteur historique et donnees calibrees
engine/shocks/        Definitions et gestion des chocs
lib/                  Fonctions utilitaires
store/                Etat global et persistance locale
public/fonts/         Polices locales utilisees par le theme graphique
```

## Pages principales

```text
/                     Accueil
/choix                Choix du mode
/dashboard            Simulation principale
/play                 Simulation rapide
/courses              Cours et quiz
/training             Entrainement
/lab                  Laboratoire et Monte-Carlo
/campaign             Campagne
/decouverte           Decouverte pedagogique
/multiplayer          Multijoueur
/debrief              Debriefing et certificat
/history              Historique local
/players              Classement local
/about                A propos du projet
/videos               Videos pedagogiques
```

## Moteur de simulation

Le dossier `engine/` contient la logique de simulation en TypeScript. Il regroupe les scenarios, les etats economiques, les decisions de politique monetaire, les chocs, les calculs de score, les projections et les modules de simulation historique.

Les scenarios historiques utilisent un moteur calibre separe dans `engine/v5/`. Les autres scenarios utilisent le moteur standard du site.

## Scoring

Le score final est calcule sur 100 points. Il tient compte de la stabilite des prix, de l'activite economique, de la credibilite et de la coherence des decisions selon le type de scenario joue.

Le score sert d'indicateur pedagogique : il aide l'utilisateur a comprendre les consequences de ses decisions, sans remplacer une evaluation economique reelle.

## Polices et theme graphique

Les polices du site sont integrees localement dans `public/fonts/` afin de conserver le meme rendu graphique sans dependre d'un telechargement externe au moment du build.

Ne pas supprimer `public/fonts/`, car ce dossier est necessaire au theme d'ecriture du site.

## Variables d'environnement

Le fichier `.env.example` donne les variables attendues. Certaines fonctionnalites, comme l'assistant, peuvent utiliser une cle API si elle est configuree dans l'environnement local.

## Verification avant envoi

Avant de transmettre ou deployer le projet, executer :

```bash
npm run typecheck
npm run lint
npm run build
```

Ces trois commandes doivent passer sans erreur bloquante.

## Projet

Projet de stage 2026 - Centrale Bank Simulateur.
