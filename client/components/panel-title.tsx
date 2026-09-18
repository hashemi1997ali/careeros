import { Icon, type IconName } from '@/components/icons'

export function PanelTitle({ icon, title, subtitle }: { icon: IconName; title: string; subtitle: string }) {
  return (
    <div className="panel-title">
      <span className="soft-icon"><Icon name={icon} /></span>
      <div><h2>{title}</h2><p>{subtitle}</p></div>
    </div>
  )
}
