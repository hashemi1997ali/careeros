import { z } from 'zod'

const serviceUrl = z.url().refine((value) => !value.endsWith('/'), {
  message: 'URL must not end with a slash',
})

const careerOsSchema = z.object({
  SERVER_URL: serviceUrl,
  SKILLS_APP_URL: serviceUrl.optional(),
})

const skillsSchema = z.object({
  SKILLS_API_URL: serviceUrl,
})

export type CareerOsConfig = z.infer<typeof careerOsSchema>
export type SkillsConfig = z.infer<typeof skillsSchema>

let careerOsConfig: CareerOsConfig | null = null
let skillsConfig: SkillsConfig | null = null

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

export const skills = (): SkillsConfig => {
  skillsConfig ??= parseConfig(skillsSchema, 'SkillForge service')
  return skillsConfig
}
