import { ArrowRight, Phone, Star } from 'lucide-react'

type HeroSplitProps = {
  orgName: string
  estimateUrl?: string | null
  phone?: string | null
  heroVideo?: string | null
}

export function HeroSplit({ orgName, estimateUrl, phone, heroVideo }: HeroSplitProps) {
  return (
    <section className="relative overflow-hidden bg-[var(--color-brand-cream)]">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-24 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-32">
        {/* Left — Copy */}
        <div className="relative z-10">
          <span className="mb-5 inline-block rounded-full bg-[var(--color-brand-green)]/10 px-4 py-1.5 text-xs font-semibold tracking-wider text-[var(--color-brand-green)] uppercase">
            New Jersey&apos;s Creative Painters
          </span>

          <h1 className="font-display text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl lg:text-[3.5rem] lg:leading-[1.1]">
            Where <em className="text-[var(--color-brand-green)] not-italic">Artistry</em> Meets
            Craftsmanship
          </h1>

          <p className="mt-5 max-w-lg text-lg leading-relaxed text-gray-600">
            Premium residential painting across Union, Essex, Morris &amp; Somerset counties. From
            interior transformations to full exterior makeovers — craftsmanship you can see and
            feel.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            {estimateUrl && (
              <a
                href={estimateUrl}
                className="inline-flex items-center justify-center rounded-lg bg-[var(--color-brand-green)] px-8 py-3.5 text-sm font-bold text-white shadow-[var(--color-brand-green)]/25 shadow-lg transition-all hover:bg-[var(--color-brand-green-dark)] hover:shadow-xl"
              >
                Get Your Free Estimate
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            )}
            {phone && (
              <a
                href={`tel:${phone.replace(/[^\d+]/g, '')}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-gray-300 px-8 py-3.5 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50"
              >
                <Phone className="h-4 w-4" />
                {phone}
              </a>
            )}
          </div>
        </div>

        {/* Right — Visual */}
        <div className="relative hidden lg:block">
          {/* Diagonal green shape */}
          <div
            className="absolute -top-8 -right-12 h-[110%] w-[90%] rounded-3xl bg-[var(--color-brand-green)]"
            style={{ clipPath: 'polygon(15% 0%, 100% 0%, 100% 100%, 0% 100%)' }}
          />

          {/* Hero video / fallback */}
          <div className="relative z-10 h-[520px] overflow-hidden rounded-2xl bg-black shadow-xl">
            {heroVideo ? (
              <video
                autoPlay
                muted
                loop
                playsInline
                className="h-full w-full object-contain"
              >
                <source src={heroVideo} type="video/quicktime" />
                <source src={heroVideo} type="video/mp4" />
              </video>
            ) : (
              <div className="flex h-full items-center justify-center bg-white/80 backdrop-blur">
                <div className="text-center text-gray-400">
                  <div className="text-5xl font-bold text-[var(--color-brand-green)]">
                    {orgName.charAt(0)}
                  </div>
                  <p className="mt-2 text-sm">{orgName}</p>
                </div>
              </div>
            )}
          </div>

          {/* Floating rating card */}
          <div className="animate-float absolute -bottom-4 -left-8 z-20 flex items-center gap-3 rounded-xl bg-white px-5 py-3.5 shadow-xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-brand-yellow)]">
              <Star className="h-5 w-5 fill-white text-white" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">5.0</p>
              <p className="text-xs text-gray-500">Average Rating</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
