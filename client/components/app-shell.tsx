'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react'
import { Brand, BrandMark } from '@/components/brand'
import { GlobalSearch } from '@/components/global-search'
import { Icon, type IconName } from '@/components/icons'
import type { CurrentUser } from '@/components/types'

type ThemePreference = 'light' | 'dark' | 'system'
const navigation: Array<{ label: string; href: string; icon: IconName }> = [
  { label: 'Dashboard', href: '/dashboard', icon: 'grid' },
  { label: 'Applications', href: '/applications', icon: 'briefcase' },
  { label: 'Skills', href: '/skills', icon: 'sparkles' },
  { label: 'Projects', href: '/projects', icon: 'folder' },
  { label: 'Job analyzer', href: '/job-analyzer', icon: 'target' },
]
const UserContext = createContext<CurrentUser | null>(null)
export function useCareerUser() { const user = useContext(UserContext); if (!user) throw new Error('useCareerUser must be used inside AppShell'); return user }
function initials(user: CurrentUser) { const value = user.displayName ?? user.email ?? 'CareerOS User'; return value.split(/\s|@/).filter(Boolean).slice(0,2).map(p => p[0]).join('').toUpperCase() }
function resolveTheme(preference: ThemePreference) { if (preference !== 'system') return preference; return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light' }
const preferenceEvent = 'careeros-preference-change'
function subscribePreferences(listener: () => void) { window.addEventListener('storage', listener); window.addEventListener(preferenceEvent, listener); return () => { window.removeEventListener('storage', listener); window.removeEventListener(preferenceEvent, listener) } }
function storedSidebar() { return localStorage.getItem('careeros-sidebar') === 'collapsed' }
function storedTheme(): ThemePreference { const value = localStorage.getItem('careeros-theme'); return value === 'light' || value === 'dark' ? value : 'system' }
function keyboardShortcut() { return navigator.platform.toLowerCase().includes('mac') ? '⌘ K' : 'Ctrl K' }
const noSubscription = () => () => {}

export function AppShell({ children, user, skillsAppUrl }: { children: ReactNode; user: CurrentUser; skillsAppUrl: string | null }) {
  const pathname = usePathname()
  const collapsed = useSyncExternalStore(subscribePreferences, storedSidebar, () => false)
  const theme = useSyncExternalStore(subscribePreferences, storedTheme, (): ThemePreference => 'system')
  const [searchOpen, setSearchOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [sidebarOpening, setSidebarOpening] = useState(false)
  const shortcut = useSyncExternalStore(noSubscription, keyboardShortcut, () => 'Ctrl K')

  useEffect(() => {
    const apply = () => { const resolved = resolveTheme(theme); document.documentElement.dataset.theme = resolved; document.documentElement.dataset.themePreference = theme; document.documentElement.style.colorScheme = resolved }
    apply(); if (theme !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)'); media.addEventListener('change', apply); return () => media.removeEventListener('change', apply)
  }, [theme])
  useEffect(() => { const key = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setSearchOpen(true) } }; document.addEventListener('keydown', key); return () => document.removeEventListener('keydown', key) }, [])
  useEffect(() => {
    if (!sidebarOpening) return
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 320
    const timer = window.setTimeout(() => setSidebarOpening(false), duration)
    return () => window.clearTimeout(timer)
  }, [sidebarOpening])
  useEffect(() => {
    if (!profileOpen) return
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setProfileOpen(false) }
    document.addEventListener('keydown', close)
    return () => document.removeEventListener('keydown', close)
  }, [profileOpen])

  const firstName = useMemo(() => user.displayName?.split(' ')[0] ?? user.email?.split('@')[0] ?? 'CareerOS', [user])
  const changeTheme = (next: ThemePreference) => { localStorage.setItem('careeros-theme', next); window.dispatchEvent(new Event(preferenceEvent)) }
  const toggleSidebar = () => { setSidebarOpening(collapsed); localStorage.setItem('careeros-sidebar', collapsed ? 'expanded' : 'collapsed'); window.dispatchEvent(new Event(preferenceEvent)) }

  return <UserContext.Provider value={user}>
    <div className="app-shell" data-collapsed={collapsed ? 'true' : 'false'} data-sidebar-opening={sidebarOpening ? 'true' : 'false'}>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="sidebar-head">
          <div className="sidebar-identity">
            {collapsed || sidebarOpening
              ? <button className="sidebar-identity-open sidebar-control" type="button" onClick={toggleSidebar} disabled={sidebarOpening} aria-controls="sidebar-navigation" aria-expanded={!collapsed} aria-label="Expand sidebar" title="Expand sidebar"><Icon name="panelOpen"/></button>
              : <Link className="sidebar-identity-link" href="/" aria-label="CareerOS home"/>}
            <BrandMark className="sidebar-identity-mark"/>
            <span className="sidebar-identity-wordmark" aria-hidden="true">CareerOS</span>
          </div>
          {!collapsed && <button className="sidebar-toggle sidebar-control" type="button" onClick={toggleSidebar} aria-controls="sidebar-navigation" aria-expanded={true} aria-label="Collapse sidebar" title="Collapse sidebar"><Icon name="panelClose"/></button>}
        </div>
        <nav className="sidebar-nav" id="sidebar-navigation">{navigation.map(item => { const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`)); return <Link className={active ? 'nav-link is-active' : 'nav-link'} aria-current={active ? 'page' : undefined} aria-label={collapsed ? item.label : undefined} href={item.href} key={item.href} title={collapsed ? item.label : undefined}><Icon name={item.icon}/><span>{item.label}</span></Link> })}
          {skillsAppUrl && <a className="nav-link sidebar-external" href={skillsAppUrl} target="_blank" rel="noreferrer" aria-label="SkillForge (opens in a new tab)" title={collapsed ? 'SkillForge' : undefined}><Icon name="graph"/><span>SkillForge</span><span className="sidebar-external-action sidebar-control" aria-hidden="true"><Icon name="external"/></span></a>}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-visual" aria-hidden="true"><span className="sidebar-visual-icon"><Icon name="sparkles" size={22}/></span><p>A better career<br/>is a series of<br/>small steps.</p></div>
        </div>
      </aside>

      <div className="content-shell">
        <header className="topbar"><div className="mobile-brand"><Brand compact href="/"/></div>
          <button className="global-search-trigger" type="button" onClick={() => setSearchOpen(true)} aria-label="Search CareerOS"><Icon name="search"/><span>Search jobs, skills, projects...</span><kbd>{shortcut}</kbd></button>
          <div className="topbar-actions">
            <button className={`profile-button${profileOpen ? ' is-active' : ''}`} type="button" data-profile-trigger onClick={() => setProfileOpen(value => !value)} aria-expanded={profileOpen} aria-haspopup="dialog" aria-label="Open account menu">
              <span className="avatar">{initials(user)}</span>
              <span className="profile-copy"><strong>{user.displayName ?? firstName}</strong><small>{user.email}</small></span>
              <Icon name="chevron" size={16}/>
            </button>
          </div>
        </header>
        <nav className="mobile-nav" aria-label="Primary navigation">{navigation.map(item => <Link className={pathname === item.href ? 'is-active' : ''} href={item.href} key={item.href}><Icon name={item.icon}/><span>{item.label}</span></Link>)}</nav>
        <main id="main-content" className="app-main">{children}</main>
      </div>
    </div>
    <div className="profile-modal-layer modal-backdrop" data-open={profileOpen ? 'true' : 'false'} role="presentation" aria-hidden={!profileOpen} inert={!profileOpen} onMouseDown={event => { if (event.target === event.currentTarget) setProfileOpen(false) }}>
      <section className="profile-modal modal-surface" role="dialog" aria-modal="true" aria-label="Account menu">
        <p className="profile-modal-email">{user.email}</p>
        <div className="profile-modal-theme" role="group" aria-label="Color theme">{([['system','monitor','System'],['light','sun','Light'],['dark','moon','Dark']] as const).map(([value,icon,label]) => <button key={value} type="button" className={theme === value ? 'is-active' : ''} onClick={() => changeTheme(value)} aria-pressed={theme === value}><Icon name={icon} size={17}/><span>{label}</span></button>)}</div>
        <a className="profile-modal-action" href="/auth/account"><Icon name="settings" size={18}/><span>Account settings</span></a>
        <a className="profile-modal-action profile-modal-danger" href="/auth/logout"><Icon name="logout" size={18}/><span>Sign out</span></a>
      </section>
    </div>
    <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)}/>
  </UserContext.Provider>
}
