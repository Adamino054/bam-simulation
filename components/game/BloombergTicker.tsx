'use client'

import { useMemo } from 'react'
import { useGameStore } from '@/store/gameStore'
import { Radio } from 'lucide-react'

export function BloombergTicker() {
  const currentState = useGameStore(s => s.currentState)
  const scenario = useGameStore(s => s.scenario)

  const headlines = useMemo(() => {
    const list: string[] = []

    // 1. Nouvelles génériques / institutionnelles
    list.push(`BANK AL-MAGHRIB : Le Wali maintient le cap de la stabilité monétaire pour le T${currentState.quarter + 1}.`)
    list.push(`MAROC : Tanger Med enregistre un trafic record de conteneurs au trimestre précédent.`)
    list.push(`BOURSE : Le MASI de Casablanca s'ajuste dans des volumes modérés dans l'attente du prochain Conseil.`)
    list.push(`MONEY WEEK : Les transferts de fonds des MRE résistent et soutiennent la balance des paiements.`)

    // 2. Nouvelles liées à l'inflation
    if (currentState.inflation > 4.0) {
      list.push(`🚨 ALERTE INFLATION : L'indice des prix à la consommation flambe à ${currentState.inflation.toFixed(1)}%, pression sur le pouvoir d'achat.`)
      list.push(`ANALYSE : La hausse des prix des produits de première nécessité inquiète les ménages à Rabat.`)
      list.push(`DEBATS : Les syndicats appellent à des mesures d'aide d'urgence face à une inflation de ${currentState.inflation.toFixed(1)}%.`)
    } else if (currentState.inflation > 2.5) {
      list.push(`📈 INFLATION HORS CIBLE : Les pressions sur les prix persistent à ${currentState.inflation.toFixed(1)}%, BAM reste vigilante.`)
    } else if (currentState.inflation < 0.5) {
      list.push(`⚠️ RISQUE DE DÉFLATION : L'inflation stagne à ${currentState.inflation.toFixed(1)}%, l'ombre d'une récession à la japonaise plane.`)
      list.push(`OPINION : Bank Al-Maghrib doit-elle baisser ses taux pour ranimer l'activité ?`)
    } else if (currentState.inflation < 1.5) {
      list.push(`📉 BASSE INFLATION : L'indice s'établit à ${currentState.inflation.toFixed(1)}%, offrant une marge de manœuvre monétaire.`)
    } else {
      list.push(`✅ STABILITÉ DES PRIX : L'inflation est ancrée à un niveau idéal de ${currentState.inflation.toFixed(1)}%, saluée par les marchés.`)
    }

    // 3. Nouvelles liées à la croissance (PIB)
    if (currentState.gdpGrowth > 3.0) {
      list.push(`🚀 DYNAMISME ÉCONOMIQUE : La croissance du PIB s'accélère à +${currentState.gdpGrowth.toFixed(1)}%, portée par l'industrie.`)
      list.push(`CASABLANCA : Forte accélération des investissements dans l'écosystème aéronautique et automobile.`)
    } else if (currentState.gdpGrowth <= 0) {
      list.push(`🚨 RÉCESSION IMMINENTE : L'activité recule à ${currentState.gdpGrowth.toFixed(1)}%, climat d'inquiétude chez les entrepreneurs.`)
      list.push(`ENTREPRISES : Baisse marquée des investissements privés face à la contraction de la demande.`)
    } else if (currentState.gdpGrowth < 1.5) {
      list.push(`🐢 CROISSANCE MOLLE : Le PIB marocain progresse timidement de +${currentState.gdpGrowth.toFixed(1)}%, l'emploi sous pression.`)
    }

    // 4. Nouvelles liées aux taux
    if (currentState.policyRate > 4.0) {
      list.push(`💰 SERRAGE DE VIS : Le taux directeur à ${currentState.policyRate.toFixed(2)}% renchérit le coût des crédits immobiliers.`)
      list.push(`BANQUES : Resserrement des conditions de crédit, les promoteurs immobiliers tirent la sonnette d'alarme.`)
    } else if (currentState.policyRate < 2.0) {
      list.push(`💸 TAUX BAS : Le refinancement attractif de BAM à ${currentState.policyRate.toFixed(2)}% soutient la demande de prêts.`)
      list.push(`IMMOBILIER : Relance de la demande de logements stimulée par des taux bancaires attractifs.`)
    }

    // 5. Nouvelles liées à la stabilité financière (NPL)
    const npl = currentState.nplRatio ?? 7.0
    if (npl > 10.0) {
      list.push(`⚠️ FRAGILITÉ BANCAIRE : Le ratio de créances en souffrance (NPL) atteint ${npl.toFixed(1)}%, les banques provisionnent lourdement.`)
      list.push(`CASABLANCA : Le secteur bancaire durcit l'accès au crédit pour contenir la montée des impayés.`)
    }

    // 6. Nouvelles liées au scénario
    if (scenario === 'inflation2022') {
      list.push(`⛽ CHOC IMPORTÉ : Le pétrole Brent s'installe au-dessus de 110$, lourd impact sur la facture énergétique.`)
      list.push(`🌾 STRESS HYDRIQUE : Sécheresse agricole aiguë, récoltes céréalières en forte baisse au Maroc.`)
    } else if (scenario === 'covid2020') {
      list.push(`🦠 CHOC SANITAIRE : Chute brutale de la demande touristique mondiale, impact sévère sur Marrakech.`)
    } else if (scenario === 'flexibilite') {
      list.push(`📈 RÉFORME DE CHANGE : Transition vers un régime plus flexible du Dirham, volatilité surveillée.`)
      list.push(`📉 DEVISES : Pression modérée sur les réserves de change sous le nouveau corridor.`)
    } else if (scenario === 'standard') {
      list.push(`🌤️ PERSPECTIVE STABLE : Situation macroéconomique saine, reprise graduelle hors chocs majeurs.`)
    }

    return list
  }, [currentState, scenario])

  // Dupliquer la liste pour obtenir un défilement infini fluide
  const displayHeadlines = useMemo(() => {
    return [...headlines, ...headlines]
  }, [headlines])

  return (
    <div className="news-feed-container flex items-center h-9 mt-1">
      {/* Live Badge */}
      <div 
        className="flex items-center gap-1.5 px-3 h-full font-mono text-[9px] font-bold z-10 select-none flex-shrink-0"
        style={{ 
          backgroundColor: 'var(--accent-primary)', 
          color: '#ffffff',
          borderRight: '1px solid var(--border-subtle)',
          boxShadow: '4px 0 10px rgba(0,0,0,0.2)'
        }}
      >
        <Radio size={10} className="animate-pulse" />
        <span>BLOOMBERG BAM FEED</span>
      </div>

      {/* Marquee Ticker */}
      <div className="news-feed-ticker">
        {displayHeadlines.map((headline, idx) => (
          <div key={idx} className="news-feed-item">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--accent-warm)' }} />
            <span>{headline}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
