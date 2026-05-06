# Central Bank Simulator

Jeu web éducatif dans lequel le joueur incarne le gouverneur de **Bank Al-Maghrib** et pilote l'économie marocaine sur 5 ans (20 trimestres) en prenant des décisions de politique monétaire.

**Serious game développé dans le cadre d'un Projet de Fin d'Année commandité par BAM.**

---

## Contexte

Ce projet est la composante web jouable d'un moteur de simulation macroéconomique plus large (Sujet 1 du PFA). Le dossier `engine/` contient la logique de simulation en TypeScript pur, conçue pour être portée en Python.

## Stack

| Couche       | Technologie                    |
|--------------|-------------------------------|
| Framework    | Next.js 14 (App Router)       |
| Langage      | TypeScript strict              |
| Styling      | Tailwind CSS v3                |
| State        | Zustand v5 (+ localStorage)   |
| Animations   | Framer Motion                  |
| Charts       | Recharts                       |
| Math         | KaTeX via react-katex          |
| Icons        | Lucide React                   |
| Fonts        | Fraunces · Inter · JetBrains Mono |

## Installation

```bash
# Cloner le dépôt
git clone <url>
cd central-bank-simulator

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Commandes

```bash
npm run dev       # Serveur de développement (port 3000)
npm run build     # Build de production
npm run start     # Serveur de production
npm run lint      # ESLint
npm run typecheck # Vérification TypeScript
```

## Architecture

```
engine/            # Moteur macroéconomique — TypeScript pur, sans React
  state.ts         # Types EconomicState, PolicyAction, Shock
  parameters.ts    # Paramètres calibrés (Phillips, IS, Taylor, etc.)
  simulator.ts     # Fonction step() — boucle principale
  scoring.ts       # Score de fin de partie
  scenarios.ts     # Scénarios prédéfinis
  models/          # Équations individuelles
  shocks/          # Catalogue de chocs macroéconomiques

store/             # Zustand — état global du jeu
components/        # Composants React
  game/            # Composants spécifiques au jeu
  ui/              # Composants atomiques (MetricCard, Slider, etc.)
  shell/           # Header, ThemeToggle
app/               # Pages Next.js (App Router)
  page.tsx         # Accueil / sélecteur de scénario
  play/            # Écran de jeu principal
  debrief/         # Écran de fin de partie
lib/               # Helpers (format, typography, constants)
```

## Moteur de simulation (`engine/`)

Le moteur est **strictement isolé** : aucune dépendance vers React, Zustand ou Next.js. Il peut être importé et exécuté dans n'importe quel environnement JavaScript/Node, et sert de référence pour le portage Python.

### Modèles implémentés

- **Courbe de Phillips** augmentée des anticipations et des chocs agricoles/d'offre
- **Courbe IS dynamique** avec canal du taux réel et demande extérieure
- **Canal du crédit** : ajustement partiel du taux débiteur (~3 trimestres)
- **Marché monétaire** : formation du taux interbancaire (TMP)
- **Règle de Taylor** : benchmark affiché au joueur (non contraignant)
- **Loi d'Okun** : PIB → chômage
- **Catalogue de chocs** : pétrolier, agricole, demande externe, prime de risque

### Test d'isolation

```bash
# Tester le moteur seul (Node.js)
node -e "
const { step } = require('./engine/simulator');
const { INITIAL_STATE } = require('./engine/parameters');
const state = INITIAL_STATE;
const action = { policyRateChangeBp: 0, reserveRequirementChangeBp: 0, marketOperationsBnMad: 0 };
const result = step(state, action, [], 42);
console.log('Inflation T1 :', result.newState.inflation.toFixed(2));
"
```

## Scénarios de jeu

| Scénario               | Difficulté | Contexte                              |
|------------------------|------------|---------------------------------------|
| Standard               | Normal     | Économie en équilibre, chocs aléatoires |
| Choc inflationniste 2022 | Difficile | Inflation à 6 %, chocs énergétiques   |
| Choc COVID-2020        | Crise      | Output gap à −4 %, récession globale  |

## Déploiement Vercel

```bash
# Depuis le projet
vercel deploy

# Ou via l'interface Vercel :
# 1. Importer le dépôt GitHub
# 2. Framework : Next.js (détecté automatiquement)
# 3. Build command : npm run build
# 4. Output directory : .next
# 5. Déployer
```

Variables d'environnement requises : aucune (application 100 % client-side).

## Notes techniques

### Sélecteurs Zustand
Pour éviter les boucles de rendu infinies, utilisez toujours des sélecteurs individuels :

```typescript
// ✅ Correct
const status = useGameStore(s => s.status)
const scenario = useGameStore(s => s.scenario)

// ❌ Incorrect (cause des re-rendus infinis)
const { status, scenario } = useGameStore(s => ({
  status: s.status,
  scenario: s.scenario,
}))
```

### Hydratation
Les pages ont un fallback de 2 secondes pour forcer l'hydratation si localStorage échoue.

## Licence

Projet académique — Projet de Fin d'Année · Bank Al-Maghrib · 2024-2025.
