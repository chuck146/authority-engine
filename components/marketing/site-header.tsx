import Link from 'next/link'
import { Phone } from 'lucide-react'
import { SiteHeaderWrapper } from './site-header-wrapper'
import { ServicesDropdownDesktop, ServicesAccordionMobile } from './services-dropdown'

type ServiceLink = {
  slug: string
  title: string
}

type SiteHeaderProps = {
  orgName: string
  phone?: string
  services?: ServiceLink[]
}

const NAV_LINKS = [
  { href: '/commercial', label: 'Commercial Services' },
  { href: '/#testimonials', label: 'Reviews' },
  { href: '/locations', label: 'Service Areas' },
  { href: '/blog', label: 'Blog' },
]

export function SiteHeader({ orgName, phone, services = [] }: SiteHeaderProps) {
  const mobileMenu = (
    <div className="flex flex-col gap-4">
      {services.length > 0 && <ServicesAccordionMobile services={services} />}
      {NAV_LINKS.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="text-base font-medium text-gray-800 hover:text-[#1B2B5B]"
        >
          {link.label}
        </a>
      ))}
      {phone && <div className="my-2 border-t border-gray-200" />}
      {phone && (
        <a
          href={`tel:${phone.replace(/[^\d+]/g, '')}`}
          className="flex items-center gap-2 text-base font-medium text-gray-800"
          aria-label={`Call ${phone}`}
        >
          <Phone className="h-4 w-4 text-[#3DA535]" />
          {phone}
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
          <span className="font-display text-lg font-normal tracking-[0.08em] text-white sm:text-xl">
            {orgName.replace(' LLC', '').toUpperCase()}
          </span>
          <span className="font-editorial-italic text-[0.55rem] text-white/70 sm:text-[0.65rem]">
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
        {services.length > 0 && <ServicesDropdownDesktop services={services} />}
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
      </ul>

      {/* Desktop action cluster — phone */}
      {phone && (
        <div className="hidden items-center md:flex">
          <a
            href={`tel:${phone.replace(/[^\d+]/g, '')}`}
            className="flex items-center gap-1.5 text-sm font-semibold text-white transition-colors hover:text-[#fbbf24]"
            aria-label={`Call ${phone}`}
          >
            <Phone className="h-4 w-4" />
            {phone}
          </a>
        </div>
      )}
    </SiteHeaderWrapper>
  )
}
