import Link from 'next/link'
import { Icon, type IconName } from '@/components/icons'
import { Bone } from '@/components/skeleton'

/** `placeholder` draws the same title as an empty skeleton (icon tile + text bars) that wraps exactly like the real one. */
export function PanelTitle({ icon, title, subtitle, placeholder = false }: { icon: IconName; title: string; subtitle: string; placeholder?: boolean }) {
  const text = (value: string) => placeholder ? <span className="skeleton-text">{value}</span> : value
  return (
    <div className="panel-title" aria-hidden={placeholder || undefined}>
      {placeholder ? <Bone w={38} h={38} r={12} /> : <span className="soft-icon"><Icon name={icon} size={18} /></span>}
      <div><h2>{text(title)}</h2><p>{text(subtitle)}</p></div>
    </div>
  )
}

export interface PanelHeadingProps {
  icon: IconName
  title: string
  subtitle: string
  link?: { href: string; label: string }
}

/** A panel title with an optional "View all"-style link on the right. */
export function PanelHeading({ icon, title, subtitle, link, placeholder = false }: PanelHeadingProps & { placeholder?: boolean }) {
  const head = <PanelTitle icon={icon} title={title} subtitle={subtitle} placeholder={placeholder} />
  if (!link) return head
  return <div className="panel-heading">
    {head}
    {placeholder
      ? <span className="text-link skeleton-text" aria-hidden="true">{link.label}<Icon name="arrow" size={15} /></span>
      : <Link className="text-link" href={link.href}>{link.label}<Icon name="arrow" size={15} /></Link>}
  </div>
}
