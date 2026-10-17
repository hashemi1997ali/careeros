import type { ReactNode } from 'react'
import type { ApplicationStatus, SkillLevel } from '@/components/types'
import { formatApplicationStatus } from '@/lib/application-status'

/* One badge for the whole app. `tag` is the neutral outlined label (skills, requirements),
   `more` its dashed "+N more" form; the coloured tones carry a status. */
export type BadgeTone = 'tag' | 'more' | 'neutral' | 'primary' | 'violet' | 'warning' | 'success' | 'danger' | 'muted'

export function Badge({ tone = 'tag', dot = false, title, children }: { tone?: BadgeTone; dot?: boolean; title?: string; children: ReactNode }) {
  return <span className={`badge badge-${tone}${dot ? ' badge-dot' : ''}`} title={title}>{children}</span>
}

/** Small number pill inside chips and headings. */
export function CountBadge({ children }: { children: ReactNode }) {
  return <span className="badge-count">{children}</span>
}

const statusTones: Record<ApplicationStatus, BadgeTone> = {
  Saved: 'neutral', Applied: 'primary', HrInterview: 'violet', TechnicalInterview: 'warning', Offer: 'success', Rejected: 'danger', Withdrawn: 'muted',
}

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return <Badge tone={statusTones[status] ?? 'neutral'} dot>{formatApplicationStatus(status)}</Badge>
}

const levelTones: Record<SkillLevel, BadgeTone> = { Beginner: 'warning', Intermediate: 'primary', Advanced: 'success' }

export function LevelBadge({ level }: { level: SkillLevel }) {
  return <Badge tone={levelTones[level] ?? 'neutral'} dot>{level}</Badge>
}
