import Image from 'next/image'
import Link from 'next/link'

export function BrandMark({ className = '' }: { className?: string }) {
  return <Image className={`brand-mark ${className}`.trim()} src="/images/careeros/brand-mark.png" width={1254} height={1254} sizes="64px" alt="" unoptimized />
}

export function Brand({ compact = false, href = '/', className = '' }: { compact?: boolean; href?: string; className?: string }) {
  return (
    <Link className={`${compact ? 'brand brand-compact' : 'brand'} ${className}`.trim()} href={href} aria-label={href === '/dashboard' ? 'CareerOS dashboard' : 'CareerOS home'}>
      <BrandMark />
      <span className="brand-name">CareerOS</span>
    </Link>
  )
}
