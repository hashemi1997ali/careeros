import type { Metadata, Viewport } from 'next'
import './globals.css'
import './talent-graph.css'
import './motion.css'
import { manrope } from '@/lib/brand-font'
import { themeBootScript } from '@/lib/theme'

export const metadata: Metadata = {
  title: { default: 'CareerOS | Career workspace', template: '%s | CareerOS' },
  description: 'Track your skills, projects and job applications, connect evidence, and find the gaps that matter.',
  icons: {
    icon: [{ url: '/images/careeros/brand-mark.png', type: 'image/png' }],
    shortcut: [{ url: '/images/careeros/brand-mark.png', type: 'image/png' }],
    apple: [{ url: '/images/careeros/brand-mark.png', type: 'image/png' }],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`h-full antialiased ${manrope.variable}`}>
      <head><script dangerouslySetInnerHTML={{ __html: themeBootScript }} /></head>
      <body className="min-h-full">{children}</body>
    </html>
  )
}
