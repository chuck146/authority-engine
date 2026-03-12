import Link from 'next/link'
import Image from 'next/image'
import { SiteHeaderWrapper } from './site-header-wrapper'

type SiteHeaderProps = {
  orgName: string
  logoUrl?: string | null
  estimateUrl?: string
  phone?: string
}

const NAV_LINKS = [
  { href: '/#services', label: 'Services' },
  { href: '/#about', label: 'About' },
  { href: '/#testimonials', label: 'Reviews' },
  { href: '/#contact', label: 'Contact' },
]

export function SiteHeader({ orgName, logoUrl, estimateUrl, phone }: SiteHeaderProps) {
  const mobileMenu = (
    <div className="flex flex-col gap-4">
      {NAV_LINKS.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="text-base font-medium text-gray-800 hover:text-[#4CB848]"
        >
          {link.label}
        </a>
      ))}
      {phone && (
        <a
          href={`tel:${phone.replace(/[^\d+]/g, '')}`}
          className="text-base font-medium text-gray-800"
        >
          {phone}
        </a>
      )}
      {estimateUrl && (
        <a
          href={estimateUrl}
          className="inline-flex w-fit items-center rounded-full bg-[#4CB848] px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#3A9438]"
        >
          Free Estimate
        </a>
      )}
    </div>
  )

  return (
    <SiteHeaderWrapper mobileMenu={mobileMenu}>
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3">
        {logoUrl ? (
          <Image src={logoUrl} alt={orgName} width={44} height={44} className="rounded-xl" />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#4CB848]">
            <svg viewBox="0 0 24 24" fill="white" className="h-6 w-6">
              <path d="M20 8V5c0-1.1-.9-2-2-2h-3c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-3h-2v3H5V3h6v2H8v2h3v2H8v2h3v2H8v2h3v2H8v2h10V8h2z" />
            </svg>
          </div>
        )}
        <div className="flex flex-col leading-tight">
          <span className="font-display text-xl font-semibold text-gray-900">
            {orgName.replace(' LLC', '')}
          </span>
          <span className="text-[0.65rem] font-medium tracking-[0.15em] text-gray-500 uppercase">
            Painting Beyond the Ordinary
          </span>
        </div>
      </Link>

      {/* Desktop nav */}
      <ul className="hidden items-center gap-8 md:flex lg:gap-12">
        {NAV_LINKS.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              className="relative py-1 text-sm font-medium text-gray-700 transition-colors hover:text-[#4CB848]"
            >
              {link.label}
            </a>
          </li>
        ))}
        {estimateUrl && (
          <li>
            <a
              href={estimateUrl}
              className="rounded-full bg-[#4CB848] px-7 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[#3A9438] hover:shadow-lg hover:shadow-[#4CB848]/30"
            >
              Free Estimate
            </a>
          </li>
        )}
      </ul>
    </SiteHeaderWrapper>
  )
}
