import Image from 'next/image'
import { Phone } from 'lucide-react'

type HeroSplitProps = {
  orgName: string
  estimateUrl?: string | null
  phone?: string | null
  heroVideo?: string | null
}

export function HeroSplit({ orgName, estimateUrl, phone, heroVideo }: HeroSplitProps) {
  return (
    <section className="relative min-h-[85vh] overflow-hidden bg-black sm:min-h-[90vh]">
      {/* Background — video on desktop, static image always visible */}
      {heroVideo ? (
        <>
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 hidden h-full w-full object-cover lg:block"
          >
            <source src={heroVideo} type="video/quicktime" />
            <source src={heroVideo} type="video/mp4" />
          </video>
          <Image
            src="/project-1.jpeg"
            alt={`${orgName} — professional painting project`}
            fill
            priority
            className="object-cover object-center lg:hidden"
            sizes="100vw"
          />
        </>
      ) : (
        <Image
          src="/project-1.jpeg"
          alt={`${orgName} — professional painting project`}
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
      )}

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

      {/* Copy — anchored bottom-left */}
      <div className="relative z-10 flex min-h-[85vh] items-end sm:min-h-[90vh]">
        <div className="w-full px-6 pb-16 sm:pb-20 md:px-10 lg:max-w-3xl lg:px-[60px] lg:pb-24">
          <h1 className="font-display text-5xl leading-[1.05] font-semibold text-white sm:text-6xl lg:text-7xl">
            Where Artistry Meets Craftsmanship
          </h1>

          <p className="mt-5 max-w-lg text-lg leading-relaxed text-white/80">
            Premium residential painting across Union, Essex, Morris &amp; Somerset counties.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            {estimateUrl && (
              <a
                href={estimateUrl}
                className="inline-flex items-center justify-center rounded-lg bg-[#4CB848] px-8 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#3a9438]"
              >
                Get Your Free Estimate
              </a>
            )}
            {phone && (
              <a
                href={`tel:${phone.replace(/[^\d+]/g, '')}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:border-white/60 hover:bg-white/10"
              >
                <Phone className="h-4 w-4" />
                {phone}
              </a>
            )}
          </div>

          {/* Trust signals — single text line */}
          <p className="mt-8 text-xs tracking-wide text-white/50 uppercase">
            5.0 Google Rating &mdash; Licensed &amp; Insured &mdash; Angi 2024 Super Service
          </p>
        </div>
      </div>
    </section>
  )
}
