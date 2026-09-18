'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { Brand } from '@/components/brand'
import { Icon, type IconName } from '@/components/icons'
import type { CurrentUser } from '@/components/types'

const navigation: Array<{ label: string; href: string; icon: IconName }> = [
  { label: 'Dashboard', href: '/dashboard', icon: 'grid' },
  { label: 'Applications', href: '/applications', icon: 'briefcase' },
  { label: 'Skills', href: '/skills', icon: 'sparkles' },
  { label: 'Projects', href: '/projects', icon: 'folder' },
  { label: 'Job analyzer', href: '/job-analyzer', icon: 'target' },
]

const UserContext = createContext<CurrentUser | null>(null)

export function useCareerUser() {
  const user = useContext(UserContext)
  if (!user) throw new Error('useCareerUser must be used inside an authenticated AppShell')
  return user
}

function initials(user: CurrentUser) {
  const value = user.displayName ?? user.email ?? 'CareerOS User'
  return value.split(/\s|@/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const storedTheme = window.localStorage.getItem('careeros-theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const nextDark = storedTheme ? storedTheme === 'dark' : prefersDark
    document.documentElement.dataset.theme = nextDark ? 'dark' : 'light'
    const themeFrame = window.requestAnimationFrame(() => setDark(nextDark))

    fetch('/api/me', { credentials: 'include', cache: 'no-store' })
      .then(async (response) => {
        if (response.status === 401) return null
        if (!response.ok) throw new Error('account_request_failed')
        return (await response.json()) as { user: CurrentUser }
      })
      .then((result) => setUser(result?.user ?? null))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false))

    return () => window.cancelAnimationFrame(themeFrame)
  }, [])

  const changeTheme = (nextDark: boolean) => {
    setDark(nextDark)
    document.documentElement.dataset.theme = nextDark ? 'dark' : 'light'
    window.localStorage.setItem('careeros-theme', nextDark ? 'dark' : 'light')
  }

  if (loading) return <ShellLoading />

  if (!user) {
    return (
      <main className="auth-state">
        <Brand />
        <div className="auth-state-card">
          <span className="soft-icon"><Icon name={failed ? 'target' : 'user'} /></span>
          <p className="eyebrow">CAREEROS WORKSPACE</p>
          <h1>{failed ? 'We could not load your account.' : 'Sign in to open your workspace.'}</h1>
          <p>{failed ? 'Check the deployment configuration and try again.' : 'Your skills, projects, and applications stay connected to your account.'}</p>
          <a className="button button-primary" href={failed ? pathname : '/auth/login'}>{failed ? 'Try again' : 'Sign in'}<Icon name="arrow" /></a>
        </div>
      </main>
    )
  }

  return (
    <UserContext.Provider value={user}>
      <div className="app-shell">
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <aside className="sidebar" aria-label="Primary navigation">
          <Brand compact />
          <nav className="sidebar-nav">
            {navigation.map((item) => {
              const active = pathname === item.href
              return <Link className={active ? 'nav-link is-active' : 'nav-link'} aria-current={active ? 'page' : undefined} href={item.href} key={item.href}><Icon name={item.icon} /><span>{item.label}</span></Link>
            })}
          </nav>

          <figure className="sidebar-visual">
            <Image className="theme-image theme-image-light" src="/images/careeros/summit-day.png" fill sizes="210px" alt="A bright mountain summit with a flag" unoptimized />
            <Image className="theme-image theme-image-dark" src="/images/careeros/summit-night.png" fill sizes="210px" alt="A mountain summit under a night sky" unoptimized />
            <figcaption>A better career is a series of small steps.</figcaption>
          </figure>

          <div className="theme-switch" aria-label="Color theme">
            <button className={!dark ? 'is-active' : ''} type="button" onClick={() => changeTheme(false)} aria-pressed={!dark}><Icon name="sun" />Light</button>
            <button className={dark ? 'is-active' : ''} type="button" onClick={() => changeTheme(true)} aria-pressed={dark}><Icon name="moon" />Dark</button>
          </div>
          <a className="logout-link" href="/auth/logout"><Icon name="logout" />Sign out</a>
        </aside>

        <div className="content-shell">
          <header className="topbar">
            <Brand compact />
            <div className="global-search" aria-hidden="true"><Icon name="search" /><span>Search jobs, skills, projects…</span><kbd>⌘ K</kbd></div>
            <button className="icon-button" type="button" aria-label="Notifications"><Icon name="bell" /></button>
            <div className="profile-chip">
              <span className="avatar">{initials(user)}</span>
              <span><strong>{user.displayName ?? 'CareerOS member'}</strong><small>{user.email ?? 'Career workspace'}</small></span>
              <Icon name="chevron" size={16} />
            </div>
          </header>
          <nav className="mobile-nav" aria-label="Primary navigation">
            {navigation.map((item) => <Link className={pathname === item.href ? 'is-active' : ''} href={item.href} key={item.href}><Icon name={item.icon} /><span>{item.label}</span></Link>)}
          </nav>
          <main id="main-content" className="app-main">{children}</main>
        </div>
      </div>
    </UserContext.Provider>
  )
}

function ShellLoading() {
  return (
    <main className="shell-loading" aria-live="polite">
      <Brand />
      <div className="skeleton-row"><i /><i /><i /><i /></div>
      <p>Preparing your workspace…</p>
    </main>
  )
}
