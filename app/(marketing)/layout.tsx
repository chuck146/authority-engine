export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">{children}</main>
    </div>
  )
}
