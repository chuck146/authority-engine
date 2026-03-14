import { Star } from 'lucide-react'
import { ScrollReveal } from '@/components/marketing/scroll-reveal'

const REVIEWS = [
  {
    name: 'Jane Miller',
    location: 'Westfield, NJ',
    text: 'Cleanest Painting transformed our entire first floor. The attention to detail was incredible — perfectly clean lines, flawless walls, and they left our home spotless. Truly professional.',
    featured: true,
  },
  {
    name: 'Sarah Kim',
    location: 'Summit, NJ',
    text: 'They helped us pick the perfect palette for our open floor plan and executed it beautifully. We get compliments from every guest.',
  },
  {
    name: 'Michael Thompson',
    location: 'Cranford, NJ',
    text: 'From the free estimate to the final walkthrough, everything was seamless. They finished ahead of schedule and the exterior paint job looks stunning.',
  },
] as const

function SmallStars() {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className="h-3.5 w-3.5 fill-[var(--color-brand-yellow)] text-[var(--color-brand-yellow)]"
        />
      ))}
    </div>
  )
}

export function Testimonials() {
  const featured = REVIEWS[0]
  const supporting = REVIEWS.slice(1)

  return (
    <section id="testimonials" className="bg-white">
      <div className="mx-auto max-w-7xl px-6 py-28 md:px-10 lg:px-[60px]">
        <ScrollReveal>
          <h2 className="font-display text-3xl font-semibold text-gray-900 sm:text-4xl lg:text-5xl">
            What Our Clients Say
          </h2>
        </ScrollReveal>

        <div className="mt-12 grid gap-8 lg:grid-cols-5">
          {/* Featured testimonial — large */}
          <ScrollReveal className="lg:col-span-3">
            <div className="flex h-full flex-col justify-between rounded-2xl border border-gray-100 bg-gray-50 p-8 lg:p-10">
              <div>
                <SmallStars />
                <blockquote className="font-display mt-6 text-2xl leading-relaxed text-gray-900 italic sm:text-[1.65rem]">
                  &ldquo;{featured.text}&rdquo;
                </blockquote>
              </div>
              <div className="mt-8 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                  {featured.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{featured.name}</p>
                  <p className="text-xs text-gray-500">{featured.location}</p>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Supporting testimonials — stacked */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            {supporting.map((review, i) => (
              <ScrollReveal key={review.name} delay={(i + 1) * 100}>
                <div className="flex h-full flex-col rounded-2xl border border-gray-100 bg-gray-50 p-6">
                  <SmallStars />
                  <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-gray-600 italic">
                    &ldquo;{review.text}&rdquo;
                  </blockquote>
                  <div className="mt-5 flex items-center gap-3 border-t border-gray-200 pt-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                      {review.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
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
      </div>
    </section>
  )
}
