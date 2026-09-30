import type { CSSProperties } from 'react'

// Deterministic PRNG so server and client render the same field (no hydration mismatch).
function seeded(seed: number) {
  return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 }
}

const random = seeded(20260930)
const dots = Array.from({ length: 46 }, () => ({
  x: random() * 100,
  y: random() * 100,
  size: 1.5 + random() * 2.5,
  delay: random() * -8,
  duration: 4 + random() * 6,
  // A firefly path: two waypoints up to ~60px away, travelled slowly.
  path: [random(), random(), random(), random()].map(value => (value - 0.5) * 120),
  drift: 14 + random() * 16,
}))

/** Firefly-like points of light behind the workspace: they drift and glow. Decorative only. */
export function AmbientDots() {
  return <div className="ambient-dots" aria-hidden="true">
    {dots.map((dot, index) => <i key={index} style={{
      left: `${dot.x.toFixed(2)}%`, top: `${dot.y.toFixed(2)}%`,
      '--dot': `${dot.size.toFixed(2)}px`, '--delay': `${dot.delay.toFixed(2)}s`, '--dur': `${dot.duration.toFixed(2)}s`,
      '--x1': `${dot.path[0].toFixed(1)}px`, '--y1': `${dot.path[1].toFixed(1)}px`, '--x2': `${dot.path[2].toFixed(1)}px`, '--y2': `${dot.path[3].toFixed(1)}px`, '--drift': `${dot.drift.toFixed(1)}s`,
    } as CSSProperties} />)}
  </div>
}
