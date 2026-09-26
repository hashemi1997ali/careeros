import type { ReactNode } from 'react'

export type IconName =
  | 'arrow' | 'briefcase' | 'chart' | 'check' | 'chevron' | 'edit' | 'external'
  | 'folder' | 'graph' | 'grid' | 'logout' | 'monitor' | 'moon' | 'panelClose'
  | 'panelOpen' | 'plus' | 'search' | 'sparkles' | 'sun' | 'target' | 'trash' | 'eye'
  | 'settings' | 'share' | 'skillforge' | 'user' | 'x' | 'brain'

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const c = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, strokeWidth: 1.8 }
  const paths: Record<IconName, ReactNode> = {
    arrow: <path {...c} d="M5 12h14m-6-6 6 6-6 6" />,
    brain: <><path {...c} d="M9.5 4.5A3.5 3.5 0 0 0 6 8v.3A3 3 0 0 0 4 11a3 3 0 0 0 2 2.8V15a3 3 0 0 0 3 3h1V6.5a2 2 0 0 0-.5-2Z" /><path {...c} d="M14.5 4.5A3.5 3.5 0 0 1 18 8v.3a3 3 0 0 1 2 2.7 3 3 0 0 1-2 2.8V15a3 3 0 0 1-3 3h-1V6.5a2 2 0 0 1 .5-2Z" /><path {...c} d="M10 9H8m8 0h-2m-4 4H8m8 0h-2M12 6v12" /></>,
    briefcase: <><rect {...c} x="3" y="7" width="18" height="13" rx="2" /><path {...c} d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m-13 5h18" /></>,
    chart: <><path {...c} d="M4 19V5m0 14h16" /><path {...c} d="m7 15 4-4 3 2 5-6" /></>,
    check: <path {...c} d="m5 12 4 4L19 6" />,
    chevron: <path {...c} d="m8 10 4 4 4-4" />,
    edit: <><path {...c} d="M12 20h9" /><path {...c} d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
    external: <><path {...c} d="M14 3h7v7" /><path {...c} d="M10 14 21 3" /><path {...c} d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" /></>,
    eye: <><path {...c} d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle {...c} cx="12" cy="12" r="2.5" /></>,
    folder: <path {...c} d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />,
    graph: <><circle {...c} cx="5" cy="12" r="2" /><circle {...c} cx="19" cy="6" r="2" /><circle {...c} cx="19" cy="18" r="2" /><path {...c} d="m7 11 10-4m-10 6 10 4" /></>,
    grid: <><rect {...c} x="3" y="3" width="7" height="7" rx="1" /><rect {...c} x="14" y="3" width="7" height="7" rx="1" /><rect {...c} x="3" y="14" width="7" height="7" rx="1" /><rect {...c} x="14" y="14" width="7" height="7" rx="1" /></>,
    logout: <><path {...c} d="M10 17l5-5-5-5m5 5H3" /><path {...c} d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" /></>,
    monitor: <><rect {...c} x="3" y="4" width="18" height="12" rx="2" /><path {...c} d="M8 20h8m-4-4v4" /></>,
    moon: <path {...c} d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />,
    panelClose: <><rect {...c} x="3" y="3" width="18" height="18" rx="2" /><path {...c} d="M9 3v18M16 8l-4 4 4 4" /></>,
    panelOpen: <><rect {...c} x="3" y="3" width="18" height="18" rx="2" /><path {...c} d="M9 3v18M12 8l4 4-4 4" /></>,
    plus: <path {...c} d="M12 5v14M5 12h14" />,
    search: <><circle {...c} cx="11" cy="11" r="6" /><path {...c} d="m16 16 4 4" /></>,
    share: <><circle {...c} cx="18" cy="5" r="3" /><circle {...c} cx="6" cy="12" r="3" /><circle {...c} cx="18" cy="19" r="3" /><path {...c} d="m8.7 10.6 6.6-4.2m-6.6 7 6.6 4.2" /></>,
    skillforge: <><polyline {...c} points="12,22.5 12,6" /><polyline {...c} points="2.4,1.5 12,9" /><polyline {...c} points="21.6,1.5 12,9" /></>,
    settings: <><path {...c} d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.09a2 2 0 0 1 1 1.74v.5a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z" /><circle {...c} cx="12" cy="12" r="3" /></>,
    sparkles: <><path {...c} d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z" /><path {...c} d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z" /></>,
    sun: <><circle {...c} cx="12" cy="12" r="4" /><path {...c} d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
    target: <><circle {...c} cx="12" cy="12" r="8" /><circle {...c} cx="12" cy="12" r="3" /><path {...c} d="M12 2v2m0 16v2M2 12h2m16 0h2" /></>,
    trash: <><path {...c} d="M3 6h18m-11 5v6m4-6v6M8 6l1-3h6l1 3m3 0-1 15H6L5 6" /></>,
    user: <><circle {...c} cx="12" cy="8" r="4" /><path {...c} d="M4 21a8 8 0 0 1 16 0" /></>,
    x: <path {...c} d="m6 6 12 12M18 6 6 18" />,
  }
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24">{paths[name]}</svg>
}
