/**
 * Helpers de formatage numérique pour l'interface française.
 * Utilise Intl.NumberFormat avec le locale fr-MA.
 */

const locale = 'fr-MA'

/** Formate un pourcentage : 2,5 % */
export function fmtPct(value: number, decimals = 1): string {
  return (
    new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value) + ' %'
  )
}

/** Formate un nombre avec séparateurs de milliers */
export function fmtNum(value: number, decimals = 1): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/** Formate un taux en points de base (bp) */
export function fmtBp(bp: number): string {
  const sign = bp > 0 ? '+' : ''
  return `${sign}${bp} bp`
}

/** Formate une variation : +0,3 pt ou -0,2 pt */
export function fmtDelta(delta: number, unit = 'pt', decimals = 1): string {
  const sign = delta > 0 ? '+' : ''
  return `${sign}${fmtNum(delta, decimals)} ${unit}`
}

/** Formate un montant en milliards MAD */
export function fmtBnMad(value: number): string {
  return (
    new Intl.NumberFormat(locale, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value) + ' mds MAD'
  )
}

/** Formate un trimestre : T1 2025, T2 2025, etc. */
export function fmtQuarter(year: number, q: 1 | 2 | 3 | 4): string {
  return `T${q} ${year}`
}
