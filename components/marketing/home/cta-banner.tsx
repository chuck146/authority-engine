import { ScrollReveal } from '@/components/marketing/scroll-reveal'

const PERKS = [
  { title: 'Priority Scheduling', desc: 'Skip the queue — your projects come first.' },
  { title: 'Direct Communication', desc: 'Work directly with our lead painters.' },
  { title: 'Flexible Timing', desc: 'We work around your client deadlines.' },
  { title: 'Preferred Pricing', desc: 'Volume rates for repeat partnerships.' },
] as const

type CtaBannerProps = {
  estimateUrl?: string | null
}

export function CtaBanner({ estimateUrl }: CtaBannerProps) {
  return (
    <section className="bg-gradient-to-br from-[var(--color-brand-green)] to-[var(--color-brand-green-dark)]">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="text-center">
            <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
              Interior Designers, Let&apos;s{' '}
              <em className="text-white/90 not-italic">Collaborate</em>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
              We partner with designers across Northern NJ to bring your visions to life — with the
              precision and care your clients expect.
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PERKS.map((perk) => (
              <div
                key={perk.title}
                className="rounded-xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm"
              >
                <h3 className="text-sm font-bold text-white">{perk.title}</h3>
                <p className="mt-1 text-sm text-white/70">{perk.desc}</p>
              </div>
            ))}
          </div>

          {estimateUrl && (
            <div className="mt-10 text-center">
              <a
                href={estimateUrl}
                className="inline-flex items-center rounded-lg bg-white px-8 py-3.5 text-sm font-bold text-[var(--color-brand-green-dark)] shadow-lg transition-all hover:bg-gray-100 hover:shadow-xl"
              >
                Start a Partnership
              </a>
            </div>
          )}
        </ScrollReveal>
      </div>
    </section>
  )
}
