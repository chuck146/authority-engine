import Link from 'next/link'
import { SiteHeaderWrapper } from './site-header-wrapper'

type SiteHeaderProps = {
  orgName: string
  logoUrl?: string | null
  estimateUrl?: string
  phone?: string
}

const NAV_LINKS = [
  { href: '/#work', label: 'Work' },
  { href: '/#services', label: 'Services' },
  { href: '/#testimonials', label: 'Reviews' },
  { href: '/locations', label: 'Areas' },
]

export function SiteHeader({ orgName, logoUrl, estimateUrl, phone }: SiteHeaderProps) {
  const mobileMenu = (
    <div className="flex flex-col gap-4">
      {NAV_LINKS.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="text-base font-medium text-gray-800 hover:text-[#1B2B5B]"
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
          className="inline-flex w-fit items-center rounded-full bg-[#1B2B5B] px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#14204a]"
        >
          Free Estimate
        </a>
      )}
    </div>
  )

  return (
    <SiteHeaderWrapper mobileMenu={mobileMenu}>
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5">
        {logoUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={logoUrl}
            alt={orgName}
            width={80}
            height={80}
            className="h-20 w-20 rounded-xl object-cover shadow-sm"
            loading="eager"
            decoding="async"
          />
        ) : (
          <div className="flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-[#1B2B5B]">
            <svg viewBox="0 0 24 24" fill="white" className="h-7 w-7">
              <path d="M18 4V3c0-.55-.45-1-1-1H5c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V6h1v4H9v11c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-9h8V4h-3z" />
            </svg>
          </div>
        )}
        <div className="flex flex-col leading-tight">
          <span className="header-org-name font-display text-xl font-semibold text-white transition-colors duration-400">
            {orgName.replace(' LLC', '')}
          </span>
          <span className="header-tagline text-[0.6rem] font-medium tracking-[0.15em] text-white/60 uppercase transition-colors duration-400">
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
              className="header-nav-link relative py-1 text-sm font-medium text-white/80 transition-colors duration-400 hover:text-white"
            >
              {link.label}
            </a>
          </li>
        ))}
        {estimateUrl && (
          <li>
            <a
              href={estimateUrl}
              className="rounded-full bg-[#1B2B5B] px-7 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#14204a]"
            >
              Free Estimate
            </a>
          </li>
        )}
      </ul>
    </SiteHeaderWrapper>
  )
}
