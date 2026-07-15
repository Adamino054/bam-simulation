import { NextResponse } from 'next/server'
import {
  BKAM_POLICY_SOURCE_URL,
  getFallbackBkamPolicyForDate,
  parseBkamPolicySettings,
} from '@/engine/bkamPolicy'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const fetchedAt = new Date().toISOString()
  const { searchParams } = new URL(request.url)
  const targetDate = searchParams.get('date')
  const fallback = getFallbackBkamPolicyForDate(targetDate)

  try {
    const response = await fetch(BKAM_POLICY_SOURCE_URL, {
      cache: 'no-store',
      headers: {
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'fr-FR,fr;q=0.9,en;q=0.8',
        'user-agent': 'Mozilla/5.0 (compatible; CBS-BKAM-Sync/1.0)',
      },
    })

    if (!response.ok) {
      return NextResponse.json({ ...fallback, fetchedAt })
    }

    const html = await response.text()
    const parsed = parseBkamPolicySettings(html, fetchedAt, targetDate)

    return NextResponse.json(parsed ?? { ...fallback, fetchedAt })
  } catch {
    return NextResponse.json({ ...fallback, fetchedAt })
  }
}
