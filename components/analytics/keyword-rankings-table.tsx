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
import { KeywordTrendDetail } from './keyword-trend-detail'
import type { AnalyticsKeywordsResponse, KeywordRankingListItem } from '@/types/analytics'

type SortField = 'clicks' | 'impressions' | 'position' | 'ctr' | 'change'

function PositionChange({ change }: { change: number | null }) {
  if (change == null) return <span className="text-muted-foreground">—</span>
  if (change === 0) return <span className="text-muted-foreground">0</span>
  const isImproved = change > 0
  const color = isImproved ? 'text-green-600' : 'text-red-600'
  const arrow = isImproved ? '↑' : '↓'
  return (
    <span className={color}>
      {arrow}
      {Math.abs(change).toFixed(1)}
    </span>
  )
}

function SortableHeader({
  label,
  field,
  currentSort,
  currentOrder,
  onSort,
}: {
  label: string
  field: SortField
  currentSort: SortField
  currentOrder: 'asc' | 'desc'
  onSort: (field: SortField) => void
}) {
  const isActive = currentSort === field
  const arrow = isActive ? (currentOrder === 'desc' ? ' ↓' : ' ↑') : ''
  return (
    <TableHead
      className="cursor-pointer text-right select-none hover:underline"
      onClick={() => onSort(field)}
    >
      {label}
      {arrow}
    </TableHead>
  )
}

export function KeywordRankingsTable() {
  const searchParams = useSearchParams()
  const [data, setData] = useState<AnalyticsKeywordsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortField>('clicks')
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null)

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
    })
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    if (search) params.set('search', search)

    try {
      const res = await fetch(`/api/v1/analytics/keywords?${params}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Failed to load keyword rankings')
      }
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [range, startDate, endDate, sort, order, page, search])

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

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Keyword Rankings</CardTitle>
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder="Search keywords..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-[200px]"
              />
            </form>
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
              No keyword ranking data available. Data is populated by the daily GSC sync.
            </p>
          )}

          {!loading && !error && data && data.items.length > 0 && (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Query</TableHead>
                    <SortableHeader
                      label="Avg Position"
                      field="position"
                      currentSort={sort}
                      currentOrder={order}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Clicks"
                      field="clicks"
                      currentSort={sort}
                      currentOrder={order}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Impressions"
                      field="impressions"
                      currentSort={sort}
                      currentOrder={order}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="CTR"
                      field="ctr"
                      currentSort={sort}
                      currentOrder={order}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Change"
                      field="change"
                      currentSort={sort}
                      currentOrder={order}
                      onSort={handleSort}
                    />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((item: KeywordRankingListItem) => (
                    <TableRow
                      key={item.query}
                      className="hover:bg-muted/50 cursor-pointer"
                      onClick={() => setSelectedKeyword(item.query)}
                    >
                      <TableCell className="font-medium">{item.query}</TableCell>
                      <TableCell className="text-right">{item.avgPosition.toFixed(1)}</TableCell>
                      <TableCell className="text-right">{item.totalClicks}</TableCell>
                      <TableCell className="text-right">
                        {item.totalImpressions.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {(item.avgCtr * 100).toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right">
                        <PositionChange change={item.positionChange} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

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

      <KeywordTrendDetail query={selectedKeyword} onClose={() => setSelectedKeyword(null)} />
    </>
  )
}
