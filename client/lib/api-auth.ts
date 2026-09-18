import { auth0 } from './auth0'

export const getApiAccessToken = async (): Promise<string | null> => {
  const session = await auth0.getSession()
  if (!session) return null

  try {
    return (await auth0.getAccessToken()).token
  } catch (error) {
    console.error('[auth] could not obtain an API access token', error)
    return null
  }
}
