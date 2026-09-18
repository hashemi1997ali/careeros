import { createRemoteJWKSet } from 'jose'
import { z } from 'zod'

const schema = z.object({
  BASE_URL: z.url().refine((value) => !value.endsWith('/'), {
    message: 'BASE_URL must not end with a slash',
  }),
  OIDC_ISSUER: z.url(),
  OIDC_CLIENT_ID: z.string().min(1),
  OIDC_CLIENT_SECRET: z.string().min(1),
  API_AUDIENCE: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  SERVER_URL: z.url(),
  SKILLS_API_URL: z.url(),
  SKILLS_APP_URL: z.url().optional(),
})

export type Config = z.infer<typeof schema> & { redirectUri: string; isProduction: boolean }

let cached: Config | null = null

export const config = (): Config => {
  if (cached) return cached

  const parsed = schema.safeParse(process.env)

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n')
    throw new Error(`Invalid environment configuration:\n${issues}`)
  }

  cached = {
    ...parsed.data,
    redirectUri: `${parsed.data.BASE_URL}/auth/callback`,
    isProduction: process.env.NODE_ENV === 'production',
  }

  return cached
}

export interface OidcDocument {
  issuer: string
  authorization_endpoint: string
  token_endpoint: string
  userinfo_endpoint: string
  jwks_uri: string
  end_session_endpoint?: string
}

let discovery: Promise<OidcDocument> | null = null

export const getOidc = (): Promise<OidcDocument> => {
  discovery ??= (async () => {
    const issuer = config().OIDC_ISSUER
    const base = issuer.endsWith('/') ? issuer : `${issuer}/`
    const url = new URL('.well-known/openid-configuration', base)

    const response = await fetch(url)
    if (!response.ok) {
      discovery = null // do not cache a failure; let the next request retry
      throw new Error(`OIDC discovery failed with ${response.status} at ${url.toString()}`)
    }
    return (await response.json()) as OidcDocument
  })()

  return discovery
}

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null

export const getJwks = async (): Promise<ReturnType<typeof createRemoteJWKSet>> => {
  if (!jwks) {
    const oidc = await getOidc()
    jwks = createRemoteJWKSet(new URL(oidc.jwks_uri))
  }
  return jwks
}
