export function PageFooterCta({ cta }: { cta: string }) {
  return (
    <aside className="mt-12 rounded-lg border bg-muted/50 p-8 text-center">
      <p className="text-lg font-semibold">{cta}</p>
    </aside>
  )
}
