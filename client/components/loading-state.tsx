export function LoadingState({ cards = false, label = 'Loading content' }: { cards?: boolean; label?: string }) {
  return <div role="status" aria-label={label} className={cards ? 'card-grid content-skeleton' : 'content-skeleton'}>
    <span className="sr-only">{label}</span>
    {Array.from({ length: cards ? 3 : 4 }, (_, index) => <i aria-hidden="true" key={index}/>)}
  </div>
}
