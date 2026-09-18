'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'

interface CurrentUser {
  id: string
  sub: string
  email: string | null
  displayName: string | null
}

interface JobApplication {
  id: number
  position: string
  company: string
  status: string
}

interface Skill {
  id: string
  name: string
  level: string
}

const card = 'rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-3'
const label = 'text-xs uppercase tracking-wide text-zinc-500'
const button =
  'inline-flex items-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white ' +
  'hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300'
const input =
  'flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900'

export default function Page() {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [skillsAppUrl, setSkillsAppUrl] = useState<string | null>(null)
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [peerSkills, setPeerSkills] = useState<Skill[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [position, setPosition] = useState('')
  const [company, setCompany] = useState('')

  const loadApplications = useCallback(async () => {
    const response = await fetch('/api/job-applications', { credentials: 'include' })
    if (response.ok) {
      setApplications((await response.json()) as JobApplication[])
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/me', { credentials: 'include' })
        if (response.ok) {
          const data = (await response.json()) as {
            user: CurrentUser
            skillsAppUrl: string | null
          }
          setUser(data.user)
          setSkillsAppUrl(data.skillsAppUrl)
          await loadApplications()
        }
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [loadApplications])

  const addApplication = async (event: FormEvent) => {
    event.preventDefault()
    if (busy || position.trim().length === 0 || company.trim().length === 0) return

    setBusy(true)
    setError(null)

    try {
      const response = await fetch('/api/job-applications', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          position: position.trim(),
          company: company.trim(),
          status: 'Saved',
          requirements: [],
        }),
      })

      if (!response.ok) {
        setError(`Could not save the application (${response.status})`)
        return
      }

      setPosition('')
      setCompany('')
      await loadApplications()
    } finally {
      setBusy(false)
    }
  }

  const loadPeerSkills = async () => {
    setError(null)
    const response = await fetch('/api/peer/skills', { credentials: 'include' })
    if (!response.ok) {
      setError(`Request failed with ${response.status}`)
      return
    }
    const data = (await response.json()) as { skills: Skill[] }
    setPeerSkills(data.skills)
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-2xl px-6 py-16">
        <p className="text-sm text-zinc-500">Loading…</p>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 px-6 py-16">
      <header className="space-y-1">
        <span className={label}>Next.js · ASP.NET Core · PostgreSQL</span>
        <h1 className="text-3xl font-semibold tracking-tight">CareerOS</h1>
        <p className="text-zinc-500">Career development and application tracking</p>
      </header>

      {!user ? (
        <section className={card}>
          <p>You are not signed in.</p>
          <a className={button} href="/auth/login">
            Sign in
          </a>
        </section>
      ) : (
        <>
          <section className={card}>
            <p className={label}>Signed in as</p>
            <p className="text-lg font-medium">{user.displayName ?? user.email}</p>

            <p className={label}>Subject ID — issued by the identity provider</p>
            <code className="block break-all text-xs text-zinc-500">{user.sub}</code>

            <p className={label}>User ID — created in our database on first sign-in</p>
            <code className="block break-all text-xs text-zinc-500">{user.id}</code>
          </section>

          <section className={card}>
            <h2 className="text-lg font-medium">Job applications</h2>
            <p className={label}>Stored by the ASP.NET Core API in PostgreSQL</p>

            <form className="flex gap-2" onSubmit={addApplication}>
              <input
                className={input}
                placeholder="Position"
                maxLength={160}
                value={position}
                onChange={(event) => setPosition(event.target.value)}
              />
              <input
                className={input}
                placeholder="Company"
                maxLength={160}
                value={company}
                onChange={(event) => setCompany(event.target.value)}
              />
              <button className={button} type="submit" disabled={busy}>
                Add
              </button>
            </form>

            {error && <p className="text-sm text-red-600">{error}</p>}

            {applications.length === 0 ? (
              <p className="text-sm text-zinc-500">Nothing yet — add your first application.</p>
            ) : (
              <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {applications.map((application) => (
                  <li key={application.id} className="flex justify-between py-2 text-sm">
                    <span>
                      {application.position} ·{' '}
                      <span className="text-zinc-500">{application.company}</span>
                    </span>
                    <span className="text-zinc-500">{application.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={card}>
            <h2 className="text-lg font-medium">Skills from SkillForge</h2>
            <p className={label}>
              Fetched server to server with an audience-scoped access token
            </p>

            <button className={button} onClick={loadPeerSkills} type="button">
              Load my skills
            </button>

            {peerSkills && (
              <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {peerSkills.map((skill) => (
                  <li key={skill.id} className="flex justify-between py-2 text-sm">
                    <span>{skill.name}</span>
                    <span className="text-zinc-500">{skill.level.toLowerCase()}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <a className="text-sm text-zinc-500 underline" href="/auth/logout">
            Sign out
          </a>
        </>
      )}

      {skillsAppUrl && (
        <footer className="pt-4">
          <a className="text-sm underline" href={skillsAppUrl}>
            Open SkillForge →
          </a>
        </footer>
      )}
    </main>
  )
}
