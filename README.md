# CBS — Centrale Bank Simulateur

Jeu sérieux web éducatif dans lequel le joueur incarne le gouverneur de la banque centrale **Centrale Bank Simulateur (CBS)** et pilote l'économie marocaine fictive sur 5 ans (20 trimestres) en prenant des décisions stratégiques de politique monétaire.

**Serious game développé dans le cadre d'un Projet de Fin d'Année commandité académiquement pour modéliser la politique monétaire.**

---

## 🏛️ Contexte Académique & Moteur

Ce projet est la composante web interactive d'un moteur de simulation macroéconomique dynamique. Le dossier `engine/` contient la logique de simulation en TypeScript strict pur, conçue pour être portable (sans adhérence à un framework) :
*   **Loi d'Okun dynamique** : Δu_t = −λ · Δỹ_t (calibrée à λ = 0,40 pour les économies MENA).
*   **TMP (Taux interbancaire)** : spread calibré basé sur le risque NPL et les réserves obligatoires.
*   **Canal du crédit (Bernanke & Gertler)** : contraction bancaire incrémentale liée aux taux directeurs et NPL.
*   **Courbe IS & Phillips** : transmission monétaire complète avec anticipations ancrées.

---

## 💻 Technologies & Dépendances

| Couche       | Technologie                    |
|--------------|-------------------------------|
| Framework    | **Next.js 15 (App Router)** & Turbopack |
| Langage      | TypeScript strict              |
| Styling      | Tailwind CSS / Vanilla CSS     |
| State        | Zustand v5 (+ localStorage)   |
| Animations   | Framer Motion                  |
| Charts       | Recharts                       |
| Math         | KaTeX via react-katex          |
| Icônes       | Lucide React                   |

---

## 🚀 Guide d'Installation et Lancement (Pour l'Encadrant)

Voici la procédure pas-à-pas pour lancer le simulateur en local depuis l'archive ZIP sur votre machine.

### Étape 1 : Décompression
1. Décompressez le fichier **ZIP** dans le dossier de votre choix.
2. Ouvrez votre éditeur de code préféré (ex: **VS Code**).
3. Cliquez sur `Fichier > Ouvrir le dossier...` et sélectionnez le dossier décompressé.

### Étape 2 : Manipulation du Terminal
1. Ouvrez le terminal intégré de votre éditeur (Sur VS Code : `Ctrl + ~` ou `Terminal > Nouveau Terminal`).
2. Saisissez la commande suivante pour installer automatiquement l'intégralité des dépendances du projet :
   ```bash
   npm install
   ```
3. Une fois l'installation terminée, lancez le serveur de développement local avec le moteur de rendu rapide Turbopack :
   ```bash
   npm run dev
   ```
4. Ouvrez votre navigateur internet et naviguez sur : **[http://localhost:3000](http://localhost:3000)**.

---

## 🛠️ Commandes Disponibles dans le Terminal

Dans le terminal de votre projet, vous pouvez exécuter les scripts suivants :
*   `npm run dev` : Démarre le serveur de développement rapide Next.js (port 3000).
*   `npm run build` : Compile et optimise l'application pour la production (vérifie les types TS strict).
*   `npm run start` : Démarre le serveur en mode production (après un `npm run build`).
*   `npm run lint` : Lance l'analyseur de code ESLint pour vérifier la propreté du code.
*   `npm run typecheck` : Exécute le compilateur TypeScript sans build pour valider la conformité des types.

---

## 🔌 Extensions VS Code Recommandées

Pour explorer le code source et le modifier dans les meilleures conditions, nous recommandons fortement d'installer les extensions suivantes dans **VS Code** (recherchables dans l'onglet Extensions `Ctrl + Shift + X`) :

1.  **Tailwind CSS IntelliSense** : Indispensable pour l'autocomplétion des classes utilitaires modernes de styling.
2.  **ESLint** : Pour afficher en temps réel les avertissements ou recommandations sur la qualité du code TypeScript/React.
3.  **Prettier - Code Formatter** : Permet de formater automatiquement le code lors de la sauvegarde (`Ctrl + S`) pour une lecture parfaite.
4.  **KaTeX / Markdown Preview** : Pour visualiser et éditer les formules mathématiques en LaTeX rédigées dans le guide et les cours.

---

## 📁 Architecture du Projet

```
├── engine/            # Moteur macroéconomique — TypeScript strict pur (isolé)
│   ├── state.ts       # Types de données : EconomicState, PolicyAction, Shock
│   ├── parameters.ts  # Paramètres calibrés (Okun, Phillips, Taylor, CCyB...)
│   ├── simulator.ts   # Fonction step() — boucle de transition principale
│   ├── scoring.ts     # Calcul des scores académiques finaux
│   ├── scenarios.ts   # Configuration des scénarios de mandat
│   └── models/        # Équations et blocs macroéconomiques individuels
├── store/             # Zustand — Gestion de l'état global du jeu (localStorage)
├── components/        # Composants d'interface React réutilisables
│   ├── game/          # Composants spécifiques (panneau de décision, left HUD...)
│   ├── ui/            # Éléments atomiques (AssistantBot, metric cards...)
│   └── shell/         # Enveloppe système (headers, toggle thème...)
├── app/               # Pages de l'application Next.js (App Router)
│   ├── page.tsx       # Landing page interactive
│   ├── login/         # Connexion locale
│   ├── dashboard/     # Simulation principale
│   ├── training/      # Espace d'entraînement (Laboratoire Sandbox / Crises)
│   ├── players/       # Palmarès public des gouverneurs
│   └── about/         # À propos (persistance de thèmes intégrée)
```

---

## 🧪 Test d'Isolation du Moteur de Simulation

Le moteur macroéconomique est **strictement découplé** de l'interface graphique (0% d'adhérence à React ou Next.js). Vous pouvez le tester et l'exécuter directement en ligne de commande Node.js depuis le dossier racine :

```bash
node -e "
const { step } = require('./engine/simulator');
const { INITIAL_STATE } = require('./engine/parameters');
const state = INITIAL_STATE;
const action = { policyRateChangeBp: 0, reserveRequirementChangeBp: 0, marketOperationsBnMad: 0 };
const result = step(state, action, [], 42);
console.log('Simulation Q1 réussie. Inflation T1 :', result.newState.inflation.toFixed(2), '%');
"
```

---

## 🎓 Évaluation Académique & Score

Le joueur est évalué à la fin de son mandat de 20 trimestres sur 3 grands axes institutionnels via un score sur **100 points** :
1.  **Stabilité des prix** (Cible stricte d'inflation de 2,0 %).
2.  **Stabilité de l'économie** (Volatilité de l'écart de production / Output gap).
3.  **Crédibilité de la Banque Centrale** (Confiance des marchés et du public).

---

Projet de Fin d'Année · Centrale Bank Simulateur (CBS) · 2024-2025.
