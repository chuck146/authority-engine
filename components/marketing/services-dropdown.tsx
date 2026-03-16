'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'

type ServiceLink = {
  slug: string
  title: string
}

type ServicesDropdownProps = {
  services: ServiceLink[]
}

/** Preferred display order for residential services dropdown */
const SERVICE_ORDER: string[] = [
  'interior-painting',
  'exterior-painting',
  'wallpaper-installation',
  'color-consultation',
  'cabinet-refinishing',
  'deck-staining',
  'pressure-washing',
]

/** Slugs to exclude from the residential dropdown */
const EXCLUDED_SLUGS = ['commercial-painting']

function sortServices(services: ServiceLink[]): ServiceLink[] {
  return [...services]
    .filter((s) => !EXCLUDED_SLUGS.includes(s.slug))
    .sort((a, b) => {
      const ai = SERVICE_ORDER.indexOf(a.slug)
      const bi = SERVICE_ORDER.indexOf(b.slug)
      // Items not in the list go to the end, preserving their original order
      if (ai === -1 && bi === -1) return 0
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    })
}

export function ServicesDropdownDesktop({ services: rawServices }: ServicesDropdownProps) {
  const services = sortServices(rawServices)
  const [open, setOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleEnter = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpen(true)
  }, [])

  const handleLeave = useCallback(() => {
    closeTimer.current = setTimeout(() => setOpen(false), 150)
  }, [])

  return (
    <li className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <Link
        href="/services"
        className="relative flex items-center gap-1 py-1 text-sm font-medium text-white/80 transition-colors hover:text-white"
      >
        Residential Painting
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </Link>

      {open && (
        <div className="absolute top-full left-1/2 z-50 w-64 -translate-x-1/2 pt-2">
          <div className="rounded-lg bg-white py-2 shadow-lg ring-1 ring-black/5">
            {services.map((service) => (
              <Link
                key={service.slug}
                href={`/services/${service.slug}`}
                className="block px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-green-50 hover:text-[#3DA535]"
              >
                {service.title}
              </Link>
            ))}
            <div className="mx-4 my-1 border-t border-gray-100" />
            <Link
              href="/services"
              className="block px-4 py-2.5 text-sm font-semibold text-[#3DA535] transition-colors hover:bg-green-50"
            >
              View All Services →
            </Link>
          </div>
        </div>
      )}
    </li>
  )
}

export function ServicesAccordionMobile({ services: rawServices }: ServicesDropdownProps) {
  const services = sortServices(rawServices)
  const [expanded, setExpanded] = useState(false)

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between text-base font-medium text-gray-800 hover:text-[#1B2B5B]"
        type="button"
      >
        Residential Painting
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && (
        <div className="mt-2 flex flex-col gap-2 pl-4">
          {services.map((service) => (
            <Link
              key={service.slug}
              href={`/services/${service.slug}`}
              className="text-sm text-gray-600 hover:text-[#3DA535]"
            >
              {service.title}
            </Link>
          ))}
          <Link href="/services" className="text-sm font-semibold text-[#3DA535]">
            View All Services →
          </Link>
        </div>
      )}
    </div>
  )
}
