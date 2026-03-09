'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ContentPerformanceResponse, ContentPerformanceItem } from '@/types/analytics'

type SortField =
  | 'title'
  | 'seoScore'
  | 'sessions'
  | 'users'
  | 'pageviews'
  | 'bounceRate'
  | 'engagementRate'
  | 'publishedAt'

type ContentTypeFilter = 'all' | 'service_page' | 'location_page' | 'blog_post'

const TYPE_LABELS: Record<string, { label: string; className: string }> = {
  service_page: { label: 'Service', className: 'bg-blue-100 text-blue-800' },
  location_page: { label: 'Location', className: 'bg-purple-100 text-purple-800' },
  blog_post: { label: 'Blog', className: 'bg-teal-100 text-teal-800' },
}

function ContentTypeBadge({ type }: { type: string }) {
  const config = TYPE_LABELS[type]
  if (!config) return null
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}

function SeoScoreBadge({ score }: { score: number | null }) {
  if (score == null) return <span className="text-muted-foreground">—</span>
  const className =
    score >= 80
      ? 'bg-green-100 text-green-800'
      : score >= 60
        ? 'bg-yellow-100 text-yellow-800'
        : 'bg-red-100 text-red-800'
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-medium ${className}`}>{score}</span>
  )
}

function SortableHeader({
  label,
  field,
  currentSort,
  currentOrder,
  onSort,
  align = 'right',
}: {
  label: string
  field: SortField
  currentSort: SortField
  currentOrder: 'asc' | 'desc'
  onSort: (field: SortField) => void
  align?: 'left' | 'right'
}) {
  const isActive = currentSort === field
  const arrow = isActive ? (currentOrder === 'desc' ? ' ↓' : ' ↑') : ''
  return (
    <TableHead
      className={`cursor-pointer select-none hover:underline ${align === 'right' ? 'text-right' : ''}`}
      onClick={() => onSort(field)}
    >
      {label}
      {arrow}
    </TableHead>
  )
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function ContentPerformanceTable() {
  const searchParams = useSearchParams()
  const [data, setData] = useState<ContentPerformanceResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortField>('sessions')
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState<ContentTypeFilter>('all')

  const range = searchParams.get('range') ?? '28d'
  const startDate = searchParams.get('startDate') ?? ''
  const endDate = searchParams.get('endDate') ?? ''

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    const params = new URLSearchParams({
      range,
      sort,
      order,
      page: String(page),
      pageSize: '25',
      type: typeFilter,
    })
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    if (search) params.set('search', search)

    try {
      const res = await fetch(`/api/v1/analytics/content-performance?${params}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Failed to load content performance')
      }
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [range, startDate, endDate, sort, order, page, search, typeFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSort = (field: SortField) => {
    if (sort === field) {
      setOrder(order === 'desc' ? 'asc' : 'desc')
    } else {
      setSort(field)
      setOrder('desc')
    }
    setPage(1)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchData()
  }

  const handleTypeChange = (value: string) => {
    setTypeFilter(value as ContentTypeFilter)
    setPage(1)
  }

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Content Performance</CardTitle>
          <div className="flex gap-2">
            <Select value={typeFilter} onValueChange={handleTypeChange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="service_page">Service Pages</SelectItem>
                <SelectItem value="location_page">Location Pages</SelectItem>
                <SelectItem value="blog_post">Blog Posts</SelectItem>
              </SelectContent>
            </Select>
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder="Search by title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-[200px]"
              />
            </form>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-muted h-10 animate-pulse rounded" />
            ))}
          </div>
        )}

        {error && <p className="text-destructive text-sm">{error}</p>}

        {!loading && !error && data && data.items.length === 0 && (
          <p className="text-muted-foreground text-sm">
            No published content found. Publish content to see performance data.
          </p>
        )}

        {!loading && !error && data && data.items.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHeader
                      label="Title"
                      field="title"
                      currentSort={sort}
                      currentOrder={order}
                      onSort={handleSort}
                      align="left"
                    />
                    <TableHead>Type</TableHead>
                    <SortableHeader
                      label="SEO"
                      field="seoScore"
                      currentSort={sort}
                      currentOrder={order}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Sessions"
                      field="sessions"
                      currentSort={sort}
                      currentOrder={order}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Users"
                      field="users"
                      currentSort={sort}
                      currentOrder={order}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Pageviews"
                      field="pageviews"
                      currentSort={sort}
                      currentOrder={order}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Bounce"
                      field="bounceRate"
                      currentSort={sort}
                      currentOrder={order}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Engagement"
                      field="engagementRate"
                      currentSort={sort}
                      currentOrder={order}
                      onSort={handleSort}
                    />
                    <TableHead className="text-right">Top Keyword</TableHead>
                    <SortableHeader
                      label="Published"
                      field="publishedAt"
                      currentSort={sort}
                      currentOrder={order}
                      onSort={handleSort}
                    />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((item: ContentPerformanceItem) => (
                    <TableRow key={item.id}>
                      <TableCell className="max-w-[200px] truncate font-medium">
                        {item.title}
                      </TableCell>
                      <TableCell>
                        <ContentTypeBadge type={item.contentType} />
                      </TableCell>
                      <TableCell className="text-right">
                        <SeoScoreBadge score={item.seoScore} />
                      </TableCell>
                      <TableCell className="text-right">
                        {item.sessions.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.users.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.pageviews.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {(item.bounceRate * 100).toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right">
                        {(item.engagementRate * 100).toFixed(1)}%
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate text-right">
                        {item.topKeyword ? (
                          <span className="text-sm">{item.topKeyword}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatDate(item.publishedAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-muted-foreground text-sm">
                  Showing {(page - 1) * data.pageSize + 1}–
                  {Math.min(page * data.pageSize, data.total)} of {data.total}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
