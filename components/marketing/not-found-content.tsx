import Link from 'next/link'

const LINKS = [
  { href: '/services', label: 'Residential painting services' },
  { href: '/commercial', label: 'Commercial painting' },
  { href: '/locations', label: 'Service areas' },
  { href: '/blog', label: 'Painting guides & blog' },
] as const

export function NotFoundContent() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-24 text-center sm:py-32">
      <p className="editorial-kicker">404</p>
      <h1 className="font-display mt-4 text-4xl font-normal tracking-tight text-gray-900 sm:text-5xl dark:text-white">
        We couldn&apos;t find that page
      </h1>
      <p className="mt-6 text-lg text-gray-600 dark:text-gray-300">
        The page may have moved or no longer exists. These links will get you back on track.
      </p>
      <ul className="mt-10 grid gap-3 sm:grid-cols-2">
        {LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="block rounded-lg border border-gray-200 px-4 py-3 text-gray-800 transition-colors hover:border-[var(--color-brand-green)] hover:text-[var(--color-brand-green)] dark:border-gray-800 dark:text-gray-200"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href="/estimate"
          className="rounded-lg bg-[var(--color-brand-green)] px-6 py-3 font-bold text-white shadow-sm hover:opacity-90"
        >
          Get a Free Estimate
        </Link>
        <Link
          href="/"
          className="px-6 py-3 font-medium text-gray-700 hover:underline dark:text-gray-300"
        >
          Back to homepage
        </Link>
      </div>
    </section>
  )
}
