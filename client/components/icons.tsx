import type { ReactNode } from 'react'

export type IconName =
  | 'arrow'
  | 'bell'
  | 'briefcase'
  | 'chart'
  | 'check'
  | 'chevron'
  | 'folder'
  | 'graph'
  | 'grid'
  | 'logout'
  | 'moon'
  | 'plus'
  | 'search'
  | 'sparkles'
  | 'sun'
  | 'target'
  | 'user'

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 1.8,
  }

  const paths: Record<IconName, ReactNode> = {
    arrow: <path {...common} d="M5 12h14m-6-6 6 6-6 6" />,
    bell: <><path {...common} d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path {...common} d="M10 22h4" /></>,
    briefcase: <><rect {...common} x="3" y="7" width="18" height="13" rx="2" /><path {...common} d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m-13 5h18" /></>,
    chart: <><path {...common} d="M4 19V5m0 14h16" /><path {...common} d="m7 15 4-4 3 2 5-6" /></>,
    check: <path {...common} d="m5 12 4 4L19 6" />,
    chevron: <path {...common} d="m8 10 4 4 4-4" />,
    folder: <path {...common} d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />,
    graph: <><circle {...common} cx="5" cy="12" r="2" /><circle {...common} cx="19" cy="6" r="2" /><circle {...common} cx="19" cy="18" r="2" /><path {...common} d="m7 11 10-4m-10 6 10 4" /></>,
    grid: <><rect {...common} x="3" y="3" width="7" height="7" rx="1" /><rect {...common} x="14" y="3" width="7" height="7" rx="1" /><rect {...common} x="3" y="14" width="7" height="7" rx="1" /><rect {...common} x="14" y="14" width="7" height="7" rx="1" /></>,
    logout: <><path {...common} d="M10 17l5-5-5-5m5 5H3" /><path {...common} d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" /></>,
    moon: <path {...common} d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />,
    plus: <path {...common} d="M12 5v14M5 12h14" />,
    search: <><circle {...common} cx="11" cy="11" r="6" /><path {...common} d="m16 16 4 4" /></>,
    sparkles: <><path {...common} d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z" /><path {...common} d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z" /></>,
    sun: <><circle {...common} cx="12" cy="12" r="4" /><path {...common} d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
    target: <><circle {...common} cx="12" cy="12" r="8" /><circle {...common} cx="12" cy="12" r="3" /><path {...common} d="M12 2v2m0 16v2M2 12h2m16 0h2" /></>,
    user: <><circle {...common} cx="12" cy="8" r="4" /><path {...common} d="M4 21a8 8 0 0 1 16 0" /></>,
  }

  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24">{paths[name]}</svg>
}
