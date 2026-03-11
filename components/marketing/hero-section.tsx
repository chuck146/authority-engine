import Image from 'next/image'
import Link from 'next/link'

type Breadcrumb = { label: string; href?: string }

type HeroSectionProps = {
  imageUrl?: string | null
  title: string
  subtitle?: string
  breadcrumbs: Breadcrumb[]
  badge?: string
}

export function HeroSection({ imageUrl, title, subtitle, breadcrumbs, badge }: HeroSectionProps) {
  return (
    <header className="relative flex min-h-[340px] items-end overflow-hidden sm:min-h-[400px]">
      {imageUrl ? (
        <Image src={imageUrl} alt="" fill className="object-cover" priority sizes="100vw" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#1B2B5B] via-[#1e3a5f] to-[#0f1a35]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
      <div className="relative z-10 mx-auto w-full max-w-4xl px-4 pt-24 pb-10 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-4">
          <ol className="flex items-center gap-1.5 text-sm text-white/70">
            {breadcrumbs.map((crumb, i) => (
              <li key={i} className="flex items-center gap-1.5">
                {i > 0 && <span aria-hidden="true">/</span>}
                {crumb.href ? (
                  <Link href={crumb.href as never} className="transition-colors hover:text-white">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-white/90">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
        {badge && (
          <span className="mb-3 inline-block rounded-full bg-amber-400/90 px-3 py-1 text-xs font-semibold tracking-wider text-gray-900 uppercase">
            {badge}
          </span>
        )}
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        {subtitle && <p className="mt-3 text-lg text-white/80">{subtitle}</p>}
      </div>
    </header>
  )
}
