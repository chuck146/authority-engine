import Image from 'next/image'
import Link from 'next/link'

type HeroSplitProps = {
  orgName: string
  heroVideo?: string | null
}

export function HeroSplit({ orgName, heroVideo }: HeroSplitProps) {
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
          <p className="editorial-kicker mb-4 text-white/60">Cleanest Painting LLC</p>
          <h1 className="font-display text-5xl leading-[0.95] font-normal tracking-tight text-white sm:text-6xl lg:text-8xl">
            Where Artistry{' '}
            <em className="font-editorial-italic text-[var(--color-brand-yellow)]">Meets</em>{' '}
            Craftsmanship
          </h1>

          <p className="mt-6 max-w-lg text-base leading-relaxed tracking-wide text-white/60">
            Premium residential painting across Union, Essex, Morris &amp; Somerset counties.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/#estimate"
              className="inline-flex items-center justify-center rounded-lg bg-[#4CB848] px-8 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#3a9438]"
            >
              Get Your Free Estimate
            </Link>
          </div>

          {/* Trust signals — single text line */}
          <p className="editorial-kicker mt-8 text-white/40">
            5.0 Google Rating &mdash; Licensed &amp; Insured &mdash; Angi 2024 Super Service
          </p>
        </div>
      </div>
    </section>
  )
}
