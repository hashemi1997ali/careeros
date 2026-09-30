import type { ReactNode } from 'react'
import { Icon, type IconName } from '@/components/icons'

export function EmptyState({ title, description, action, icon }: { title: string; description: string; action?: ReactNode; icon?: IconName }) {
  return <div className="empty-state">
    {icon && <span className="empty-state-icon" aria-hidden="true"><Icon name={icon} size={22} /></span>}
    <strong>{title}</strong>
    <p>{description}</p>
    {action && <div className="empty-state-action">{action}</div>}
  </div>
}
