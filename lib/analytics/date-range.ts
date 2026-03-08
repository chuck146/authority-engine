import type { DateRange, DateRangePreset } from '@/types/analytics'

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]!
}

function subtractDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() - days)
  return result
}

const PRESET_DAYS: Record<Exclude<DateRangePreset, 'custom'>, number> = {
  '7d': 7,
  '28d': 28,
  '90d': 90,
}

const MAX_DAYS = 365

export type ResolvedDateRange = {
  current: DateRange
  previous: DateRange
}

export function resolveDateRange(
  preset: DateRangePreset,
  startDate?: string,
  endDate?: string,
): ResolvedDateRange {
  const yesterday = subtractDays(new Date(), 1)

  if (preset === 'custom') {
    if (!startDate || !endDate) {
      throw new Error('startDate and endDate are required for custom date range')
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid date format')
    }

    if (start > end) {
      throw new Error('startDate must be before endDate')
    }

    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

    if (daysDiff > MAX_DAYS) {
      throw new Error(`Date range cannot exceed ${MAX_DAYS} days`)
    }

    const prevEnd = subtractDays(start, 1)
    const prevStart = subtractDays(prevEnd, daysDiff - 1)

    return {
      current: { startDate, endDate },
      previous: { startDate: formatDate(prevStart), endDate: formatDate(prevEnd) },
    }
  }

  const days = PRESET_DAYS[preset]
  const currentEnd = yesterday
  const currentStart = subtractDays(currentEnd, days - 1)

  const prevEnd = subtractDays(currentStart, 1)
  const prevStart = subtractDays(prevEnd, days - 1)

  return {
    current: { startDate: formatDate(currentStart), endDate: formatDate(currentEnd) },
    previous: { startDate: formatDate(prevStart), endDate: formatDate(prevEnd) },
  }
}
