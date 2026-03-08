'use client'

import { useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import type { DateRangePreset } from '@/types/analytics'

const PRESETS: { value: DateRangePreset; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '28d', label: 'Last 28 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'custom', label: 'Custom range' },
]

export function DateRangePicker() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const range = (searchParams.get('range') ?? '28d') as DateRangePreset
  const startDate = searchParams.get('startDate') ?? ''
  const endDate = searchParams.get('endDate') ?? ''

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      }
      router.replace(`?${params.toString()}`, { scroll: false })
    },
    [router, searchParams],
  )

  const handlePresetChange = (value: string) => {
    if (value === 'custom') {
      updateParams({ range: 'custom' })
    } else {
      updateParams({ range: value, startDate: '', endDate: '' })
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={range} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PRESETS.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {range === 'custom' && (
        <>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => updateParams({ startDate: e.target.value })}
            className="w-[160px]"
          />
          <span className="text-muted-foreground text-sm">to</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => updateParams({ endDate: e.target.value })}
            className="w-[160px]"
          />
        </>
      )}
    </div>
  )
}
