import { Phone } from 'lucide-react'

type CtaStripProps = {
  estimateUrl?: string | null
  phone?: string | null
}

export function CtaStrip({ estimateUrl, phone }: CtaStripProps) {
  return (
    <section className="bg-[#1B2B5B]">
      <div className="mx-auto max-w-7xl px-6 py-20 text-center md:px-10 lg:px-[60px]">
        <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl lg:text-5xl">
          Ready to transform your home?
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-lg text-white/70">
          Get a free estimate or call us today.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          {estimateUrl && (
            <a
              href={estimateUrl}
              className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-3.5 text-sm font-bold text-[#1B2B5B] transition-colors hover:bg-gray-100"
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
      </div>
    </section>
  )
}
