import { Star, Shield, CheckCircle, Award } from 'lucide-react'

const BADGES = [
  { icon: Star, label: 'Google Verified', desc: '5-Star Reviews' },
  { icon: Shield, label: 'Fully Insured', desc: 'Licensed & Bonded' },
  { icon: CheckCircle, label: 'Licensed NJ', desc: 'HIC #13VH12345' },
  { icon: Award, label: 'Angi Super Service', desc: '2024 Award Winner' },
] as const

export function TrustBar() {
  return (
    <section className="border-y border-gray-200 bg-white">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 md:grid-cols-4 lg:px-8">
        {BADGES.map((badge) => (
          <div key={badge.label} className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-green)]/10">
              <badge.icon className="h-5 w-5 text-[var(--color-brand-green)]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{badge.label}</p>
              <p className="text-xs text-gray-500">{badge.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
