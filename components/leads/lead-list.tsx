'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { LeadStatusBadge } from './lead-status-badge'
import { LeadScoreBadge } from './lead-score-badge'
import { LeadDetailSheet } from './lead-detail-sheet'
import type { LeadListItem, LeadStatus, LeadSource } from '@/types/leads'

type LeadListProps = {
  refreshKey?: number
}

export function LeadList({ refreshKey }: LeadListProps) {
  const [items, setItems] = useState<LeadListItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [limit] = useState(25)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      sortBy,
      sortDir,
    })
    if (search) params.set('search', search)
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (sourceFilter !== 'all') params.set('source', sourceFilter)

    try {
      const res = await fetch(`/api/v1/leads?${params}`)
      if (res.ok) {
        const data = await res.json()
        setItems(data.items)
        setTotal(data.total)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [page, limit, search, statusFilter, sourceFilter, sortBy, sortDir])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads, refreshKey])

  function handleSort(col: string) {
    if (sortBy === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(col)
      setSortDir('desc')
    }
  }

  function handleRowClick(id: string) {
    setSelectedId(id)
    setSheetOpen(true)
  }

  const totalPages = Math.ceil(total / limit)
  const statuses: LeadStatus[] = ['new', 'contacted', 'qualified', 'proposed', 'won', 'lost']
  const sources: LeadSource[] = ['website', 'phone', 'referral', 'gbp', 'facebook', 'other']

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search name, email, phone..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          className="w-64"
        />
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statuses.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={sourceFilter}
          onValueChange={(v) => {
            setSourceFilter(v)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {sources.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-muted-foreground text-sm">Loading leads...</p>
      ) : items.length === 0 ? (
        <div className="rounded-md border p-8 text-center">
          <p className="text-muted-foreground">
            No leads yet. Leads from your website form will appear here.
          </p>
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                  Name {sortBy === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead>Service</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('status')}>
                  Status {sortBy === 'status' && (sortDir === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('score')}>
                  Score {sortBy === 'score' && (sortDir === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('created_at')}>
                  Created {sortBy === 'created_at' && (sortDir === 'asc' ? '↑' : '↓')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow
                  key={item.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(item.id)}
                >
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-muted-foreground">{item.service ?? '—'}</TableCell>
                  <TableCell>
                    <LeadStatusBadge status={item.status} />
                  </TableCell>
                  <TableCell>
                    <LeadScoreBadge score={item.score} scoreLabel={item.scoreLabel} />
                  </TableCell>
                  <TableCell className="capitalize text-muted-foreground">{item.source}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm">
                {total} lead{total !== 1 ? 's' : ''} total
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <LeadDetailSheet
        leadId={selectedId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onUpdated={fetchLeads}
      />
    </div>
  )
}
