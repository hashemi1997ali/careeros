'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createContext, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react'
import { BrandMark } from '@/components/brand'
import { AmbientDots } from '@/components/ambient-dots'
import { GlobalSearch } from '@/components/global-search'
import { Icon, type IconName } from '@/components/icons'
import { ModalShell } from '@/components/modal-shell'
import { NotificationViewport } from '@/components/notification-viewport'
import { ThemeSwitch, useThemePreference } from '@/components/theme-toggle'
import type { CurrentUser } from '@/components/types'
import { applyTheme, themeChangeEvent } from '@/lib/theme'
import { headerScrollThreshold } from '@/lib/ui-chrome'

const navigation: Array<{ label: string; href: string; icon: IconName }> = [
  { label: 'Dashboard', href: '/dashboard', icon: 'grid' },
  { label: 'Applications', href: '/applications', icon: 'briefcase' },
  { label: 'Skills', href: '/skills', icon: 'brain' },
  { label: 'Projects', href: '/projects', icon: 'folder' },
  { label: 'Job analyzer', href: '/job-analyzer', icon: 'sparkles' },
]
const mobileNavigation = [navigation[0], navigation[1], navigation[4], navigation[2], navigation[3]]
const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`)

const UserContext = createContext<CurrentUser | null>(null)
const SkillsAppUrlContext = createContext<string | null>(null)
export function useCareerUser() { const user = useContext(UserContext); if (!user) throw new Error('useCareerUser must be used inside AppShell'); return user }
export function useSkillsAppUrl() { return useContext(SkillsAppUrlContext) }

function Avatar({ user }: { user: CurrentUser }) {
  return user.pictureUrl
    ? <span className="avatar avatar-photo" role="img" aria-label={user.displayName ? `${user.displayName} profile photo` : 'Profile photo'} style={{ backgroundImage: `url(${JSON.stringify(user.pictureUrl)})` }} />
    : <span className="avatar avatar-default" aria-hidden="true"><Icon name="user" size={18}/></span>
}

function subscribeSidebar(listener: () => void) { window.addEventListener('storage', listener); window.addEventListener(themeChangeEvent, listener); return () => { window.removeEventListener('storage', listener); window.removeEventListener(themeChangeEvent, listener) } }
function storedSidebar() { try { return localStorage.getItem('careeros-sidebar') === 'collapsed' } catch { return false } }

const isMac = () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)

export function AppShell({ children, user, skillsAppUrl }: { children: ReactNode; user: CurrentUser; skillsAppUrl: string | null }) {
  const pathname = usePathname()
  const mobileActiveIndex = mobileNavigation.findIndex(item => isActive(pathname, item.href))
  const activeIndex = navigation.findIndex(item => isActive(pathname, item.href))
  const collapsed = useSyncExternalStore(subscribeSidebar, storedSidebar, () => false)
  const theme = useThemePreference()
  const shortcut = useSyncExternalStore(() => () => {}, () => (isMac() ? '⌘K' : 'Ctrl K'), () => '⌘K')
  const [searchOpen, setSearchOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const profileTriggerRef = useRef<HTMLButtonElement>(null)

  // Keep the document theme in sync with the stored preference (and the OS when set to "system").
  useEffect(() => { applyTheme(theme) }, [theme])
  useEffect(() => {
    if (theme !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => applyTheme('system')
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [theme])
  useEffect(() => {
    let frame = 0
    const update = () => { frame = 0; setScrolled(window.scrollY > headerScrollThreshold) }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', schedule) }
  }, [])
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      const isSearchShortcut = (event.metaKey || event.ctrlKey) && (event.key.toLowerCase() === 'k' || event.code === 'KeyK')
      if (!isSearchShortcut || event.isComposing || document.querySelector('.modal-layer[data-open="true"]')) return
      event.preventDefault()
      setSearchOpen(true)
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [])
  // Close the account menu on navigation.
  useEffect(() => { const frame = requestAnimationFrame(() => setProfileOpen(false)); return () => cancelAnimationFrame(frame) }, [pathname])

  const accountName = useMemo(() => user.displayName?.trim() || user.email?.split('@')[0] || 'Your account', [user])
  const toggleSidebar = () => { try { localStorage.setItem('careeros-sidebar', collapsed ? 'expanded' : 'collapsed') } catch {} window.dispatchEvent(new Event(themeChangeEvent)) }

  return <UserContext.Provider value={user}><SkillsAppUrlContext.Provider value={skillsAppUrl}>
    <div className="app-shell" data-collapsed={collapsed ? 'true' : 'false'}>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <AmbientDots/>
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="sidebar-head">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- a full navigation runs the cross-document view transition */}
          <a className="sidebar-identity" href="/" aria-label="CareerOS home">
            <BrandMark className="sidebar-identity-mark"/>
            <span className="sidebar-identity-wordmark">CareerOS</span>
          </a>
        </div>
        <nav className="sidebar-nav" id="sidebar-navigation">
          <div className="sidebar-list" data-has-active={activeIndex >= 0 ? 'true' : 'false'} style={{ '--active-index': Math.max(0, activeIndex) } as CSSProperties}>
            <span className="sidebar-indicator" aria-hidden="true" />
            {navigation.map(item => { const active = isActive(pathname, item.href); return <Link className={active ? 'nav-link is-active' : 'nav-link'} aria-current={active ? 'page' : undefined} href={item.href} key={item.href} title={collapsed ? item.label : undefined}><Icon name={item.icon} size={19}/><span className="nav-link-label">{item.label}</span></Link> })}
            {skillsAppUrl && <a className="nav-link" href={skillsAppUrl} target="_blank" rel="noreferrer" aria-label="SkillForge (opens in a new tab)" title={collapsed ? 'SkillForge' : undefined}><Icon name="skillforge" size={19}/><span className="nav-link-label">SkillForge</span><span className="sidebar-external-action" aria-hidden="true"><Icon name="external" size={14}/></span></a>}
          </div>
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-note" aria-hidden="true"><span className="sidebar-note-icon"><Icon name="sparkles" size={18}/></span><p>A better career<br/>is a series of<br/>small steps.</p></div>
          <button className="nav-link sidebar-toggle" type="button" onClick={toggleSidebar} aria-controls="sidebar-navigation" aria-expanded={!collapsed} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={collapsed ? 'Expand sidebar' : undefined}><Icon name={collapsed ? 'panelOpen' : 'panelClose'} size={19}/><span className="nav-link-label">Collapse</span></button>
        </div>
      </aside>

      <div className="content-shell">
        <header className="topbar career-header-surface vt-app-header" data-scrolled={scrolled ? 'true' : 'false'}>
          {/* Plain anchor on purpose: only a full navigation runs the cross-document view transition to the landing page. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a className="topbar-brand" href="/" aria-label="CareerOS home">
            <BrandMark className="topbar-brand-mark"/>
            <span className="topbar-brand-wordmark">CareerOS</span>
          </a>
          <button className="global-search-trigger" type="button" onClick={() => setSearchOpen(true)} aria-label="Search CareerOS" aria-haspopup="dialog" aria-keyshortcuts="Control+K Meta+K">
            <Icon name="search" size={18}/><span className="global-search-placeholder">Search applications, skills and projects</span><kbd>{shortcut}</kbd>
          </button>
          <div className="topbar-actions">
            <ThemeSwitch className="topbar-theme-switch"/>
            <button ref={profileTriggerRef} className={`profile-button${profileOpen ? ' is-active' : ''}`} type="button" data-profile-trigger onClick={() => setProfileOpen(value => !value)} aria-expanded={profileOpen} aria-haspopup="dialog" aria-label="Open account menu">
              <Avatar user={user}/>
              <span className="profile-copy"><strong>{accountName}</strong>{user.email && <small>{user.email}</small>}</span>
              <Icon name="chevron" size={16} className="profile-chevron"/>
            </button>
          </div>
        </header>
        <main id="main-content" className="app-main" tabIndex={-1}><div key={pathname} className="page-enter">{children}</div></main>
        <nav className="mobile-nav" aria-label="Primary navigation">
          <div className="mobile-nav-track" data-has-active={mobileActiveIndex >= 0 ? 'true' : 'false'} style={{ '--active-index': Math.max(0, mobileActiveIndex) } as CSSProperties}>
            <span className="mobile-nav-indicator" aria-hidden="true" />
            {mobileNavigation.map(item => { const active = isActive(pathname, item.href); return <Link className={active ? 'is-active' : ''} aria-current={active ? 'page' : undefined} href={item.href} key={item.href} aria-label={item.label}><Icon name={item.icon} size={20}/><span>{item.label}</span></Link> })}
          </div>
        </nav>
      </div>
    </div>
    <ModalShell open={profileOpen} onClose={() => setProfileOpen(false)} layerClassName="profile-modal-layer" surfaceClassName="profile-modal" anchorRef={profileTriggerRef} ariaLabel="Account menu">
      <div className="profile-modal-user"><Avatar user={user}/><div><strong>{accountName}</strong>{user.email && <small>{user.email}</small>}</div></div>
      {skillsAppUrl && <a className="profile-modal-action" href={skillsAppUrl} target="_blank" rel="noreferrer"><Icon name="skillforge" size={18}/><span>Open SkillForge</span><Icon name="external" size={14}/></a>}
      <a className="profile-modal-action profile-modal-danger" href="/auth/logout"><Icon name="logout" size={18}/><span>Sign out</span></a>
    </ModalShell>
    <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)}/>
    <NotificationViewport />
  </SkillsAppUrlContext.Provider></UserContext.Provider>
}
