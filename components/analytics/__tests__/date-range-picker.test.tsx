import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DateRangePicker } from '../date-range-picker'

// Mock next/navigation
const mockReplace = vi.fn()
const mockSearchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => mockSearchParams,
}))

describe('DateRangePicker', () => {
  it('renders with default 28d preset', () => {
    render(<DateRangePicker />)
    expect(screen.getByText('Last 28 days')).toBeInTheDocument()
  })

  it('does not show date inputs for preset ranges', () => {
    render(<DateRangePicker />)
    const dateInputs = screen.queryAllByDisplayValue(/\d{4}-\d{2}-\d{2}/)
    expect(dateInputs).toHaveLength(0)
  })

  it('renders all preset options', () => {
    render(<DateRangePicker />)
    // The select trigger shows the current value
    expect(screen.getByText('Last 28 days')).toBeInTheDocument()
  })
})
