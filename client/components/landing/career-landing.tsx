"use client";

import { useEffect, useRef, useState } from "react";
import styles from "@/app/landing.module.css";
import { BrandMark } from "@/components/brand";
import { Icon } from "@/components/icons";
import { OraviaParticleField } from "@/components/landing/oravia-particle-field";
import { headerScrollThreshold } from "@/lib/ui-chrome";

const signup = "/auth/login?screen_hint=signup&returnTo=/dashboard";

const careerStages = [
  { eyebrow: "01 PROFILE", title: "Start with your skills", copy: "Bring your strengths and experience into one clear profile.", left: "PROFILE SNAPSHOT", right: "Skills · Experience · Interests", sample: "Your career, in context" },
  { eyebrow: "02 EVIDENCE", title: "Connect the work", copy: "Link projects to the skills you used and show where your experience comes from.", left: "PROJECT", right: "Portfolio website", sample: "3 connected skills" },
  { eyebrow: "03 STRENGTHS", title: "See what you bring", copy: "Understand your current strengths and how they relate across your profile.", left: "CONNECTED SKILLS", right: "React · TypeScript", sample: "Across 4 experiences" },
  { eyebrow: "04 DIRECTION", title: "Explore role fit", copy: "Compare your profile with a role and spot areas to build next.", left: "ROLE COMPARISON", right: "Product designer", sample: "Skills match · Growth areas" },
  { eyebrow: "05 OPPORTUNITY", title: "Keep applications moving", copy: "Track opportunities and next steps alongside your career profile.", left: "APPLICATION", right: "Product designer", sample: "Interview · Next step saved" },
  { eyebrow: "06 MOMENTUM", title: "Build on what you learn", copy: "Use each project and opportunity to make your profile more useful over time.", left: "NEXT STEP", right: "Strengthen your portfolio", sample: "Your direction, always evolving" },
];
const lifecycleThresholds = [0.1, 0.25, 0.4, 0.55, 0.7, 0.85];
const profileSteps = [
  ["Skills identified", "Build a clear picture of your skills and experience."],
  ["Projects connected", "Link real work to the strengths behind it."],
  ["Strengths understood", "See how skills relate across your profile."],
  ["Roles compared", "Check your experience against role requirements."],
  ["Next steps chosen", "Focus on the skills that can move you forward."],
  ["Progress captured", "Keep applications and new experience in view."],
];
const productStories = [
  { title: "See the strengths behind your experience.", copy: "CareerOS brings skills and project work together so your profile reflects what you have actually done.", area: "SKILLS PROFILE", state: "Skills and experience connected", detail: "A clearer picture of your strengths" },
  { title: "Give every project useful context.", copy: "Connect each project to the skills you used and keep that evidence close to the roles you explore.", area: "PROJECT EVIDENCE", state: "Projects linked to skills", detail: "Work that supports your profile" },
  { title: "Keep your next move in view.", copy: "Compare roles and track applications from the same workspace as your skills and experience.", area: "CAREER DIRECTION", state: "Roles and applications together", detail: "A practical next step, when ready" },
];

function Arrow() {
  return <Icon name="arrow" size={16}/>;
}

function ThemeIcon({ theme }: { theme: "light" | "dark" | null }) {
  return <Icon name={theme === "dark" ? "moon" : "sun"} size={19}/>;
}

function Logo() {
  return <span className={styles.logo}><BrandMark className={styles.logoMark}/><span className={styles.logoText}>CareerOS</span></span>;
}

function CareerGraph() {
  return <div className={styles.graphCard} data-scroll-reveal>
    <div className={styles.graphHeader}><span className={styles.graphDot}/><span>YOUR CAREER, CONNECTED</span><span className={styles.graphLive}>LIVE VIEW <i/></span></div>
    <div className={styles.graphVisual}>
      <svg viewBox="0 0 400 300" role="img" aria-label="Career graph connecting you through skills, interests, projects, and growth to your next role">
        <path className={styles.graphLines} d="M50,150 C100,150 100,80 150,80"/>
        <path className={styles.graphLines} d="M50,150 C100,150 100,220 150,220"/>
        <path className={styles.graphLines} d="M150,80 C200,80 200,120 250,120"/>
        <path className={styles.graphLines} d="M150,220 C200,220 200,180 250,180"/>
        <path className={styles.graphLines} d="M250,120 L320,150"/>
        <path className={styles.graphLines} d="M250,180 L320,150"/>
        <path className={styles.graphSignal} d="M50,150 C100,150 100,80 150,80 C200,80 200,120 250,120 L320,150"/>
        <circle className={styles.nodeContext} cx="50" cy="150" r="6"/>
        <text className={styles.graphCaption} x="40" y="150" textAnchor="end" dominantBaseline="middle">YOU</text>
        <rect className={styles.nodeAssumptions} x="150" y="70" width="80" height="20" rx="4"/>
        <text className={styles.graphNodeLabel} x="190" y="83" textAnchor="middle">Skills</text>
        <rect className={styles.graphNodeSoft} x="150" y="210" width="80" height="20" rx="4"/>
        <text className={styles.graphNodeLabel} x="190" y="223" textAnchor="middle">Interests</text>
        <rect className={styles.nodeEvidence} x="250" y="110" width="60" height="20" rx="4"/>
        <text className={styles.graphNodeLabel} x="280" y="123" textAnchor="middle">Projects</text>
        <rect className={styles.graphNodeSoft} x="250" y="170" width="60" height="20" rx="4"/>
        <text className={styles.graphNodeLabel} x="280" y="183" textAnchor="middle">Growth</text>
        <circle className={styles.nodeOutcome} cx="320" cy="150" r="12"/>
        <path className={styles.outcomeCheck} d="M316 150l3 3 5-5"/>
        <text className={styles.graphCaption} x="340" y="150" textAnchor="start" dominantBaseline="middle">NEXT ROLE</text>
      </svg>
      <span className={styles.graphBadge}>Experience, with evidence <Arrow/></span>
    </div>
    <div className={styles.graphFooter}><span>SKILLS / PROJECTS / POSSIBILITY</span><span>Illustrative profile</span></div>
  </div>;
}

function ProductCard({ label, title, copy, href, action, index }: {
  label: string; title: string; copy: string; href: string; action: string; index: string;
}) {
  return <article className={`${styles.productCard} ${styles.productCardEvidence}`} data-scroll-reveal>
    <div className={styles.productCardTop}><span>{label}</span><span>{index}</span></div>
    <div className={styles.productCardBody}><h3>{title}</h3><p>{copy}</p></div>
    <div className={styles.projectEvidence} aria-hidden="true"><span className={`${styles.evidenceBackLayer} ${styles.evidenceBackLayerFirst}`}/><span className={`${styles.evidenceBackLayer} ${styles.evidenceBackLayerSecond}`}/><div className={styles.evidenceStack}><i/><i/><span><b>PORTFOLIO PROJECT</b><small>Skills connected</small></span></div></div>
    <a href={href} className={styles.cardLink}>{action}<Arrow/></a>
  </article>;
}

export function CareerLanding({ authenticated, fontClassName }: { authenticated: boolean; fontClassName: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [activeProfileStep, setActiveProfileStep] = useState(0);
  const [activeStory, setActiveStory] = useState(0);
  const [activeWorkspace, setActiveWorkspace] = useState(1);
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const mainAction = authenticated ? "/dashboard" : signup;

  useEffect(() => {
    const root = pageRef.current;
    if (!root) return;
    const headerFrame = requestAnimationFrame(() => {
      setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
    });
    const reveals = [...root.querySelectorAll<HTMLElement>("[data-scroll-reveal]")];
    const lifecycle = root.querySelector<HTMLElement>("[data-career-lifecycle]");
    const lifecycleHeader = root.querySelector<HTMLElement>("[data-lifecycle-header]");
    const lifecycleLine = root.querySelector<HTMLElement>("[data-lifecycle-line]");
    const definition = root.querySelector<HTMLElement>('[aria-labelledby="definition-title"]');
    const particleField = root.querySelector<HTMLElement>("[data-particle-field]");
    const definitionObserver = definition && particleField ? new IntersectionObserver(([entry]) => {
      particleField.dataset.hiddenForDefinition = entry.isIntersecting ? "true" : "false";
    }, { threshold: 0 }) : null;
    if (definition && definitionObserver) definitionObserver.observe(definition);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const update = () => {
      frame = 0;
      const height = window.innerHeight;
      setScrolled(previous => previous === (window.scrollY > headerScrollThreshold) ? previous : window.scrollY > headerScrollThreshold);
      reveals.forEach(element => {
        const rect = element.getBoundingClientRect();
        const entering = Math.max(0, Math.min(1, (height * 0.96 - rect.top) / (height * 0.22)));
        const leaving = Math.max(0, Math.min(1, (rect.bottom - height * 0.08) / (height * 0.2)));
        element.style.setProperty("--reveal-opacity", reduced.matches ? "1" : Math.min(entering, leaving).toFixed(3));
        element.style.setProperty("--reveal-shift", reduced.matches ? "0px" : `${((1 - entering) * 18 - (1 - leaving) * 12).toFixed(1)}px`);
      });
      if (lifecycle) {
        const bounds = lifecycle.getBoundingClientRect();
        const travel = Math.max(1, bounds.height - height);
        const progress = Math.max(0, Math.min(1, -bounds.top / travel));
        if (lifecycleHeader) lifecycleHeader.style.opacity = reduced.matches ? "1" : progress > 0.02 ? "1" : "0";
        if (lifecycleLine) lifecycleLine.style.height = `${progress * 92}%`;
        const next = lifecycleThresholds.reduce((current, threshold, index) => progress >= threshold ? index : current, 0);
        setActive(previous => previous === next ? previous : next);
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    reduced.addEventListener("change", schedule);
    return () => {
      cancelAnimationFrame(headerFrame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      reduced.removeEventListener("change", schedule);
      definitionObserver?.disconnect();
      particleField?.removeAttribute("data-hidden-for-definition");
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const grid = pageRef.current?.querySelector<HTMLElement>("[data-profile-steps]");
    if (!grid) return;
    const steps = [...grid.querySelectorAll<HTMLElement>("[data-profile-step]")];
    const line = grid.querySelector<HTMLElement>("[data-profile-line]");
    const update = (index: number) => {
      setActiveProfileStep(index);
      if (line) line.style.width = `${index / (steps.length - 1) * 100}%`;
    };
    let timer = 0;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || timer) return;
      let current = 0;
      update(0);
      timer = window.setInterval(() => {
        current += 1;
        update(current);
        if (current >= steps.length - 1) window.clearInterval(timer);
      }, 900);
      observer.disconnect();
    }, { threshold: 0.5 });
    observer.observe(grid);
    return () => { observer.disconnect(); if (timer) window.clearInterval(timer); };
  }, []);

  function toggleTheme() {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    document.documentElement.dataset.themePreference = next;
    document.documentElement.style.colorScheme = next;
    localStorage.setItem("careeros-theme", next);
    setTheme(next);
  }

  const nav = <><a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a><a href="#features" onClick={() => setMenuOpen(false)}>Features</a><a href="#workspace" onClick={() => setMenuOpen(false)}>Workspace</a></>;

  return <div ref={pageRef} className={`${styles.page} ${fontClassName}`}>
    <div className={styles.technicalGrid} aria-hidden="true"/>
    <OraviaParticleField/>
    <a className={styles.skip} href="#main-content">Skip to content</a>
    <header className={`${styles.header} ${scrolled ? styles.headerScrolled : ""}`}>
      <div className={`${styles.headerInner} career-header-surface`} data-scrolled={scrolled ? "true" : "false"}>
        <a href="#top" aria-label="CareerOS home"><Logo/></a>
        <nav className={styles.desktopNav} aria-label="Main navigation">{nav}</nav>
        <div className={styles.headerActions}>
          <button type="button" className={styles.themeButton} onClick={toggleTheme} aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"} title={theme === "dark" ? "Light theme" : "Dark theme"}><span className={styles.shimmerLayer} aria-hidden="true"/><ThemeIcon theme={theme}/></button>
          {!authenticated && <a className={styles.signIn} href="/auth/login?returnTo=/dashboard">Sign in</a>}
          <a className={styles.headerCta} href={mainAction} aria-label={authenticated ? "Open dashboard" : "Get started with CareerOS"}><span className={styles.shimmerLayer}/><span className={styles.buttonContent}>{authenticated ? "Dashboard" : "Get started"}<Arrow/></span></a>
          <button type="button" className={styles.menuButton} aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} aria-controls="landing-menu" onClick={() => setMenuOpen(!menuOpen)}><span/><span/><i className={styles.shimmerLayer}/></button>
        </div>
      </div>
      {menuOpen && <nav className={styles.mobileNav} id="landing-menu" aria-label="Mobile navigation">{nav}{!authenticated && <a href="/auth/login?returnTo=/dashboard">Sign in</a>}</nav>}
    </header>

    <main id="main-content">
      <section className={styles.hero} id="top" aria-labelledby="hero-title">
        <div className={styles.heroInner}>
          <div className={styles.heroCopy} data-scroll-reveal>
            <div className={styles.status}><i/>A clearer career workspace</div>
            <h1 id="hero-title">Make your move<br/><span>make sense.</span></h1>
            <p>Connect your skills, projects and job search in one place. See what you bring, where you fit and what to work on next.</p>
            <div className={styles.heroActions}>
              <a className={styles.primaryButton} href={mainAction}><span className={styles.shimmerLayer}/><span className={styles.buttonContent}>{authenticated ? "Open your workspace" : "Build your career profile"}<Arrow/></span></a>
              <a className={styles.secondaryButton} href="#how-it-works"><span className={styles.shimmerLayer}/><span className={styles.buttonContent}>See how it works</span></a>
            </div>
            <div className={styles.heroNote}><span className={styles.noteLine}/><span>Skills / Evidence / Direction</span></div>
          </div>
          <CareerGraph/>
        </div>
        <a className={styles.scrollCue} href="#how-it-works"><span>Scroll to explore</span><i/></a>
      </section>

      <section className={styles.productStrip} aria-label="CareerOS workspace areas">
        <div className={styles.productStripInner}><span className={styles.stripLabel}>ONE CONNECTED WORKSPACE</span><span>Skills</span><i/><span>Projects</span><i/><span>Applications</span><i/><span>Role fit</span></div>
      </section>

      <section className={styles.journey} id="how-it-works" aria-labelledby="journey-title" data-career-lifecycle>
        <div className={styles.journeySticky}>
          <div className={styles.journeyPattern} aria-hidden="true"/>
          <div className={styles.journeyContent}>
            <div className={styles.journeyIntro} data-lifecycle-header>
              <h2 id="journey-title">A clearer career path</h2>
              <p>From what you know to what comes next.</p>
            </div>
            <div className={styles.lifecycleList}>
              <span className={styles.lifecycleTrack}/>
              <span className={styles.lifecycleProgress} data-lifecycle-line/>
              {careerStages.map((stage, index) => <div key={stage.eyebrow} className={`${styles.lifecycleStep} ${index < active ? styles.lifecycleComplete : ""} ${index === active ? styles.lifecycleActive : ""}`}>
                <div className={`${styles.lifecycleSide} ${index % 2 === 0 ? styles.lifecycleDetail : styles.lifecycleSample}`}>
                  {index % 2 === 0 ? <><span className={styles.lifecycleEyebrow}>{stage.eyebrow}</span><h3>{stage.title}</h3><p>{stage.copy}</p></> : <div className={styles.lifecycleMiniCard}><span>{stage.left}</span><strong>{stage.right}</strong><small>{stage.sample}</small></div>}
                </div>
                <span className={styles.lifecycleNode}><i/></span>
                <div className={`${styles.lifecycleSide} ${index % 2 === 0 ? styles.lifecycleSample : styles.lifecycleDetail}`}>
                  {index % 2 === 0 ? <div className={styles.lifecycleMiniCard}><span>{stage.left}</span><strong>{stage.right}</strong><small>{stage.sample}</small></div> : <><span className={styles.lifecycleEyebrow}>{stage.eyebrow}</span><h3>{stage.title}</h3><p>{stage.copy}</p></>}
                </div>
              </div>)}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.features} id="features" aria-labelledby="features-title">
        <div className={styles.sectionHeading} data-scroll-reveal><div><span className={styles.sectionLabel}>One place for the whole picture</span><h2 id="features-title">Career clarity.<br/><span>Built from your work.</span></h2><p>Connect your skills and experience to practical next steps.</p></div><a className={styles.featureExplore} href="#workspace">Explore the workspace<Arrow/></a></div>
        <div className={styles.featureGrid}>
          <article className={`${styles.productCard} ${styles.productCardLineage}`} data-scroll-reveal>
            <div className={styles.productCardTop}><span>01 / SKILLS & EXPERIENCE</span><span>CONNECTED PROFILE</span></div>
            <div className={styles.featureCardCopy}><h3>Make your experience visible.</h3><p>Follow the connection between your skills, projects and the roles you want to explore.</p></div>
            <div className={styles.lineageGraphic} aria-label="Skills connect to projects, role fit and your next step">
              <svg viewBox="0 0 600 100" role="img" aria-hidden="true"><defs><marker id="career-arrow" markerWidth="5" markerHeight="5" refX="3" refY="2.5" orient="auto"><path d="M0 0 5 2.5 0 5" fill="var(--ink)"/></marker></defs><path className={styles.lineageBase} d="M20 50 C100 50 120 20 200 20 C280 20 300 80 380 80 C460 80 480 50 560 50"/><path className={styles.lineageSignal} d="M20 50 C100 50 120 20 200 20 C280 20 300 80 380 80 C460 80 480 50 560 50" markerEnd="url(#career-arrow)"/><circle cx="20" cy="50" r="4"/><circle cx="200" cy="20" r="4"/><circle cx="380" cy="80" r="4"/><circle cx="560" cy="50" r="4"/><text x="20" y="74">SKILLS</text><text x="200" y="43">PROJECTS</text><text x="380" y="70">ROLE FIT</text><text x="560" y="74">NEXT STEP</text></svg>
            </div>
          </article>
          <ProductCard label="02 / PROJECT EVIDENCE" index="BUILT FROM YOUR WORK" title="Make your experience tangible." copy="Connect projects with the skills you used, so your work can speak for itself." href={authenticated?"/projects":signup} action="Explore projects"/>
          <article className={`${styles.productCard} ${styles.productCardFull}`} data-scroll-reveal>
            <div><div className={styles.productCardTop}><span>03 / PROFILE SYNTHESIS</span><span>SKILLS · PROJECTS · OPPORTUNITIES</span></div><div className={styles.featureCardCopy}><h3>Turn the whole picture into a next step.</h3><p>Keep the parts of your career together, then choose a practical place to focus.</p><a className={styles.cardLink} href={authenticated?"/dashboard":signup}>Explore your workspace<Arrow/></a></div></div>
            <div className={styles.synthesisVisual} aria-label="Skills, projects and opportunities combine into a clear next step"><div className={styles.synthesisInputs}><span>Skills profile</span><span>Projects</span><span>Applications</span></div><div className={styles.synthesisProcessor}><i/><Icon name="refresh" size={20}/></div><div className={styles.synthesisOutput}><span>CAREEROS PROFILE</span><b>Your next step</b><i/><i/><i/></div></div>
          </article>
        </div>
      </section>

      <section className={styles.profileGraph} aria-labelledby="profile-graph-title">
        <div className={styles.profileGraphInner}>
          <div className={styles.profileGraphHeading} data-scroll-reveal><div><h2 id="profile-graph-title">From experience to a clearer next move</h2><p>See how each part of your career profile builds on the last.</p></div></div>
          <div className={styles.defTimeline} data-profile-steps role="list">
            <span className={styles.defTrack}/><span className={styles.defProgress} data-profile-line style={{width:`${activeProfileStep/(profileSteps.length-1)*100}%`}}/>
            {profileSteps.map(([title, copy], index) => <div key={title} role="listitem" data-profile-step onMouseEnter={() => setActiveProfileStep(index)} className={`${styles.defStep} ${activeProfileStep === index ? styles.defActive : styles.defInactive}`}>
              <div className={styles.defNumberRow}><span className={styles.defNumber}>0{index+1}</span><i/></div>
              <div className={styles.defStepContent}><h3>{title}</h3><p>{copy}</p></div>
            </div>)}
          </div>
        </div>
      </section>

      <section className={styles.definition} aria-labelledby="definition-title">
        <div className={styles.definitionInner}>
          <div className={styles.definitionHeading}><span className={`${styles.sectionLabel} ${styles.definitionLabel}`}><span className={styles.definitionLabelIcon}><Icon name="grid" size={15}/></span>A connected career workspace</span><h2 id="definition-title">A clearer picture<br/><em>of what comes next.</em></h2><p>Keep skills, projects and opportunities together. Build your profile from real experience and use it to decide where to focus next.</p><a className={styles.lightButton} href={mainAction}><span className={styles.shimmerLayer}/><span className={styles.buttonContent}>{authenticated?"Go to your workspace":"Start building your profile"}<Arrow/></span></a></div>
          <div className={styles.storyPanel}>
            <div className={styles.storySlides} aria-live="polite" aria-atomic="true">
              <div className={styles.storyArea}>{productStories[activeStory].area}<span><i/>CAREEROS</span></div>
              <h3 key={activeStory}>{productStories[activeStory].title}</h3>
              <p>{productStories[activeStory].copy}</p>
              <div className={styles.storyAuthor}><span className={styles.storyAvatar}><BrandMark/></span><span><b>CareerOS workspace</b><small>{productStories[activeStory].detail}</small></span></div>
              <div className={styles.storyControls}><button type="button" aria-label="Previous CareerOS feature" onClick={()=>setActiveStory((activeStory + productStories.length - 1) % productStories.length)}><span className={styles.shimmerLayer}/><Arrow/></button><button type="button" aria-label="Next CareerOS feature" onClick={()=>setActiveStory((activeStory + 1) % productStories.length)}><span className={styles.shimmerLayer}/><Arrow/></button><span>{String(activeStory + 1).padStart(2,"0")} / 03</span></div>
            </div>
            <div className={styles.storyStats}>
              <div><strong>Profile</strong><span>Skills and experience in one view</span></div>
              <div><strong>Evidence</strong><span>{productStories[activeStory].state}</span></div>
              <div><strong>Direction</strong><span>{productStories[(activeStory + 1) % productStories.length].area.toLowerCase()}</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.workspace} id="workspace" aria-labelledby="workspace-title">
        <div className={styles.workspaceHeader} data-scroll-reveal><div><span className={styles.sectionLabel}>Start where you are</span><h2 id="workspace-title">Your next step,<br/><span>all in one place.</span></h2></div><p>Choose a place to begin. Your profile, projects and opportunities stay connected as you move forward.</p></div>
        <div className={styles.workspaceCards}>
          {[
            { tag:"01 / YOUR FOUNDATION", title:"Skills profile", copy:"Map your strengths and see how they connect.", action:"Build your profile", href:authenticated?"/skills":signup },
            { tag:"02 / YOUR EVIDENCE", title:"Projects", copy:"Show the work behind your experience and connect it to your skills.", action:"Explore your work", href:authenticated?"/projects":signup },
            { tag:"03 / WHAT COMES NEXT", title:"Applications", copy:"Keep opportunities, role research and next steps moving.", action:"Track opportunities", href:authenticated?"/applications":signup },
            ].map((choice,index)=><article className={`${styles.workspaceCard} ${activeWorkspace===index?styles.workspaceCardSelected:styles.workspaceCardDim}`} key={choice.tag} data-scroll-reveal>
            <button type="button" className={styles.workspaceSelect} aria-pressed={activeWorkspace===index} onClick={()=>setActiveWorkspace(index)}><span>{choice.tag}</span><div><h3>{choice.title}</h3><p>{choice.copy}</p></div><i className={styles.shimmerLayer} aria-hidden="true"/></button>
            <a className={styles.workspaceAction} href={choice.href}><span className={styles.shimmerLayer}/><span className={styles.buttonContent}>{choice.action}<Arrow/></span></a>
          </article>)}
        </div>
        <div className={styles.finalCta} data-scroll-reveal><a className={styles.primaryButton} href={mainAction}><span className={styles.shimmerLayer}/><span className={styles.buttonContent}>{authenticated?"Open CareerOS":"Get started"}<Arrow/></span></a><span>Your next step starts with what you already know.</span></div>
      </section>
    </main>

    <footer className={styles.footer}><div className={styles.footerMain}><a href="#top" aria-label="CareerOS home"><Logo/></a><p>A clearer view of your career.</p><nav aria-label="Footer navigation"><a href="#how-it-works">How it works</a><a href="#features">Features</a><a href="#workspace">Workspace</a></nav><a href="#top" className={styles.backTop}>Back to top ↑</a></div><div className={styles.footerBottom}><span>© {new Date().getFullYear()} CareerOS</span><span>Skills. Evidence. Direction.</span></div></footer>
  </div>;
}
