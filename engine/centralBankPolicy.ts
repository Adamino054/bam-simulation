export const CENTRAL_BANK_POLICY_SOURCE_URL =
  'https://www.bkam.ma/Politique-monetaire/Cadre-strategique/Decision-de-la-politique-monetaire/Historique-des-decisions'

export interface CentralBankPolicySettings {
  policyRate: number
  reserveRequirement: number
  sourceUrl: string
  source: 'live' | 'fallback'
  fetchedAt: string
  effectiveDate?: string
}

export const HISTORICAL_POLICY_FALLBACKS: Array<{
  effectiveDate: string
  policyRate: number
  reserveRequirement: number
}> = [
  { effectiveDate: '2008-01-01', policyRate: 3.25, reserveRequirement: 15 },
  { effectiveDate: '2018-01-15', policyRate: 2.25, reserveRequirement: 4 },
  { effectiveDate: '2019-09-24', policyRate: 2.25, reserveRequirement: 2 },
  { effectiveDate: '2020-03-17', policyRate: 2.0, reserveRequirement: 2 },
  { effectiveDate: '2020-06-16', policyRate: 1.5, reserveRequirement: 0 },
  { effectiveDate: '2022-09-27', policyRate: 2.0, reserveRequirement: 0 },
  { effectiveDate: '2022-12-20', policyRate: 2.5, reserveRequirement: 0 },
  { effectiveDate: '2023-03-21', policyRate: 3.0, reserveRequirement: 0 },
  { effectiveDate: '2024-06-25', policyRate: 2.75, reserveRequirement: 0 },
  { effectiveDate: '2024-12-17', policyRate: 2.5, reserveRequirement: 0 },
  { effectiveDate: '2025-03-18', policyRate: 2.25, reserveRequirement: 0 },
]

export const FALLBACK_CENTRAL_BANK_POLICY: CentralBankPolicySettings = {
  ...HISTORICAL_POLICY_FALLBACKS[HISTORICAL_POLICY_FALLBACKS.length - 1],
  sourceUrl: CENTRAL_BANK_POLICY_SOURCE_URL,
  source: 'fallback',
  fetchedAt: '2026-07-16T00:00:00.000Z',
}

function normalizeTargetDate(targetDate?: string | null): string {
  return targetDate && /^\d{4}-\d{2}-\d{2}$/.test(targetDate)
    ? targetDate
    : new Date().toISOString().slice(0, 10)
}

export function getFallbackPolicyForDate(targetDate?: string | null): CentralBankPolicySettings {
  const normalizedDate = normalizeTargetDate(targetDate)
  const fallback =
    [...HISTORICAL_POLICY_FALLBACKS]
      .reverse()
      .find(item => item.effectiveDate <= normalizedDate) ??
    HISTORICAL_POLICY_FALLBACKS[0]

  return {
    ...fallback,
    sourceUrl: CENTRAL_BANK_POLICY_SOURCE_URL,
    source: 'fallback',
    fetchedAt: new Date().toISOString(),
  }
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#039;|&apos;/gi, "'")
}

function stripAccents(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function toText(html: string): string {
  return stripAccents(
    decodeHtmlEntities(
      html
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim(),
    ),
  )
}

function parseFrenchPercent(value: string): number | null {
  const parsed = Number(value.replace(/\s/g, '').replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : null
}

function findPercentAfterLabel(text: string, labelPattern: RegExp): number | null {
  const labelMatch = labelPattern.exec(text)
  if (!labelMatch || labelMatch.index === undefined) return null

  const afterLabel = text.slice(labelMatch.index, labelMatch.index + 500)
  const percentMatch = afterLabel.match(/(-?\d{1,2}(?:[,.]\d{1,2})?)\s*%/)
  return percentMatch ? parseFrenchPercent(percentMatch[1]) : null
}

const FRENCH_MONTHS: Record<string, string> = {
  janvier: '01',
  fevrier: '02',
  mars: '03',
  avril: '04',
  mai: '05',
  juin: '06',
  juillet: '07',
  aout: '08',
  septembre: '09',
  octobre: '10',
  novembre: '11',
  decembre: '12',
}

function parseFrenchDate(day: string, month: string, year: string): string | null {
  const monthNumber = FRENCH_MONTHS[stripAccents(month.toLowerCase())]
  if (!monthNumber) return null
  return `${year}-${monthNumber}-${day.padStart(2, '0')}`
}

type PolicyHistoryEntry = {
  effectiveDate: string
  policyRate: number
  reserveRequirement?: number
}

function parsePolicyHistoryEntries(text: string): PolicyHistoryEntry[] {
  const datePattern =
    /(\d{1,2})\s+(janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre)\s+(\d{4})/gi
  const matches = Array.from(text.matchAll(datePattern))
  const entries: PolicyHistoryEntry[] = []

  matches.forEach((match, index) => {
    const effectiveDate = parseFrenchDate(match[1], match[2], match[3])
    if (!effectiveDate || match.index === undefined) return

    const nextIndex = matches[index + 1]?.index ?? text.length
    const chunk = text.slice(match.index, nextIndex)
    const policyRate = findPercentAfterLabel(chunk, /taux\s+directeur/i)
    const reserveRequirement = findPercentAfterLabel(chunk, /reserve\s+obligatoire/i)

    if (policyRate === null) return
    entries.push({ effectiveDate, policyRate, reserveRequirement: reserveRequirement ?? undefined })
  })

  return entries.sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate))
}

function findPolicyForDateFromHtml(text: string, targetDate?: string | null): CentralBankPolicySettings | null {
  if (!targetDate) return null

  const normalizedDate = normalizeTargetDate(targetDate)
  const fallbackForDate = getFallbackPolicyForDate(targetDate)
  const entries = parsePolicyHistoryEntries(text)
  const entry = [...entries].reverse().find(item => item.effectiveDate <= normalizedDate)
  if (entry && entry.effectiveDate < (fallbackForDate.effectiveDate ?? '0000-00-00')) return null
  if (!entry) return null

  return {
    policyRate: entry.policyRate,
    reserveRequirement: entry.reserveRequirement ?? fallbackForDate.reserveRequirement,
    sourceUrl: CENTRAL_BANK_POLICY_SOURCE_URL,
    source: 'live',
    fetchedAt: new Date().toISOString(),
    effectiveDate: entry.effectiveDate,
  }
}

export function parseCentralBankPolicySettings(
  html: string,
  fetchedAt = new Date().toISOString(),
  targetDate?: string | null,
): CentralBankPolicySettings | null {
  const text = toText(html)
  const historicalPolicy = findPolicyForDateFromHtml(text, targetDate)
  if (historicalPolicy) return { ...historicalPolicy, fetchedAt }

  const fallbackForDate = getFallbackPolicyForDate(targetDate)
  const policyRate =
    findPercentAfterLabel(text, /taux\s+directeur/i) ??
    findPercentAfterLabel(text, /key\s+rate/i)

  const reserveRequirement =
    findPercentAfterLabel(text, /reserve\s+obligatoire/i) ??
    findPercentAfterLabel(text, /required\s+reserve/i) ??
    fallbackForDate.reserveRequirement

  if (policyRate === null && !targetDate) return null

  if (targetDate) {
    return fallbackForDate
  }

  return {
    policyRate: policyRate ?? fallbackForDate.policyRate,
    reserveRequirement,
    sourceUrl: CENTRAL_BANK_POLICY_SOURCE_URL,
    source: 'live',
    fetchedAt,
  }
}

export async function fetchCentralBankPolicySettings(targetDate?: string | null): Promise<CentralBankPolicySettings> {
  const params = targetDate ? `?date=${encodeURIComponent(targetDate)}` : ''

  try {
    const response = await fetch(`/api/central-bank-policy${params}`, { cache: 'no-store' })
    if (!response.ok) return getFallbackPolicyForDate(targetDate)

    const data = (await response.json()) as Partial<CentralBankPolicySettings>
    if (typeof data.policyRate !== 'number' || typeof data.reserveRequirement !== 'number') {
      return getFallbackPolicyForDate(targetDate)
    }

    return {
      policyRate: data.policyRate,
      reserveRequirement: data.reserveRequirement,
      sourceUrl: data.sourceUrl ?? CENTRAL_BANK_POLICY_SOURCE_URL,
      source: data.source === 'live' ? 'live' : 'fallback',
      fetchedAt: data.fetchedAt ?? new Date().toISOString(),
      effectiveDate: data.effectiveDate,
    }
  } catch {
    return getFallbackPolicyForDate(targetDate)
  }
}
