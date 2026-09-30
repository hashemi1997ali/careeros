export function LoadingState({ cards = false, label = 'Loading content' }: { cards?: boolean; label?: string }) {
  return <div role="status" aria-label={label} aria-busy="true" className={cards ? 'card-grid content-skeleton is-cards' : 'content-skeleton'}>
    <span className="sr-only">{label}</span>
    {Array.from({ length: cards ? 6 : 4 }, (_, index) => <i aria-hidden="true" key={index} style={{ '--i': index } as React.CSSProperties}/>)}
  </div>
}
