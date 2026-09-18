import crypto from 'node:crypto'
import { decodeJwt, jwtVerify } from 'jose'
import type { NextRequest, NextResponse } from 'next/server'
import { config, getJwks, getOidc } from './config'
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  cookieOptions,
  seal,
  unseal,
  type AuthTransaction,
  type SessionData,
} from './session'

interface TokenResponse {
  access_token: string
  id_token: string
  refresh_token?: string
  expires_in?: number
}

export const randomString = (): string => crypto.randomBytes(32).toString('base64url')

export const challengeFrom = (verifier: string): string =>
  crypto.createHash('sha256').update(verifier).digest('base64url')

const REFRESH_SKEW_MS = 60_000

const expiryOf = (tokens: TokenResponse): number => {
  try {
    const { exp } = decodeJwt(tokens.access_token)
    if (typeof exp === 'number') return exp * 1000
  } catch {
    // Opaque token — fall back to the advertised lifetime.
  }
  return Date.now() + (tokens.expires_in ?? 3600) * 1000
}

export const buildAuthorizationUrl = async (
  transaction: AuthTransaction,
): Promise<string> => {
  const { OIDC_CLIENT_ID, API_AUDIENCE, redirectUri } = config()
  const oidc = await getOidc()

  const url = new URL(oidc.authorization_endpoint)
  url.searchParams.set('client_id', OIDC_CLIENT_ID)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('state', transaction.state)
  url.searchParams.set('nonce', transaction.nonce)
  url.searchParams.set('code_challenge', challengeFrom(transaction.codeVerifier))
  url.searchParams.set('code_challenge_method', 'S256')

  url.searchParams.set('scope', 'openid profile email offline_access')

  url.searchParams.set('audience', API_AUDIENCE)

  return url.toString()
}

export const exchangeCode = async (
  code: string,
  transaction: AuthTransaction,
): Promise<{ tokens: TokenResponse; claims: Record<string, unknown> }> => {
  const { OIDC_CLIENT_ID, OIDC_CLIENT_SECRET, redirectUri } = config()
  const oidc = await getOidc()

  const response = await fetch(oidc.token_endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: OIDC_CLIENT_ID,
      client_secret: OIDC_CLIENT_SECRET,
      code_verifier: transaction.codeVerifier,
    }),
  })

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${await response.text()}`)
  }

  const tokens = (await response.json()) as TokenResponse

  const { payload } = await jwtVerify(tokens.id_token, await getJwks(), {
    issuer: oidc.issuer,
    audience: OIDC_CLIENT_ID,
  })

  if (payload.nonce !== transaction.nonce) {
    throw new Error('Nonce mismatch')
  }

  return { tokens, claims: payload as Record<string, unknown> }
}

export const sessionFromTokens = (
  tokens: TokenResponse,
  claims: Record<string, unknown>,
  userId: string,
): SessionData => {
  const email = typeof claims.email === 'string' ? claims.email : null

  return {
    sub: String(claims.sub),
    userId,
    email,
    displayName:
      (typeof claims.name === 'string' && claims.name) ||
      (typeof claims.nickname === 'string' && claims.nickname) ||
      email,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? null,
    accessTokenExpiresAt: expiryOf(tokens),
  }
}

export interface ResolvedSession {
  session: SessionData
  renewed: boolean
}

export const resolveSession = async (
  request: NextRequest,
): Promise<ResolvedSession | null> => {
  const session = await unseal<SessionData>(request.cookies.get(SESSION_COOKIE)?.value)
  if (!session) return null

  if (Date.now() < session.accessTokenExpiresAt - REFRESH_SKEW_MS) {
    return { session, renewed: false }
  }

  if (!session.refreshToken) return null

  const { OIDC_CLIENT_ID, OIDC_CLIENT_SECRET } = config()
  const oidc = await getOidc()

  const response = await fetch(oidc.token_endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: session.refreshToken,
      client_id: OIDC_CLIENT_ID,
      client_secret: OIDC_CLIENT_SECRET,
    }),
  })

  if (!response.ok) {
    return null
  }

  const tokens = (await response.json()) as TokenResponse

  return {
    session: {
      ...session,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? session.refreshToken,
      accessTokenExpiresAt: expiryOf(tokens),
    },
    renewed: true,
  }
}

export const persistIfRenewed = async (
  response: NextResponse,
  resolved: ResolvedSession,
): Promise<NextResponse> => {
  if (!resolved.renewed) return response

  response.cookies.set(SESSION_COOKIE, await seal(resolved.session, SESSION_TTL_SECONDS), {
    ...cookieOptions,
    maxAge: SESSION_TTL_SECONDS,
  })

  return response
}
