import Link from 'next/link'

type FooterLink = { slug: string; title: string; city?: string; state?: string }

type SiteFooterProps = {
  orgName: string
  tagline: string
  logoUrl?: string | null
  phone?: string
  email?: string
  address?: {
    streetAddress?: string
    city?: string
    state?: string
    postalCode?: string
  }
  services: FooterLink[]
  locations: FooterLink[]
}

export function SiteFooter({
  orgName,
  tagline,
  logoUrl,
  phone,
  email,
  address,
  services,
  locations,
}: SiteFooterProps) {
  return (
    <footer className="bg-[#1A1A1A]">
      <div className="mx-auto max-w-[1400px] px-6 pt-20 pb-10 md:px-10 lg:px-[60px]">
        {/* Main footer grid */}
        <div className="mb-16 grid gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-16">
          {/* Brand column */}
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt={orgName}
                  width={52}
                  height={52}
                  className="h-[52px] w-[52px] rounded-xl object-cover shadow-md shadow-black/20"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-[#1B2B5B] ring-1 ring-white/10">
                  <svg viewBox="0 0 24 24" fill="white" className="h-7 w-7">
                    <path d="M18 4V3c0-.55-.45-1-1-1H5c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h12c.55 0 1-.45 1-1V6h1v4H9v11c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-9h8V4h-3z" />
                  </svg>
                </div>
              )}
              <div className="flex flex-col leading-tight">
                <span className="font-display text-lg font-semibold text-white">
                  {orgName.replace(' LLC', '')}
                </span>
                <span className="text-[0.6rem] font-medium tracking-[0.15em] text-white/50 uppercase">
                  Painting Beyond the Ordinary
                </span>
              </div>
            </Link>
            <p className="mt-5 max-w-[300px] text-[0.95rem] leading-relaxed text-white/60">
              {tagline}. Proudly serving Central &amp; Northern New Jersey with artistry, precision,
              and care.
            </p>
            <div className="mt-6 flex gap-3">
              <a
                href="https://instagram.com/cleanestpainting"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 transition-all hover:-translate-y-1 hover:bg-[#fbbf24]"
              >
                <svg viewBox="0 0 24 24" fill="white" className="h-5 w-5">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a
                href="https://facebook.com/cleanestpainting"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 transition-all hover:-translate-y-1 hover:bg-[#fbbf24]"
              >
                <svg viewBox="0 0 24 24" fill="white" className="h-5 w-5">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="https://www.cleanestpaintingnj.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 transition-all hover:-translate-y-1 hover:bg-[#fbbf24]"
              >
                <svg viewBox="0 0 24 24" fill="white" className="h-5 w-5">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Services column */}
          <div>
            <h4 className="mb-6 text-sm font-semibold tracking-[0.05em] text-white uppercase">
              Services
            </h4>
            <ul className="flex flex-col gap-3.5">
              {services.slice(0, 6).map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/services/${s.slug}`}
                    className="text-[0.95rem] text-white/60 transition-colors hover:text-[#fbbf24]"
                  >
                    {s.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Service Areas column */}
          <div>
            <h4 className="mb-6 text-sm font-semibold tracking-[0.05em] text-white uppercase">
              Service Areas
            </h4>
            <ul className="flex flex-col gap-3.5">
              {locations.slice(0, 6).map((l) => (
                <li key={l.slug}>
                  <Link
                    href={`/locations/${l.slug}`}
                    className="text-[0.95rem] text-white/60 transition-colors hover:text-[#fbbf24]"
                  >
                    {l.city ?? l.title}, {l.state ?? 'NJ'}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact column */}
          <div>
            <h4 className="mb-6 text-sm font-semibold tracking-[0.05em] text-white uppercase">
              Contact
            </h4>
            <div className="flex flex-col gap-4">
              {phone && (
                <div>
                  <p className="mb-1 text-xs font-semibold tracking-[0.1em] text-white/40 uppercase">
                    Phone
                  </p>
                  <a
                    href={`tel:${phone.replace(/[^\d+]/g, '')}`}
                    className="text-[0.95rem] font-medium text-white transition-colors hover:text-[#fbbf24]"
                  >
                    {phone}
                  </a>
                </div>
              )}
              {email && (
                <div>
                  <p className="mb-1 text-xs font-semibold tracking-[0.1em] text-white/40 uppercase">
                    Email
                  </p>
                  <a
                    href={`mailto:${email}`}
                    className="text-[0.95rem] font-medium text-white transition-colors hover:text-[#fbbf24]"
                  >
                    {email}
                  </a>
                </div>
              )}
              {address && (
                <div>
                  <p className="mb-1 text-xs font-semibold tracking-[0.1em] text-white/40 uppercase">
                    Address
                  </p>
                  <p className="text-[0.95rem] text-white/90">
                    {address.streetAddress && (
                      <>
                        {address.streetAddress}
                        <br />
                      </>
                    )}
                    {address.city}, {address.state} {address.postalCode}
                  </p>
                </div>
              )}
              <div>
                <p className="mb-1 text-xs font-semibold tracking-[0.1em] text-white/40 uppercase">
                  Service Area
                </p>
                <p className="text-[0.95rem] text-white/90">Central &amp; Northern New Jersey</p>
              </div>
            </div>
          </div>
        </div>

        {/* Map + NAP */}
        <div className="mt-4 mb-12">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
            <div className="w-full overflow-hidden rounded-2xl shadow-lg lg:max-w-md">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d193595.1583091352!2d-74.24322613964118!3d40.69714941879884!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c24fa5d33f083b%3A0xc80b8f06e177fe62!2sNew%20York%2C%20NY%2C%20USA!5e0!3m2!1sen!2sus!4v1648482801994!5m2!1sen!2sus"
                width="100%"
                height="220"
                style={{ border: 0, borderRadius: '16px' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Service area map"
              />
            </div>
            <div className="max-w-md">
              <h4 className="mb-3 text-sm font-semibold text-white">{orgName}</h4>
              {address && (
                <p className="mb-2.5 text-[0.95rem] text-white/90">
                  {address.streetAddress && <>{address.streetAddress}, </>}
                  {address.city}, {address.state} {address.postalCode}
                </p>
              )}
              {phone && (
                <p className="mb-2.5 text-[0.95rem] text-white/90">
                  <a
                    href={`tel:${phone.replace(/[^\d+]/g, '')}`}
                    className="border-b border-white/30 text-white transition-colors hover:border-white"
                  >
                    {phone}
                  </a>
                </p>
              )}
              {email && (
                <p className="mb-2.5 text-[0.95rem] text-white/90">
                  <a
                    href={`mailto:${email}`}
                    className="border-b border-white/30 text-white transition-colors hover:border-white"
                  >
                    {email}
                  </a>
                </p>
              )}
              <p className="text-sm text-white/50">
                Serving Union, Essex, Morris, &amp; Somerset Counties
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-5 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-sm text-white/40">
            &copy; {new Date().getFullYear()} {orgName}. All rights reserved.
          </p>
          <div className="flex gap-8">
            <a href="/privacy" className="text-sm text-white/40 transition-colors hover:text-white">
              Privacy Policy
            </a>
            <a href="/terms" className="text-sm text-white/40 transition-colors hover:text-white">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
