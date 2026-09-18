import crypto from 'node:crypto'
import { EncryptJWT, jwtDecrypt } from 'jose'
import type { NextResponse } from 'next/server'
import { config } from './config'

export interface SessionData {
  sub: string
  userId: string
  email: string | null
  displayName: string | null
  accessToken: string
  refreshToken: string | null
  accessTokenExpiresAt: number
  [key: string]: unknown
}

export interface AuthTransaction {
  state: string
  nonce: string
  codeVerifier: string
  [key: string]: unknown
}

export const SESSION_COOKIE = 'sid'
export const TRANSACTION_COOKIE = 'auth_tx'

export const SESSION_TTL_SECONDS = 12 * 60 * 60
export const TRANSACTION_TTL_SECONDS = 5 * 60

export const cookieOptions = {
  httpOnly: true as const,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
}

const keyFor = (): Buffer =>
  crypto.createHash('sha256').update(config().SESSION_SECRET).digest()

export const seal = (payload: Record<string, unknown>, ttlSeconds: number): Promise<string> =>
  new EncryptJWT(payload)
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .encrypt(keyFor())

export const unseal = async <T>(value: string | undefined): Promise<T | null> => {
  if (!value) return null
  try {
    const { payload } = await jwtDecrypt(value, keyFor())
    return payload as T
  } catch {
    return null
  }
}

export const attachSession = async (
  response: NextResponse,
  session: SessionData,
): Promise<NextResponse> => {
  response.cookies.set(SESSION_COOKIE, await seal(session, SESSION_TTL_SECONDS), {
    ...cookieOptions,
    maxAge: SESSION_TTL_SECONDS,
  })
  return response
}
