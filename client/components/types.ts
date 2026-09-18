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

export interface JobApplication {
  id: number
  company: string
  position: string
  status: ApplicationStatus
  appliedAtUtc: string | null
  updatedAtUtc: string
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

export interface Skill {
  id: number
  name: string
  category: string
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
}

export interface Project {
  id: number
  title: string
  description: string
  repositoryUrl: string | null
  liveUrl: string | null
  updatedAtUtc: string
  skills: Skill[]
}
