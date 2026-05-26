# Centrale Bank Simulateur (CBS) — Spécifications Macroéconomiques Académiques
*Document de spécification technique et théorique du moteur de simulation macroéconomique.*
*PFA commandité académiquement — Modélisation structurelle et transmission de la politique monétaire.*

---

## Section 1 : Introduction & Cadre Théorique Global

Le **Centrale Bank Simulateur (CBS)** est un serious game de politique monétaire reposant sur un moteur de simulation macroéconomique dynamique stylisé. Inspiré des modèles DSGE (*Dynamic Stochastic General Equilibrium*) simplifiés et des modèles de projection trimestrielle de type **QPM (Quarterly Projection Model)** du **Fonds Monétaire International (FMI)**, il reproduit fidèlement les mécanismes de transmission monétaire propres aux petites économies ouvertes et émergentes sous régime de change administré (tel que le cadre institutionnel marocain).

### 1.1 Séquence de Transmission et Canaux Économiques

Le moteur CBS modélise la transmission des décisions du Gouverneur à travers quatre canaux fondamentaux :
1.  **Le canal du taux d'intérêt (ou du coût de financement)** : 
    La modification du taux directeur par la banque centrale ajuste instantanément le coût des réserves bancaires. Cela modifie le taux interbancaire ($TMP$), qui se répercute avec un délai d'ajustement partiel sur le taux débiteur moyen des banques ($i^D_t$). Ce dernier régit le coût du crédit pour les ménages et les entreprises.
2.  **Le canal du crédit bancaire (Bernanke & Gertler, 1995)** :
    L'augmentation des taux d'intérêt s'accompagne d'un effet de sélection adverse et d'un ralentissement de l'activité, augmentant les créances en souffrance (NPL). Les banques réagissent en contractant l'offre de crédit ($\Delta Crédit$), ce qui amplifie le ralentissement de la demande globale (effet d'accélérateur financier).
3.  **Le canal du taux de change (Pass-through)** :
    Le régime de change administré lie en partie l'économie aux variations extérieures. Les chocs de prix à l'importation ou les dépréciations se transmettent directement aux prix à la consommation via le coefficient de pass-through ($\alpha$).
4.  **Le canal des anticipations (Expectations Channel)** :
    La crédibilité de la banque centrale ($Credibility_t$) et sa communication (*forward guidance*) guident et ancrent les anticipations d'inflation du public ($\pi^e_t$), limitant les spirales inflationnistes secondaires.

---

## Section 2 : Description Mathématique des Blocs Structurels

Le moteur est découpé en cinq blocs d'équations distincts résolus de manière récursive à chaque trimestre $t$.

### 2.1 Bloc 1 : La Courbe de Phillips Augmentée des Anticipations (`phillips.ts`)

La dynamique de l'offre agrégée et de l'inflation dépend de la formation des prix à court terme sous rigidités nominales :

$$\pi_t = \beta_{eff} \cdot \pi^e_{t, comm} + \kappa \cdot \tilde{y}_t + \alpha \cdot \Delta p^{imp}_t + \gamma \cdot s^{agri}_t + u^\pi_t$$

Où :
*   $\pi_t$ représente l'inflation globale observée (headline inflation) au trimestre $t$.
*   $\pi^e_{t, comm}$ représente les anticipations d'inflation ajustées par la communication (*forward guidance*) de la banque centrale :
    *   $\pi^e_{t, comm} = \pi^e_t - 0.15$ si la communication est restrictive (*hawkish*).
    *   $\pi^e_{t, comm} = \pi^e_t + 0.10$ si la communication est accommodante (*dovish*).
*   $\beta_{eff}$ est le taux d'actualisation psychologique effectif ajusté par la **crédibilité** institutionnelle de la banque centrale. Une forte crédibilité ($Credibility_t > 75$) ancre solidement les anticipations et diminue la dépendance de l'inflation courante aux dérives d'anticipation adaptatives secondaires :
    $$\beta_{eff} = \beta - 0.05 \cdot \max\left(0, \frac{Credibility_t - 75}{25}\right)$$
*   $\tilde{y}_t$ est l'écart de production (*output gap*). Le coefficient $\kappa$ mesure la sensibilité de l'inflation aux tensions productives (pente de la courbe de Phillips).
*   $\Delta p^{imp}_t$ représente la variation trimestrielle du prix des biens importés, dictée par la dépréciation ou l'appréciation du taux de change effectif ($e_t$) :
    $$\Delta p^{imp}_t = \left(\frac{e_t - e_{t-1}}{e_{t-1}}\right) \cdot 100$$
    Le coefficient $\alpha$ capte le degré de *pass-through* du taux de change.
*   $s^{agri}_t$ capte la sensibilité structurelle de l'économie marocaine aux aléas climatiques (sécheresse, chocs agricoles sur les produits alimentaires volatils), pondérée par le coefficient $\gamma$.
*   $u^\pi_t$ représente la somme des chocs d'offre exogènes (ex: choc mondial sur les matières premières).

---

### 2.2 Bloc 2 : La Courbe IS Dynamique (`isCurve.ts`)

La demande globale (output gap) est régie par une équation IS prospective, intégrant les frictions réelles et les politiques contra-cycliques :

$$\tilde{y}_t = \rho \cdot \tilde{y}_{t-1} - \sigma \cdot (i^D_t - \pi^e_t) + \delta \cdot \tilde{y}^*_t + u^y_t + \text{guidance}_t + \text{fiscal}_t$$

Où :
*   $\tilde{y}_t$ est l'output gap au trimestre $t$, mesurant l'écart entre le PIB réel et le PIB potentiel de l'économie.
*   $\rho$ capte la persistance de l'activité économique (inertie de la consommation et des cycles d'investissement passés).
*   $\sigma$ est l'élasticité de l'investissement et de la consommation au taux d'intérêt réel débiteur moyen de l'économie ($r^D_t = i^D_t - \pi^e_t$). Si l'innovation financière est active (Task 2e), la titrisation bancaire réduit le canal de transmission traditionnel, divisant l'élasticité effective $\sigma$ par deux :
    $$\sigma_{eff} = \frac{\sigma}{2}$$
*   $\tilde{y}^*_t$ représente l'activité économique extérieure (output gap de la zone euro), pondérée par le degré d'ouverture commerciale de l'économie marocaine ($\delta$).
*   $\text{guidance}_t$ est la transmission directe de confiance de la *forward guidance* : $+0.08$ en posture accommodante, $-0.06$ en posture restrictive.
*   $\text{fiscal}_t$ représente l'impact multiplicateur des dépenses publiques de l'État : $+0.15$ en posture budgétaire expansive, $-0.10$ en posture restrictive (austérité).
*   $u^y_t$ capte les chocs de demande exogènes (choc de confiance, chocs d'exportation).

---

### 2.3 Bloc 3 : Le Canal du Crédit et du Taux Débiteur (`creditChannel.ts`)

Les frictions financières bancaires introduisent des asymétries majeures dans la transmission monétaire.

#### A. Le Taux Débiteur Moyen ($i^D_t$)
Les banques commerciales répercutent les hausses du taux interbancaire ($i^{TMP}_t$) avec un ajustement partiel dû aux coûts de friction des bilans :

$$i^D_t = (1-\lambda) \cdot i^D_{t-1} + \lambda \cdot (i^{TMP}_t + \text{marge} + \text{CCyB}_t) + \text{Prime}_{NPL, t} + u^{financial}_t$$

Où :
*   $\lambda$ représente la vitesse d'ajustement trimestrielle du taux débiteur moyen.
*   $\text{marge}$ est la marge bancaire fixe structurelle.
*   $\text{CCyB}_t$ est le coussin de capital contracyclique imposé par la réglementation macroprudentielle, dont l'augmentation accroît le coût du capital des banques et pèse sur le taux débiteur cible (pondéré par `ccybLendingImpact`).
*   $\text{Prime}_{NPL, t}$ représente la prime de risque interne que s'octroient les banques pour compenser les pertes attendues sur créances douteuses :
    $$\text{Prime}_{NPL, t} = \max\left(0, NPL_t - NPL_{naturel}\right) \cdot 0.15$$

#### B. La Dynamique de Croissance du Crédit ($\Delta Crédit_t$)
Pour corriger les surcalibrations et modéliser de manière réaliste l'offre de financement (Bernanke & Gertler, 1995), la croissance trimestrielle du crédit suit un modèle en différence première :

$$\Delta Crédit_t = -\beta_{crédit} \cdot \Delta i^{TMP}_t - \gamma_{npl} \cdot \Delta NPL_t + \delta \cdot \Delta \tilde{y}_t$$

Où :
*   $\beta_{crédit} = 1.5$ capte l'élasticité de l'offre de crédit par rapport aux variations du coût interbancaire.
*   $\gamma_{npl} = 0.8$ mesure le rationnement du crédit consécutif à l'accumulation de créances douteuses (Credit Crunch).
*   $\delta = 0.6$ traduit la procyclicité de la demande de financement liée à l'accélération de l'activité économique.
*   La variation trimestrielle ($\Delta Crédit_t$) est contrainte à $\pm3.0\%$ en temps normal ($\pm8.0\%$ en crise majeure) pour simuler l'inertie des engagements bancaires.

---

### 2.4 Bloc 4 : Le Marché Monétaire & Taux Interbancaire (`monetaryMarket.ts`)

La liquidité bancaire est le premier maillon de la chaîne de transmission monétaire.

#### A. Le Besoin Structurel de Liquidité ($\text{Besoin}_t$)
Le besoin global de refinancement des banques auprès du guichet de la banque centrale évolue selon la formule suivante :

$$\text{Besoin}_t = \text{Besoin}_{t-1} + \Delta RO_t - \text{OpenMarket}_t + \text{FXIntervention}_t - \text{EmergencyLending}_t$$

Où :
*   $\Delta RO_t$ représente l'impact du relèvement des réserves obligatoires sur les dépôts bancaires ($Deposits \approx 1500$ mds MAD) :
    $$\Delta RO_t = \Delta r^{RO}_t \cdot Deposits$$
*   $\text{OpenMarket}_t$ représente les injections hebdomadaires de liquidité par appel d'offres (avances à 7 jours).
*   $\text{FXIntervention}_t$ représente les ponctions de liquidité consécutives à des ventes de devises par la banque centrale pour soutenir le Dirham.
*   $\text{EmergencyLending}_t$ représente l'apport d'urgence de liquidité au guichet de dernier ressort.

#### B. Le Taux Moyen Pondéré ($i^{TMP}_t$)
Le taux du marché monétaire ($TMP$) se forme autour du taux directeur ($i_t$) majoré d'un spread reflétant le risque systémique bancaire (NPL) et les tensions de liquidité :

$$i^{TMP}_t = i_t + \alpha_{liq} \cdot \left(\frac{NPL_t}{10}\right) + \epsilon_t$$

Où :
*   $\alpha_{liq} = 0.05$ ( spread de base lié à la détérioration de la solvabilité du secteur bancaire).
*   $\epsilon_t$ traduit la friction de liquidité due aux déséquilibres structurels du marché interbancaire :
    $$\epsilon_t = \left(\text{Besoin}_t - 80\right) \cdot 0.002$$
*   Le spread global ($i^{TMP}_t - i_t$) est encadré par les limites réglementaires de la banque centrale $[-0.10\%, 1.50\%]$ (porté à $+2.50\%$ en situation de panique bancaire systémique type 2008), garantissant la stabilité du corridor de taux.

---

### 2.5 Bloc 5 : La Règle de Taylor & La Loi d'Okun (`taylorRule.ts` & `simulator.ts`)

#### A. Règle de Taylor de Référence (Benchmark)
La banque centrale utilise une règle de Taylor classique pour calculer le taux d'intérêt neutre et recommander une orientation de politique monétaire :

$$i^*_t = r^* + \pi^* + \phi_\pi \cdot (\pi_t - \pi^*) + \phi_y \cdot \tilde{y}_t$$

Où $r^*$ est le taux réel neutre de long terme ($1.5\%$), $\pi^*$ la cible d'inflation ($2.0\%$), $\phi_\pi = 1.50$ et $\phi_y = 0.50$ les poids de réaction structurels. Le taux cible est contraint par la borne inférieure effective ($ELB = 0.5\%$).

#### B. Loi d'Okun Incrémentale (Transmission PIB → Chômage)
Le marché de l'emploi réagit aux fluctuations de l'activité économique avec un coefficient d'Okun adapté pour le Royaume du Maroc :

$$\Delta u_t = -\lambda \cdot \Delta \tilde{y}_t \implies u_t = u_{t-1} - \lambda \cdot (\tilde{y}_t - \tilde{y}_{t-1})$$

Où $u_t$ représente le taux de chômage et $\lambda = 0.40$. Si l'économie subit un ralentissement ($\Delta \tilde{y}_t = -0.4\%$), le chômage augmente de façon cohérente de $+0.16\%$.

---

## Section 3 : Tableau Récapitulatif des Calibrations Structurelles

Les paramètres structurant l'économie CBS sont calibrés pour refléter les caractéristiques structurelles d'une économie émergente stable à régime de change fixe :

| Paramètre | Symbole | Valeur | Rôle Structurel / Justification Académique | Source Littérature |
| :--- | :---: | :---: | :--- | :--- |
| **Persistance IS** | $\rho$ | $0,70$ | Forte inertie de la demande globale et de la consommation des ménages. | IMF Country Report (Morocco) |
| **Élasticité IS** | $\sigma$ | $0,12$ | Faible sensibilité initiale de l'investissement privé au taux réel (frictions financières). | Modèle QPM - FMI |
| **Pente Phillips** | $\kappa$ | $0,15$ | Rigidités modérées des salaires et des prix dans le secteur non échangeable. | Working Paper Bank Al-Maghrib |
| **Pass-through FX** | $\alpha$ | $0,08$ | Transmission partielle des fluctuations du taux de change aux prix domestiques. | Revue Économique BAM |
| **Sensibilité Agricole** | $\gamma$ | $0,20$ | Poids élevé du secteur agricole (produits volatils) sur l'indice global des prix. | Haut Commissariat au Plan (HCP) |
| **Coeff. Okun** | $\lambda$ | $0,40$ | Frictions sur le marché du travail ; élasticité de l'emploi au PIB modérée. | FMI Working Paper MENA |
| **Ajustement Débiteur** | $\lambda_{debt}$ | $0,35$ | Ajustement asymétrique et progressif des taux bancaires sur 3 trimestres. | Littérature Canal Bancaire |
| **Corridor TMP** | $\alpha_{liq}$ | $0,05$ | Majoration modérée du spread TMP lié à la solvabilité bancaire globale. | Rapports Stabilité Financière |

---

## Section 4 : Architecture Logicielle & Isolation du Code

Le moteur macroéconomique CBS est conçu dans un but de **transparence et de portabilité académique**. 

Toute la logique de calcul contenue dans le dossier `engine/` est rédigée en **TypeScript strict pur**, totalement exempte de dépendances avec des frameworks d'interface utilisateur (React, Next.js, Framer Motion) ou de gestionnaires d'état (Zustand).

### Avantages de cette isolation :
1.  **Transparence Mathématique** : Les équations sont isolées, claires et facilement vérifiables par les étudiants ou enseignants.
2.  **Portage Python simple** : L'indépendance du code source facilite grandement son portage vers d'autres langages (Python/R) pour des travaux pratiques d'économétrie ou de modélisation mathématique.
3.  **Tests unitaires robustes** : Possibilité de valider la stabilité du modèle macroéconomique dans un environnement Node.js en ligne de commande pure sans instancier le serveur web Next.js.
