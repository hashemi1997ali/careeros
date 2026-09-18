import Image from 'next/image'
import Link from 'next/link'

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link className={compact ? 'brand brand-compact' : 'brand'} href="/" aria-label="CareerOS home">
      <Image className="brand-logo brand-logo-dark" src="/images/careeros/logo-dark.png" width={2172} height={724} alt="CareerOS — Track. Improve. Get Hired." priority unoptimized />
      <Image className="brand-logo brand-logo-light" src="/images/careeros/logo-light.png" width={2172} height={724} alt="CareerOS — Track. Improve. Get Hired." priority unoptimized />
    </Link>
  )
}
