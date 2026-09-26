import type { Metadata } from 'next'
import './globals.css'
import './talent-graph.css'

export const metadata: Metadata = {
  title: { default: 'CareerOS | Career workspace', template: '%s | CareerOS' },
  description: 'Track your skills, projects and job applications, connect evidence, and find the gaps that matter.',
  icons: {
    icon: '/images/careeros/brand-mark.png',
    shortcut: '/images/careeros/brand-mark.png',
    apple: '/images/careeros/brand-mark.png',
  },
}

const themeScript = `
(() => {
  try {
    const saved = localStorage.getItem('careeros-theme');
    const preference = saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system';
    const resolved = preference === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : preference;
    document.documentElement.dataset.theme = resolved;
    document.documentElement.dataset.themePreference = preference;
    document.documentElement.style.colorScheme = resolved;
  } catch {}
})();`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body className="min-h-full">{children}</body>
    </html>
  )
}
