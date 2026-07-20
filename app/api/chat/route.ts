import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models'
const DEFAULT_MODEL = 'gemini-3.1-flash-lite'
const DEFAULT_FALLBACK_MODEL = 'gemini-2.5-flash'
const MAX_MESSAGE_LENGTH = 1_200
const MAX_HISTORY_MESSAGES = 10
const MAX_REQUEST_LENGTH = 40_000
const REQUEST_TIMEOUT_MS = 12_000
const CACHE_TTL_MS = 5 * 60 * 1_000
const CACHE_MAX_ENTRIES = 120
const ALLOWED_CONTEXTS = new Set([
  'landing',
  'courses',
  'dashboard',
  'simulation',
  'debrief',
  'discovery',
  'choice',
  'history',
  'training',
  'campaign',
  'lab',
  'multiplayer',
])

const PAGE_GUIDANCE: Record<string, string> = {
  landing: "Accueil et présentation générale. Oriente vers le choix de parcours, les cours et la simulation, sans prétendre qu'une partie est active.",
  choice: 'Choix entre le parcours Découverte, guidé et ludique, et le parcours Expert, plus technique.',
  discovery: 'Parcours Découverte avec quatre activités : Histoires, Jeux, Mission guidée et Millionnaire. Oriente vers ces activités, pas vers le tableau de bord Expert.',
  courses: 'Cours de politique monétaire et modules pédagogiques. Explique les concepts sans supposer une simulation active.',
  dashboard: 'Briefing Expert et sélection du scénario avant lancement de la simulation.',
  simulation: 'Simulation active : analyse uniquement les indicateurs fournis et rappelle les compromis des instruments.',
  debrief: 'Bilan de fin de partie. N’analyse un score précis que s’il est présent dans le message ou les indicateurs.',
  history: 'Historique des parties. N’invente aucune ancienne partie ni aucun score absent de la question.',
  training: 'Espace d’entraînement aux formules, aux chocs et aux mécanismes économiques.',
  campaign: 'Campagnes et missions scénarisées avec conditions de victoire.',
  lab: 'Laboratoire macroéconomique pour expérimenter les paramètres et les modèles.',
  multiplayer: 'Modes duel et co-gouvernance. Explique les règles sans inventer les actions des autres joueurs.',
}

type ClientMessage = {
  role: 'user' | 'model'
  text: string
}

type ChatRequest = {
  message?: unknown
  history?: unknown
  context?: unknown
  playerName?: unknown
  economy?: unknown
}

type GeminiPayload = {
  error?: { code?: number; message?: string; status?: string }
  promptFeedback?: { blockReason?: string }
  candidates?: Array<{
    finishReason?: string
    content?: { parts?: Array<{ text?: string }> }
  }>
}

type ChatResult = {
  text: string
  model: string
  source: 'gemini' | 'cache' | 'deduplicated'
}

type CacheEntry = {
  text: string
  model: string
  expiresAt: number
}

class GeminiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly retryAfterSeconds = 0,
  ) {
    super(message)
    this.name = 'GeminiRequestError'
  }
}

const responseCache = new Map<string, CacheEntry>()
const inFlightRequests = new Map<string, Promise<ChatResult>>()
const modelCooldowns = new Map<string, number>()

function cleanHistory(value: unknown): ClientMessage[] {
  if (!Array.isArray(value)) return []

  return value
    .filter((entry): entry is ClientMessage => {
      if (!entry || typeof entry !== 'object') return false
      const candidate = entry as Partial<ClientMessage>
      return (
        (candidate.role === 'user' || candidate.role === 'model') &&
        typeof candidate.text === 'string' &&
        candidate.text.trim().length > 0
      )
    })
    .slice(-MAX_HISTORY_MESSAGES)
    .map(entry => ({
      role: entry.role,
      text: entry.text.trim().slice(0, MAX_MESSAGE_LENGTH),
    }))
}

function economyContext(value: unknown): string {
  if (!value || typeof value !== 'object') return 'Aucun indicateur de simulation actif.'

  const source = value as Record<string, unknown>
  const safeEntries = Object.entries(source)
    .filter(([key]) => key.length <= 40)
    .filter(([, item]) => typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean')
    .slice(0, 18)

  if (safeEntries.length === 0) return 'Aucun indicateur de simulation actif.'
  return safeEntries.map(([key, item]) => `${key}: ${String(item).slice(0, 80)}`).join(' | ')
}

function systemInstruction(context: string, playerName: string, economy: string) {
  const discoveryMode = context === 'discovery'
  const playerAddress = playerName.toLocaleLowerCase('fr-FR') === 'gouverneur'
    ? '« Gouverneur » (une seule fois, jamais « Gouverneur Gouverneur »)'
    : `« ${playerName} »`
  return `Tu es Floussi, le coach pédagogique du Central Bank Simulator (CBS), une plateforme marocaine d'apprentissage de la politique monétaire.

Règles de réponse :
- Réponds toujours en français clair, chaleureux et précis.
- Adresse-toi à l'apprenant sous le nom ${playerAddress}.
- ${discoveryMode ? 'Le joueur est en mode Découverte : zéro jargon non expliqué, phrases courtes, analogies concrètes du quotidien marocain, 120 mots maximum.' : 'Adapte le niveau au contexte de la page et reste sous 180 mots.'}
- Explique les mécanismes économiques sans inventer de données ni de décisions de Bank Al-Maghrib.
- N’invente jamais un chiffre, un taux, un score, une partie ou un scénario sélectionné. Utilise uniquement les valeurs explicitement présentes ci-dessous ou dans la question.
- Si les indicateurs indiquent qu’aucune simulation n’est active, ne donne aucune valeur économique présentée comme actuelle.
- Quand une question dépend de données récentes absentes du contexte, dis-le explicitement.
- Ne fournis pas de conseil financier personnel. Présente les choix comme des leviers de simulation et leurs compromis.
- Utilise au maximum trois courts paragraphes ou une petite liste. Pas de grand titre.
- Termine toujours tes phrases : ne coupe jamais une réponse au milieu d'une idée.
- Si pertinent, termine par une question ou un mini-défi qui aide à apprendre.

Contexte de page : ${context}.
Repères fiables de cette page : ${PAGE_GUIDANCE[context] ?? PAGE_GUIDANCE.landing}
Indicateurs disponibles : ${economy}`
}

function configuredModels(): string[] {
  const models = [
    process.env.GEMINI_MODEL ?? DEFAULT_MODEL,
    process.env.GEMINI_FALLBACK_MODEL ?? DEFAULT_FALLBACK_MODEL,
  ]

  return [...new Set(models.map(model => model.trim()).filter(Boolean))]
}

function generationConfig(model: string, context: string) {
  const config: Record<string, unknown> = {
    temperature: 0.55,
    topP: 0.9,
    maxOutputTokens: context === 'discovery' ? 1_024 : 1_536,
  }

  if (model.startsWith('gemini-2.5')) {
    config.thinkingConfig = { thinkingBudget: 0 }
  } else if (model.startsWith('gemini-3')) {
    config.thinkingConfig = { thinkingLevel: 'minimal' }
  }

  return config
}

function retryAfterSeconds(response: Response, message = ''): number {
  const header = response.headers.get('retry-after')
  const headerSeconds = header ? Number(header) : Number.NaN
  if (Number.isFinite(headerSeconds) && headerSeconds > 0) return Math.ceil(headerSeconds)

  const match = message.match(/retry in\s+([\d.]+)s/i)
  return match ? Math.ceil(Number(match[1])) : 15
}

function rememberCooldown(model: string, seconds: number) {
  const boundedSeconds = Math.max(2, Math.min(seconds, 60))
  modelCooldowns.set(model, Date.now() + boundedSeconds * 1_000)
}

function modelIsCoolingDown(model: string) {
  return (modelCooldowns.get(model) ?? 0) > Date.now()
}

async function requestGemini(
  apiKey: string,
  model: string,
  contents: Array<{ role: ClientMessage['role']; parts: Array<{ text: string }> }>,
  instruction: string,
  context: string,
) {
  if (modelIsCoolingDown(model)) {
    const seconds = Math.ceil(((modelCooldowns.get(model) ?? Date.now()) - Date.now()) / 1_000)
    throw new GeminiRequestError('Modèle temporairement limité.', 429, 'MODEL_COOLDOWN', seconds)
  }

  let response: Response
  try {
    response = await fetch(`${GEMINI_ENDPOINT}/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: instruction }] },
        contents,
        generationConfig: generationConfig(model, context),
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch (error) {
    const isTimeout = error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')
    throw new GeminiRequestError(
      isTimeout ? 'Le modèle a dépassé le délai de réponse.' : 'Connexion au modèle impossible.',
      504,
      isTimeout ? 'MODEL_TIMEOUT' : 'MODEL_NETWORK_ERROR',
    )
  }

  const rawPayload = await response.text()
  let payload: GeminiPayload = {}
  try {
    payload = rawPayload ? JSON.parse(rawPayload) as GeminiPayload : {}
  } catch {
    if (response.ok) {
      throw new GeminiRequestError('Réponse Gemini illisible.', 502, 'INVALID_MODEL_RESPONSE')
    }
  }

  if (!response.ok) {
    const message = payload.error?.message ?? `Gemini HTTP ${response.status}`
    const waitSeconds = response.status === 429 ? retryAfterSeconds(response, message) : 0
    if (response.status === 429) rememberCooldown(model, waitSeconds)

    console.warn('Gemini model unavailable:', { model, status: response.status, code: payload.error?.status })
    throw new GeminiRequestError(message, response.status, payload.error?.status ?? 'MODEL_ERROR', waitSeconds)
  }

  if (payload.promptFeedback?.blockReason) {
    throw new GeminiRequestError('Question bloquée par les règles de sécurité.', 400, 'PROMPT_BLOCKED')
  }

  const candidate = payload.candidates?.[0]
  const text = candidate?.content?.parts
    ?.map(part => part.text ?? '')
    .join('')
    .trim()

  if (!text) {
    throw new GeminiRequestError('Aucune réponse générée.', 502, 'EMPTY_MODEL_RESPONSE')
  }

  if (candidate?.finishReason === 'MAX_TOKENS') {
    throw new GeminiRequestError('Réponse incomplète du modèle.', 502, 'TRUNCATED_MODEL_RESPONSE')
  }

  return text
}

function readCache(key: string): CacheEntry | undefined {
  const entry = responseCache.get(key)
  if (!entry) return undefined
  if (entry.expiresAt <= Date.now()) {
    responseCache.delete(key)
    return undefined
  }
  return entry
}

function writeCache(key: string, text: string, model: string) {
  if (responseCache.size >= CACHE_MAX_ENTRIES) {
    const oldestKey = responseCache.keys().next().value
    if (typeof oldestKey === 'string') responseCache.delete(oldestKey)
  }
  responseCache.set(key, { text, model, expiresAt: Date.now() + CACHE_TTL_MS })
}

async function generateWithFallback(
  apiKey: string,
  models: string[],
  contents: Array<{ role: ClientMessage['role']; parts: Array<{ text: string }> }>,
  instruction: string,
  context: string,
): Promise<ChatResult> {
  let lastError: GeminiRequestError | undefined

  for (const model of models) {
    try {
      const text = await requestGemini(apiKey, model, contents, instruction, context)
      return { text, model, source: 'gemini' }
    } catch (error) {
      lastError = error instanceof GeminiRequestError
        ? error
        : new GeminiRequestError('Erreur Gemini inconnue.', 502, 'UNKNOWN_MODEL_ERROR')

      // Une question bloquée ou une clé refusée ne seront pas résolues par un autre modèle.
      if (lastError.status === 400 || lastError.status === 401 || lastError.status === 403) break
    }
  }

  throw lastError ?? new GeminiRequestError('Aucun modèle disponible.', 503, 'NO_MODEL_AVAILABLE')
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Le service IA n’est pas configuré.', code: 'AI_NOT_CONFIGURED' },
      { status: 503 },
    )
  }

  let body: ChatRequest
  try {
    const rawBody = await request.text()
    if (rawBody.length > MAX_REQUEST_LENGTH) {
      return NextResponse.json({ error: 'La requête est trop volumineuse.', code: 'REQUEST_TOO_LARGE' }, { status: 413 })
    }
    body = JSON.parse(rawBody) as ChatRequest
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide.', code: 'INVALID_REQUEST' }, { status: 400 })
  }

  const message = typeof body.message === 'string' ? body.message.trim() : ''
  if (!message) {
    return NextResponse.json({ error: 'Le message est requis.', code: 'MESSAGE_REQUIRED' }, { status: 400 })
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: 'Le message est trop long.', code: 'MESSAGE_TOO_LONG' }, { status: 413 })
  }

  const history = cleanHistory(body.history)
  const requestedContext = typeof body.context === 'string' ? body.context.slice(0, 40) : 'landing'
  const context = ALLOWED_CONTEXTS.has(requestedContext) ? requestedContext : 'landing'
  const playerName = typeof body.playerName === 'string'
    ? body.playerName.replace(/[\r\n\t]+/g, ' ').trim().slice(0, 50) || 'Gouverneur'
    : 'Gouverneur'
  const economy = economyContext(body.economy)
  const contents = [
    ...history.map(entry => ({ role: entry.role, parts: [{ text: entry.text }] })),
    { role: 'user' as const, parts: [{ text: message }] },
  ]
  const instruction = systemInstruction(context, playerName, economy)
  const cacheKey = JSON.stringify({ message, history, context, playerName, economy })
  const cached = readCache(cacheKey)

  if (cached) {
    return NextResponse.json({ text: cached.text, model: cached.model, source: 'cache' })
  }

  const existingRequest = inFlightRequests.get(cacheKey)
  if (existingRequest) {
    try {
      const result = await existingRequest
      return NextResponse.json({ ...result, source: 'deduplicated' })
    } catch (error) {
      return modelErrorResponse(error)
    }
  }

  const pendingRequest = generateWithFallback(
    apiKey,
    configuredModels(),
    contents,
    instruction,
    context,
  )
  inFlightRequests.set(cacheKey, pendingRequest)

  try {
    const result = await pendingRequest
    writeCache(cacheKey, result.text, result.model)
    return NextResponse.json(result)
  } catch (error) {
    return modelErrorResponse(error)
  } finally {
    inFlightRequests.delete(cacheKey)
  }
}

function modelErrorResponse(error: unknown) {
  const failure = error instanceof GeminiRequestError
    ? error
    : new GeminiRequestError('Le service IA est momentanément indisponible.', 503, 'AI_UNAVAILABLE')

  const status = failure.status === 400 ? 400 : failure.status === 429 ? 429 : 503
  return NextResponse.json(
    {
      error: status === 400
        ? failure.message
        : 'Les modèles en ligne sont momentanément occupés. Le guide CBS prend le relais.',
      code: failure.code,
      retryAfter: failure.retryAfterSeconds || undefined,
    },
    {
      status,
      headers: failure.retryAfterSeconds
        ? { 'retry-after': String(failure.retryAfterSeconds) }
        : undefined,
    },
  )
}
