import { z } from 'zod'

const serviceUrl = z.url().refine((value) => !value.endsWith('/'), {
  message: 'URL must not end with a slash',
})

const schema = z.object({
  SERVER_URL: serviceUrl,
  SKILLS_API_URL: serviceUrl,
  SKILLS_APP_URL: serviceUrl.optional(),
})

export type Config = z.infer<typeof schema>

let cached: Config | null = null

export const config = (): Config => {
  if (cached) return cached

  const parsed = schema.safeParse(process.env)

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n')
    throw new Error(`Invalid service configuration:\n${issues}`)
  }

  cached = parsed.data
  return cached
}
