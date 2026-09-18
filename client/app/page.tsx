import Image from 'next/image'
import Link from 'next/link'
import { Brand } from '@/components/brand'
import { Icon } from '@/components/icons'

const features = [
  { icon: 'briefcase' as const, title: 'Track everything', text: 'Keep skills, projects, and applications together.' },
  { icon: 'chart' as const, title: 'Get useful insights', text: 'See progress and understand your job match.' },
  { icon: 'sparkles' as const, title: 'Build real evidence', text: 'Connect projects to the skills they demonstrate.' },
  { icon: 'target' as const, title: 'Plan your growth', text: 'Turn missing skills into focused next steps.' },
]

export default function LandingPage() {
  return (
    <main className="landing-page">
      <header className="landing-nav">
        <Brand />
        <nav aria-label="Landing navigation">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#about">About</a>
        </nav>
        <div className="landing-actions">
          <a className="button button-ghost" href="/auth/login">Sign in</a>
          <a className="button button-primary" href="/auth/login?screen_hint=signup">Get started</a>
        </div>
      </header>

      <section className="landing-hero">
        <div className="hero-copy">
          <span className="hero-pill"><Icon name="sparkles" size={17} />Track · Improve · Get hired</span>
          <h1>Turn your skills and experience into real <span>opportunities.</span></h1>
          <p>Track your skills, showcase your projects, manage job applications, and find your next career step — all in one place.</p>
          <div className="hero-actions">
            <a className="button button-dark" href="/auth/login?screen_hint=signup">Get started for free <Icon name="arrow" /></a>
            <Link className="button button-ghost" href="/dashboard">View dashboard</Link>
          </div>
          <ul className="hero-proof"><li><Icon name="check" />Free to get started</li><li><Icon name="check" />Your data stays yours</li><li><Icon name="check" />Built for focused progress</li></ul>
        </div>

        <div className="hero-visual">
          <Image className="theme-image theme-image-light" src="/images/careeros/mountain-day.png" fill priority sizes="(max-width: 900px) 100vw, 48vw" alt="A clear mountain landscape representing career progress" unoptimized />
          <Image className="theme-image theme-image-dark" src="/images/careeros/mountain-night.png" fill priority sizes="(max-width: 900px) 100vw, 48vw" alt="A mountain landscape under a night sky" unoptimized />
          <div className="hero-preview-card">
            <span className="soft-icon"><Icon name="chart" /></span>
            <div><strong>Your career, clearly organized.</strong><small>Skills · Projects · Applications</small></div>
          </div>
        </div>
      </section>

      <section className="feature-strip" id="features">
        {features.map((feature) => <article key={feature.title}><span className="soft-icon"><Icon name={feature.icon} /></span><div><h2>{feature.title}</h2><p>{feature.text}</p></div></article>)}
      </section>

      <section className="landing-story" id="how-it-works">
        <div className="story-visual">
          <Image className="theme-image theme-image-light" src="/images/careeros/journey-day.png" fill sizes="(max-width: 800px) 100vw, 48vw" alt="An illustrated path leading toward a mountain summit" unoptimized />
          <Image className="theme-image theme-image-dark" src="/images/careeros/journey-night.png" fill sizes="(max-width: 800px) 100vw, 48vw" alt="A glowing path leading toward a summit at night" unoptimized />
        </div>
        <div className="story-copy" id="about">
          <p className="eyebrow">ONE WORKSPACE, A CLEARER PATH</p>
          <h2>Career progress becomes easier when the evidence is connected.</h2>
          <p>CareerOS gives every skill context, every project a purpose, and every application a clear place in your journey.</p>
          <ol><li><span>01</span>Build a practical skill profile</li><li><span>02</span>Connect skills to real projects</li><li><span>03</span>Track roles and close the gaps</li></ol>
          <a className="button button-primary" href="/auth/login?screen_hint=signup">Start building <Icon name="arrow" /></a>
        </div>
      </section>

      <footer className="landing-footer"><Brand compact /><p>Build your tomorrow with deliberate steps.</p><span>© {new Date().getFullYear()} CareerOS</span></footer>
    </main>
  )
}
