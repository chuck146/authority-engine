import { Star } from 'lucide-react'
import { ScrollReveal } from '@/components/marketing/scroll-reveal'

const REVIEWS = [
  {
    name: 'Jane Miller',
    location: 'Westfield, NJ',
    initials: 'JM',
    text: 'Cleanest Painting transformed our entire first floor. The attention to detail was incredible — perfectly clean lines, flawless walls, and they left our home spotless. Truly professional.',
  },
  {
    name: 'Sarah Kim',
    location: 'Summit, NJ',
    initials: 'SK',
    text: 'Working with their team was a breath of fresh air. They helped us pick the perfect palette for our open floor plan and executed it beautifully. We get compliments from every guest.',
  },
  {
    name: 'Michael Thompson',
    location: 'Cranford, NJ',
    initials: 'MT',
    text: 'From the free estimate to the final walkthrough, everything was seamless. They finished ahead of schedule and the exterior paint job looks absolutely stunning. Highly recommend.',
  },
] as const

function Stars() {
  return (
    <div className="mb-3 flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className="h-4 w-4 fill-[var(--color-brand-yellow)] text-[var(--color-brand-yellow)]"
        />
      ))}
    </div>
  )
}

export function Testimonials() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-semibold text-gray-900 sm:text-4xl">
              What Clients <em className="text-[var(--color-brand-green)] not-italic">Say</em>
            </h2>
            <p className="mt-3 text-gray-500">
              Don&apos;t take our word for it — hear from homeowners across NJ
            </p>
          </div>
        </ScrollReveal>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {REVIEWS.map((review, i) => (
            <ScrollReveal key={review.name} delay={i * 100}>
              <div className="flex h-full flex-col rounded-2xl border border-gray-100 bg-gray-50 p-6">
                <Stars />
                <blockquote className="flex-1 text-sm leading-relaxed text-gray-600 italic">
                  &ldquo;{review.text}&rdquo;
                </blockquote>
                <div className="mt-5 flex items-center gap-3 border-t border-gray-200 pt-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-brand-green)] text-xs font-bold text-white">
                    {review.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{review.name}</p>
                    <p className="text-xs text-gray-500">{review.location}</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
