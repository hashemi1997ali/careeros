import type { ApplicationStatus } from '@/components/types'

const labels: Record<ApplicationStatus, string> = {
  Saved: 'Saved',
  Applied: 'Applied',
  HrInterview: 'HR interview',
  TechnicalInterview: 'Technical',
  Offer: 'Offer',
  Rejected: 'Rejected',
  Withdrawn: 'Withdrawn'
}

export function formatApplicationStatus(status: ApplicationStatus) {
  return labels[status] ?? status
}
