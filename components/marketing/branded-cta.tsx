import { Phone } from 'lucide-react'

type BrandedCtaProps = {
  cta: string
  phone?: string
  estimateUrl?: string
}

export function BrandedCta({ cta, phone, estimateUrl }: BrandedCtaProps) {
  return (
    <aside className="mt-16 rounded-xl bg-gradient-to-r from-[#1B2B5B] to-[#1e3a5f] px-6 py-10 text-center shadow-lg sm:px-10">
      <p className="text-xl font-semibold text-white sm:text-2xl">{cta}</p>
      <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
        {estimateUrl && (
          <a
            href={estimateUrl}
            className="inline-flex items-center rounded-lg bg-amber-400 px-6 py-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-amber-300"
          >
            Get Your Free Estimate
          </a>
        )}
        {phone && (
          <a
            href={`tel:${phone.replace(/[^\d+]/g, '')}`}
            className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            <Phone className="h-4 w-4" />
            {phone}
          </a>
        )}
      </div>
      {!estimateUrl && !phone && (
        <div className="mt-4">
          <span className="inline-block h-1 w-16 rounded-full bg-amber-400/60" />
        </div>
      )}
    </aside>
  )
}
