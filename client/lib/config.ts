import { z } from 'zod'

const serviceUrl = z.url().refine((value) => !value.endsWith('/'), {
  message: 'URL must not end with a slash',
})

const careerOsSchema = z.object({
  SERVER_URL: serviceUrl,
  SKILLS_APP_URL: serviceUrl.optional(),
})

export type CareerOsConfig = z.infer<typeof careerOsSchema>

let careerOsConfig: CareerOsConfig | null = null

const parseConfig = <T>(schema: z.ZodType<T>, name: string): T => {
  const parsed = schema.safeParse(process.env)

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n')
    throw new Error(`Invalid ${name} configuration:\n${issues}`)
  }

  return parsed.data
}

export const careerOs = (): CareerOsConfig => {
  careerOsConfig ??= parseConfig(careerOsSchema, 'CareerOS service')
  return careerOsConfig
}
