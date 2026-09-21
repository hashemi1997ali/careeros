export interface CurrentUser {
  id: string
  sub: string
  email: string | null
  displayName: string | null
}

export type ApplicationStatus =
  | 'Saved'
  | 'Applied'
  | 'HrInterview'
  | 'TechnicalInterview'
  | 'Offer'
  | 'Rejected'
  | 'Withdrawn'

export interface JobRequirement {
  id: number
  name: string
  isRequired: boolean
  weight: number
}

export interface JobApplication {
  id: number
  company: string
  position: string
  jobUrl: string | null
  location: string | null
  salary: number | null
  status: ApplicationStatus
  appliedAtUtc: string | null
  interviewAtUtc: string | null
  notes: string | null
  jobDescription: string | null
  createdAtUtc: string
  updatedAtUtc: string
  requirements: JobRequirement[]
}

export interface DashboardData {
  totalSkills: number
  totalProjects: number
  totalApplications: number
  averageMatchScore: number
  applicationsByStatus: Record<ApplicationStatus, number>
  topMissingSkills: Array<{ name: string; count: number }>
  recentApplications: JobApplication[]
}

export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced'

export interface Skill {
  id: number
  name: string
  category: string
  level: SkillLevel
}

export interface Project {
  id: number
  title: string
  description: string
  repositoryUrl: string | null
  liveUrl: string | null
  createdAtUtc: string
  updatedAtUtc: string
  skills: Skill[]
}

export interface JobMatch {
  jobApplicationId: number
  matchScore: number
  matchedSkills: string[]
  missingRequiredSkills: string[]
  missingOptionalSkills: string[]
}
