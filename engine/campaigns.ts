export interface CampaignConfig {
  id: 'volcker1979' | 'crisis2008'
  title: string
  subtitle: string
  difficulty: string
  duration: number
  description: string
  contextMarkdown: string
  winConditionsMarkdown: string
  lossConditionsMarkdown: string
  startingKpi: { label: string; value: string; hint: string }[]
  goals: { label: string; value: string; formula: string }[]
}

export const CAMPAIGNS: Record<string, CampaignConfig> = {
  volcker1979: {
    id: 'volcker1979',
    title: 'Choc Volcker 1979',
    subtitle: 'La lutte implacable contre la stagflation',
    difficulty: 'Niveau Institutionnel — Très Difficile',
    duration: 8, // 8 Quarters
    description: 'Resserrement monétaire historique pour mater une hyperinflation de 15 % avec une crédibilité initiale effondrée.',
    contextMarkdown: `
1979 : La flambée des prix de l'énergie et la faiblesse passée de la banque centrale ont provoqué un désancrage sévère des anticipations d'inflation ($\\pi^e = 12 \\%$) entraînant l'économie marocaine fictive dans une spirale stagflationniste. 

Votre nomination s'accompagne d'une directive d'une fermeté historique : briser l'inflation par tous les moyens monétaires à votre disposition.
`,
    winConditionsMarkdown: `
*   **Stabilisation** : Ramener l'inflation observée ($\\pi_t$) sous **3,0 %** à la fin du 8e trimestre.
*   **Crédibilité** : Conserver une banque centrale légitime (crédibilité $> 0 \\%$) à chaque trimestre.
`,
    lossConditionsMarkdown: `
*   **Désancrage Fatal** : Si la crédibilité tombe à **0 %**, vous serez immédiatement démis de vos fonctions.
*   **Hors Cible** : Si l'inflation reste égale ou supérieure à **3,0 %** après 8 trimestres.
`,
    startingKpi: [
      { label: 'Inflation observée', value: '15,00 %', hint: 'Très au-dessus de la cible de 2%' },
      { label: 'Anticipations d\'inflation', value: '12,00 %', hint: 'Désancrées' },
      { label: 'Crédibilité CBS', value: '35 / 100', hint: 'Zone de danger critique' },
      { label: 'Taux directeur (i)', value: '7,00 %', hint: 'Doit être relevé vigoureusement' },
    ],
    goals: [
      { label: 'Inflation cible', value: '< 3.0 %', formula: '\\pi_t < 3.0' },
      { label: 'Crédibilité minimale', value: '> 0 %', formula: 'Credibility > 0' },
      { label: 'Horizon temporel', value: '8 trimestres (2 ans)', formula: 'T \\le 8' },
    ]
  },

  crisis2008: {
    id: 'crisis2008',
    title: 'Crise Systémique 2008',
    subtitle: 'Le spectre du gel bancaire et de la récession',
    difficulty: 'Niveau Institutionnel — Expert',
    duration: 20, // 20 quarters in the historical simulation
    description: 'Une explosion des créances douteuses (NPL) paralyse le canal du crédit bancaire, menaçant l\'économie réelle de dépression.',
    contextMarkdown: `
2008 : À la suite de la crise des subprimes mondiale, le système bancaire marocain fait face à une détérioration critique de ses portefeuilles d'actifs. Les créances douteuses (NPL) bondissent à **18 %**, poussant les banques à couper drastiquement le crédit ($\\Delta Credit = -4 \\%$) pour préserver leurs ratios de fonds propres.

La liquidité s'est évaporée (besoin de liquidité critique de **220 milliards MAD**). Le canal de transmission est totalement bloqué.
`,
    winConditionsMarkdown: `
*   **Assainissement progressif** : Réduire durablement le ratio de NPL bancaires ($NPL_t$) pendant le mandat historique.
*   **Relance du canal du crédit** : Restaurer une croissance positive des encours de crédit sans provoquer d'instabilité macroéconomique.
`,
    lossConditionsMarkdown: `
*   **Fragilité persistante** : Si le canal du crédit reste durablement bloqué et que les tensions bancaires dominent la trajectoire finale.
`,
    startingKpi: [
      { label: 'Ratio de NPL bancaires', value: '18,00 %', hint: 'Seuil critique d\'insolvabilité' },
      { label: 'Croissance du crédit', value: '-4,00 %', hint: 'Gel complet du canal (Credit Crunch)' },
      { label: 'Besoin de liquidité', value: '220 mds MAD', hint: 'Tension extrême sur le marché monétaire' },
      { label: 'Coussin CCyB actif', value: '1,00 %', hint: 'Bloque des réserves de capital' },
    ],
    goals: [
      { label: 'Ratio NPL cible', value: '< 10.0 %', formula: 'NPL_t < 10.0' },
      { label: 'Croissance crédit', value: '> +2.0 %', formula: 'Credit\\_Growth_t > 2.0' },
      { label: 'Horizon temporel', value: '20 trimestres (mandat historique)', formula: 'T = 20' },
    ]
  }
}
