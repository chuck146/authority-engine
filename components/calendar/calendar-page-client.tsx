'use client'

import { useState, useCallback, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Plus, CalendarDays, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CalendarGrid } from './calendar-grid'
import { CalendarListView } from './calendar-list-view'
import { CalendarEntrySheet } from './calendar-entry-sheet'
import { ScheduleDialog } from './schedule-dialog'
import {
  contentTypeFullLabels,
  statusLabels,
  ALL_CONTENT_TYPES,
  ALL_CALENDAR_STATUSES,
} from './calendar-constants'
import type { CalendarViewItem, CalendarContentType, CalendarStatus } from '@/types/calendar'

type CalendarPageClientProps = {
  initialItems: CalendarViewItem[]
  initialMonth: number
  initialYear: number
  userRole: string
}

type ViewMode = 'month' | 'list'

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export function CalendarPageClient({
  initialItems,
  initialMonth,
  initialYear,
  userRole,
}: CalendarPageClientProps) {
  const [month, setMonth] = useState(initialMonth)
  const [year, setYear] = useState(initialYear)
  const [items, setItems] = useState(initialItems)
  const [loading, setLoading] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [view, setView] = useState<ViewMode>('month')

  // Detail sheet state
  const [selectedEntry, setSelectedEntry] = useState<CalendarViewItem | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  // Filter state
  const [typeFilter, setTypeFilter] = useState<CalendarContentType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<CalendarStatus | 'all'>('all')

  const canSchedule = ['owner', 'admin', 'editor'].includes(userRole)

  const fetchMonth = useCallback(async (m: number, y: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/calendar?month=${m}&year=${y}`)
      if (res.ok) {
        const data = await res.json()
        setItems(data)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (typeFilter !== 'all' && item.contentType !== typeFilter) return false
      if (statusFilter !== 'all' && item.status !== statusFilter) return false
      return true
    })
  }, [items, typeFilter, statusFilter])

  function navigateMonth(direction: -1 | 1) {
    let newMonth = month + direction
    let newYear = year

    if (newMonth < 1) {
      newMonth = 12
      newYear--
    } else if (newMonth > 12) {
      newMonth = 1
      newYear++
    }

    setMonth(newMonth)
    setYear(newYear)
    fetchMonth(newMonth, newYear)
  }

  function goToToday() {
    const now = new Date()
    const m = now.getMonth() + 1
    const y = now.getFullYear()
    setMonth(m)
    setYear(y)
    fetchMonth(m, y)
  }

  function handleEntryClick(item: CalendarViewItem) {
    setSelectedEntry(item)
    setSheetOpen(true)
  }

  return (
    <div className="space-y-4">
      {/* Calendar header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateMonth(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="min-w-[180px] text-center text-lg font-semibold">
            {MONTH_NAMES[month - 1]} {year}
          </h2>
          <Button variant="outline" size="icon" onClick={() => navigateMonth(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={goToToday}>
            Today
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-md border">
            <Button
              variant={view === 'month' ? 'secondary' : 'ghost'}
              size="icon"
              className="rounded-r-none"
              onClick={() => setView('month')}
              aria-label="Month view"
            >
              <CalendarDays className="h-4 w-4" />
            </Button>
            <Button
              variant={view === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="rounded-l-none"
              onClick={() => setView('list')}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {canSchedule && (
            <Button onClick={() => setScheduleOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Schedule Content
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as CalendarContentType | 'all')}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {ALL_CONTENT_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {contentTypeFullLabels[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as CalendarStatus | 'all')}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {ALL_CALENDAR_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {statusLabels[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Calendar view */}
      <div className={loading ? 'opacity-50' : ''}>
        {view === 'month' ? (
          <CalendarGrid
            items={filteredItems}
            month={month}
            year={year}
            onEntryClick={handleEntryClick}
          />
        ) : (
          <CalendarListView items={filteredItems} onEntryClick={handleEntryClick} />
        )}
      </div>

      {/* Schedule dialog */}
      <ScheduleDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        onScheduled={() => fetchMonth(month, year)}
      />

      {/* Entry detail sheet */}
      <CalendarEntrySheet
        item={selectedEntry}
        userRole={userRole}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onEntryUpdated={() => fetchMonth(month, year)}
      />
    </div>
  )
}
