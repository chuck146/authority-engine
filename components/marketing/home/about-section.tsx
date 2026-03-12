import { ScrollReveal } from '@/components/marketing/scroll-reveal'

const PHILOSOPHY = [
  {
    num: '01',
    title: 'Designer Partnerships',
    desc: 'We collaborate directly with interior designers to execute their vision with precision.',
  },
  {
    num: '02',
    title: 'Meticulous Prep',
    desc: 'Proper preparation is 80% of a flawless finish. We never cut corners.',
  },
  {
    num: '03',
    title: 'Premium Materials',
    desc: 'Benjamin Moore & Sherwin-Williams exclusively. No substitutions, no compromises.',
  },
  {
    num: '04',
    title: 'Respectful Process',
    desc: 'Clean jobsites, clear communication, and on-time completion — every project.',
  },
] as const

export function AboutSection() {
  return (
    <section className="bg-[var(--color-brand-cream)]">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="grid items-start gap-12 lg:grid-cols-2">
            {/* Left — Heading + description */}
            <div>
              <h2 className="font-display text-3xl font-semibold text-gray-900 sm:text-4xl">
                We See <em className="text-[var(--color-brand-green)] not-italic">Canvas</em>, Not
                Just Walls
              </h2>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-gray-600">
                Every surface tells a story. We&apos;re not just painters — we&apos;re craftspeople
                who understand that the right color, the right finish, and the right technique
                transforms a house into a home.
              </p>
            </div>

            {/* Right — 2x2 philosophy grid */}
            <div className="grid gap-6 sm:grid-cols-2">
              {PHILOSOPHY.map((item) => (
                <div key={item.num}>
                  <span className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-brand-green)] text-xs font-bold text-white">
                    {item.num}
                  </span>
                  <h3 className="mt-2 text-sm font-bold text-gray-900">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-gray-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
