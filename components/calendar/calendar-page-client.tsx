'use client'

import { useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CalendarGrid } from './calendar-grid'
import { ScheduleDialog } from './schedule-dialog'
import type { CalendarViewItem } from '@/types/calendar'

type CalendarPageClientProps = {
  initialItems: CalendarViewItem[]
  initialMonth: number
  initialYear: number
  userRole: string
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
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

        {canSchedule && (
          <Button onClick={() => setScheduleOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Schedule Content
          </Button>
        )}
      </div>

      {/* Calendar grid */}
      <div className={loading ? 'opacity-50' : ''}>
        <CalendarGrid items={items} month={month} year={year} />
      </div>

      {/* Schedule dialog */}
      <ScheduleDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        onScheduled={() => fetchMonth(month, year)}
      />
    </div>
  )
}
