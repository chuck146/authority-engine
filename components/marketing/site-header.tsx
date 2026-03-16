import Link from 'next/link'
import { SiteHeaderWrapper } from './site-header-wrapper'

type SiteHeaderProps = {
  orgName: string
  estimateUrl?: string
  phone?: string
}

const NAV_LINKS = [
  { href: '/services', label: 'Services' },
  { href: '/#work', label: 'Our Work' },
  { href: '/#testimonials', label: 'Reviews' },
  { href: '/locations', label: 'Service Areas' },
  { href: '/blog', label: 'Blog' },
]

export function SiteHeader({ orgName, estimateUrl, phone }: SiteHeaderProps) {
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
          className="inline-flex w-fit items-center rounded-full bg-[#fbbf24] px-6 py-2.5 text-sm font-semibold text-gray-900 transition-all hover:bg-[#f59e0b]"
        >
          Free Estimate
        </a>
      )}
    </div>
  )

  return (
    <SiteHeaderWrapper mobileMenu={mobileMenu}>
      {/* Logo — brushes flanking text */}
      <Link href="/" className="flex items-center gap-1.5 sm:gap-2">
        {/* Left paintbrush */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/left-brush.png"
          alt=""
          className="h-8 w-auto scale-110 sm:h-10"
          loading="eager"
          decoding="async"
        />
        <div className="flex flex-col items-center leading-tight">
          <span className="font-display text-lg font-bold tracking-wide text-white sm:text-xl">
            {orgName.replace(' LLC', '').toUpperCase()}
          </span>
          <span className="text-[0.5rem] font-medium tracking-[0.15em] text-white/80 uppercase sm:text-[0.6rem]">
            Painting Beyond the Ordinary
          </span>
        </div>
        {/* Right paintbrush */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/right-brush.png"
          alt=""
          className="h-8 w-auto sm:h-10"
          loading="eager"
          decoding="async"
        />
      </Link>

      {/* Desktop nav */}
      <ul className="hidden items-center gap-6 md:flex lg:gap-10">
        {NAV_LINKS.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              className="relative py-1 text-sm font-medium text-white/80 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          </li>
        ))}
        {estimateUrl && (
          <li>
            <a
              href={estimateUrl}
              className="rounded-full bg-[#fbbf24] px-7 py-2.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-[#f59e0b]"
            >
              Free Estimate
            </a>
          </li>
        )}
      </ul>
    </SiteHeaderWrapper>
  )
}
