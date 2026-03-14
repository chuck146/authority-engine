'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MapPin, Search } from 'lucide-react'

type TownEntry = {
  name: string
  slug: string
  hasPage: boolean
  pageSlug?: string
}

type CountyGroup = {
  county: string
  towns: TownEntry[]
}

type LocationHubClientProps = {
  counties: CountyGroup[]
  totalTowns: number
}

export function LocationHubClient({ counties, totalTowns }: LocationHubClientProps) {
  const [search, setSearch] = useState('')

  const query = search.trim().toLowerCase()

  const filtered = query
    ? counties
        .map((group) => ({
          ...group,
          towns: group.towns.filter(
            (t) =>
              t.name.toLowerCase().includes(query) || group.county.toLowerCase().includes(query),
          ),
        }))
        .filter((group) => group.towns.length > 0)
    : counties

  return (
    <>
      {/* Search bar */}
      <div className="mx-auto mb-12 max-w-xl">
        <div className="relative">
          <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for your town or county..."
            className="w-full rounded-xl border border-gray-300 bg-white py-3.5 pr-4 pl-12 text-base shadow-sm transition-shadow placeholder:text-gray-400 focus:border-[var(--color-brand-green)] focus:ring-2 focus:ring-[var(--color-brand-green)]/20 focus:outline-none"
          />
        </div>
        {query && (
          <p className="mt-2 text-center text-sm text-gray-500">
            {filtered.reduce((sum, g) => sum + g.towns.length, 0)} towns found
          </p>
        )}
      </div>

      {/* County grid */}
      <div className="space-y-10">
        {filtered.map((group) => (
          <section key={group.county}>
            <h2 className="font-display mb-4 border-b border-gray-200 pb-2 text-xl font-semibold text-gray-900">
              {group.county} County
              <span className="ml-2 text-sm font-normal text-gray-400">
                {group.towns.length} {group.towns.length === 1 ? 'town' : 'towns'}
              </span>
            </h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {group.towns.map((town) =>
                town.hasPage && town.pageSlug ? (
                  <Link
                    key={town.slug}
                    href={`/locations/${town.pageSlug}`}
                    className="group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-[var(--color-brand-green)]/5"
                  >
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-[var(--color-brand-green)]" />
                    <span className="text-sm font-medium text-gray-900 group-hover:text-[var(--color-brand-green)]">
                      {town.name}
                    </span>
                  </Link>
                ) : (
                  <span key={town.slug} className="flex items-center gap-2 rounded-lg px-2 py-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-300" />
                    <span className="text-sm text-gray-500">{town.name}</span>
                  </span>
                ),
              )}
            </div>
          </section>
        ))}
      </div>

      {filtered.length === 0 && query && (
        <div className="py-12 text-center">
          <p className="text-lg text-gray-500">No results for &ldquo;{search}&rdquo;</p>
          <p className="mt-2 text-sm text-gray-400">Try a different town or county name</p>
        </div>
      )}

      {!query && (
        <p className="mt-8 text-center text-sm text-gray-400">
          Showing {totalTowns} towns across {counties.length} counties
        </p>
      )}
    </>
  )
}
