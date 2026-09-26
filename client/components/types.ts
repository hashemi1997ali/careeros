export interface CurrentUser {
  id: string
  sub: string
  email: string | null
  displayName: string | null
  pictureUrl: string | null
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
}

export interface JobApplication {
  id: number
  company: string
  position: string
  jobUrl: string | null
  location: string | null
  salary: number | null
  status: ApplicationStatus
  appliedAt: string | null
  interviewAt: string | null
  notes: string | null
  jobDescription: string | null
  createdAt: string
  updatedAt: string
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
  startDate: string | null
  projects: SkillProject[]
}

export interface SkillProject {
  id: number
  title: string
}

export interface SkillSuggestion {
  id: number
  name: string
  category: string
}

export interface Project {
  id: number
  title: string
  description: string
  repositoryUrl: string | null
  liveUrl: string | null
  startDate: string | null
  endDate: string | null
  skills: Skill[]
}

export interface JobMatch {
  jobApplicationId: number
  matchScore: number
  hasRequirements: boolean
  matchedSkills: string[]
  missingRequiredSkills: string[]
  missingOptionalSkills: string[]
}

export interface ExtractedRequirement {
  name: string
  isRequired: boolean
}

export interface ExtractedApplication {
  company: string | null
  position: string | null
  status?: ApplicationStatus | null
  jobUrl: string | null
  location: string | null
  salary: number | null
  appliedAt: string | null
  interviewAt: string | null
  jobDescription: string | null
  notes: string | null
  requirements: ExtractedRequirement[]
}

export interface AiJobAnalysis {
  isJobPosting: boolean
  summary: string
  explanation: string
  matchScore: number
  matchedSkills: string[]
  missingRequiredSkills: string[]
  missingOptionalSkills: string[]
  detectedRequirements: ExtractedRequirement[]
  roadmapSkills: string[]
  extractedApplication: ExtractedApplication | null
}
