export function PageFooterCta({ cta }: { cta: string }) {
  return (
    <aside className="bg-muted/50 mt-12 rounded-lg border p-8 text-center">
      <p className="text-lg font-semibold">{cta}</p>
    </aside>
  )
}
