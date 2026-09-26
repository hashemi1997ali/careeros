import type { ApplicationStatus } from '@/components/types'

const labels: Record<ApplicationStatus, string> = {
  Saved: 'Saved',
  Applied: 'Applied',
  HrInterview: 'HR Interview',
  TechnicalInterview: 'Technical Interview',
  Offer: 'Offer',
  Rejected: 'Rejected',
  Withdrawn: 'Withdrawn'
}

export function formatApplicationStatus(status: ApplicationStatus) {
  return labels[status]
}
