# CareerOS – loading, error, motion & performance pass

Design language unchanged. What changed:

## One loading / one error per page
- `components/page-state.tsx` (new): `PageLoader`, `PageError`, `usePageState(queries)`.
  Every workspace page hands its queries to `usePageState`; while anything loads the whole page shows one loader,
  any failure shows one full-page message with a **Reload** button (session expiry shows "Sign in again").
- Removed all per-section `error-banner`s and inline skeletons (dashboard, applications, skills, Skill Core, projects, analyzer).
- `app/(workspace)/loading.tsx` uses the same loader; new `app/(workspace)/error.tsx` catches render crashes.

## Offline server detection
- `lib/upstream-response.ts`: `upstreamFetch()` wraps every server→API call with a timeout and never throws.
  A refused connection / timeout becomes a 503 flagged `x-careeros-upstream: unavailable`.
  All `app/api/**` routes and the workspace layout use it (layout sync times out after 3 s so the shell still renders).
- `lib/api-client.ts`: `ApiError.kind` = `unavailable | unauthorized | http`; browser network failures are caught too.
  GET requests no longer toast (the page state reports them); mutations still do.
- `lib/notifications.ts`: identical toasts within 4 s are de-duplicated.
- `components/query-provider.tsx`: no retries on 4xx, one quick retry for 5xx/offline, refetch on reconnect.
- Global search shows an inline "Can't connect" state instead of silently showing no results.

## Motion
- `app/motion.css` (new, loaded last): shared tokens (`--ease-out`, `--dur*`, `--stagger`), page fade + staggered section rise,
  staggered cards, unified hover/press/focus transitions, card hover lift, sidebar/header/modal timings aligned,
  toast exit animation (`notification-viewport.tsx`), reduced-motion support.
- Animations use `backwards` fill so hover transforms keep working after entry.

## Performance
- Landing: three.js particle field is lazy-loaded (`next/dynamic`, `ssr: false`) and fades in.
- Queries pass React Query's `signal`, so leaving a page cancels its requests.

## Responsive
- Mobile `app-main` uses `100%` instead of `100vw` (no sideways scroll), `content-shell` clips overflow,
  page states size to the viewport, full-width Reload button on phones.
