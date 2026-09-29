import {
  ArrowRight,
  Brain,
  BriefcaseBusiness,
  ChartNoAxesColumnIncreasing,
  Check,
  ChevronDown,
  ExternalLink,
  Eye,
  Folder,
  LayoutGrid,
  LogOut,
  Monitor,
  Moon,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ServerOff,
  Settings,
  Share2,
  Sparkles,
  Sun,
  Target,
  TriangleAlert,
  Trash2,
  UserRound,
  X,
} from 'lucide-react'

const icons = {
  arrow: ArrowRight,
  brain: Brain,
  briefcase: BriefcaseBusiness,
  chart: ChartNoAxesColumnIncreasing,
  check: Check,
  chevron: ChevronDown,
  edit: Pencil,
  external: ExternalLink,
  eye: Eye,
  folder: Folder,
  graph: Network,
  grid: LayoutGrid,
  logout: LogOut,
  monitor: Monitor,
  moon: Moon,
  panelClose: PanelLeftClose,
  panelOpen: PanelLeftOpen,
  plus: Plus,
  refresh: RefreshCw,
  search: Search,
  serverOff: ServerOff,
  settings: Settings,
  share: Share2,
  sparkles: Sparkles,
  sun: Sun,
  target: Target,
  alert: TriangleAlert,
  trash: Trash2,
  user: UserRound,
  x: X,
}

export type IconName = keyof typeof icons | 'skillforge'

export function Icon({ name, size = 20, className }: { name: IconName; size?: number; className?: string }) {
  if (name === 'skillforge') {
    return <svg aria-hidden="true" focusable="false" className={`skillforge-mark ${className ?? ''}`.trim()} width={size} height={size} viewBox="0 0 10 16" fill="none">
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 15V4" />
        <path d="M1 1l4 5" />
        <path d="M9 1 5 6" />
      </g>
    </svg>
  }
  const Glyph = icons[name]
  return <Glyph aria-hidden="true" focusable="false" size={size} strokeWidth={1.8} className={className} />
}
