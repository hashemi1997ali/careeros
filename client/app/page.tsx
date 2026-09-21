import Image from 'next/image'
import Link from 'next/link'
import { auth0 } from '@/lib/auth0'
import { Brand } from '@/components/brand'
import { Icon, type IconName } from '@/components/icons'

export const dynamic = 'force-dynamic'

const features: Array<{ icon: IconName; title: string; text: string }> = [
  { icon: 'briefcase', title: 'Track everything', text: 'Keep skills, projects, and applications together.' },
  { icon: 'chart', title: 'Understand your fit', text: 'Compare requirements with the skills you have.' },
  { icon: 'sparkles', title: 'Build real evidence', text: 'Connect projects to the skills they demonstrate.' },
  { icon: 'target', title: 'Close the gaps', text: 'Turn missing skills into focused next steps.' },
]

export default async function LandingPage() {
  const session = await auth0.getSession()
  const authenticated = Boolean(session)
  const login = '/auth/login?returnTo=/dashboard'
  const signup = '/auth/login?screen_hint=signup&returnTo=/dashboard'

  return (
    <main className="landing-page">
      <header className="public-header"><div className="public-header-shell">
        <Brand />
        <nav aria-label="Landing navigation"><a href="#features">Features</a><a href="#how-it-works">How it works</a><a href="#about">About</a></nav>
        <div className="landing-actions">
          {authenticated ? <><Link className="button button-ghost" href="/dashboard"><Icon name="grid" size={17}/> Dashboard</Link><a className="button button-primary" href="/auth/logout">Sign out</a></> : <><a className="button button-ghost" href={login}>Sign in</a><a className="button button-primary" href={signup}>Get started</a></>}
        </div>
      </div></header>

      <section className="landing-hero">
        <div className="hero-copy">
          <span className="hero-pill"><Icon name="sparkles" size={17}/>Track · Improve · Get hired</span>
          <h1>Turn your skills and experience into real <span>opportunities.</span></h1>
          <p>Track your skills, showcase projects, manage job applications and understand what to improve next — all in one focused workspace.</p>
          <div className="hero-actions">
            <Link className="button button-dark" href={authenticated ? '/dashboard' : signup}>{authenticated ? 'Open your dashboard' : 'Get started for free'}<Icon name="arrow"/></Link>
            <a className="button button-ghost" href="#how-it-works">See how it works</a>
          </div>
          <ul className="hero-proof"><li><Icon name="check"/>Free to get started</li><li><Icon name="check"/>Evidence stays connected</li><li><Icon name="check"/>Built around real job requirements</li></ul>
        </div>
        <div className="hero-visual">
          <Image className="theme-image theme-image-light" src="/images/careeros/mountain-day.png" fill priority sizes="(max-width: 900px) 100vw, 48vw" alt="Mountain landscape" unoptimized />
          <Image className="theme-image theme-image-dark" src="/images/careeros/mountain-night.png" fill priority sizes="(max-width: 900px) 100vw, 48vw" alt="Mountain landscape at night" unoptimized />
          <div className="hero-preview-card"><span className="soft-icon"><Icon name="graph"/></span><div><strong>Your career, clearly connected.</strong><small>Skills · Projects · Applications · Gaps</small></div></div>
        </div>
      </section>

      <section className="feature-strip" id="features">
        {features.map((feature) => <article key={feature.title}><span className="soft-icon"><Icon name={feature.icon}/></span><div><h2>{feature.title}</h2><p>{feature.text}</p></div></article>)}
      </section>

      <section className="landing-story" id="how-it-works">
        <div className="story-visual">
          <Image className="theme-image theme-image-light" src="/images/careeros/journey-day.png" fill sizes="(max-width:800px) 100vw,48vw" alt="Career journey illustration" unoptimized/>
          <Image className="theme-image theme-image-dark" src="/images/careeros/journey-night.png" fill sizes="(max-width:800px) 100vw,48vw" alt="Career journey illustration at night" unoptimized/>
        </div>
        <div className="story-copy" id="about"><p className="eyebrow">ONE WORKSPACE, A CLEARER PATH</p><h2>Career progress becomes useful when the evidence is connected.</h2><p>CareerOS gives every skill context, every project a purpose and every application a clear place in your journey.</p><ol><li><span>01</span>Build a practical skill profile</li><li><span>02</span>Connect skills to projects you actually built</li><li><span>03</span>Compare your evidence with real roles</li></ol><Link className="button button-primary" href={authenticated ? '/dashboard' : signup}>{authenticated ? 'Continue building' : 'Start building'}<Icon name="arrow"/></Link></div>
      </section>

      <footer className="landing-footer"><Brand compact/><p>Build your tomorrow with deliberate steps.</p><span>© {new Date().getFullYear()} CareerOS</span></footer>
    </main>
  )
}
