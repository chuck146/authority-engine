import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Ga4TrafficTrend } from '../ga4-traffic-trend'
import { buildGa4TrafficTrendPoint } from '@/tests/factories'

describe('Ga4TrafficTrend', () => {
  it('renders trend bars with dates', () => {
    const data = [
      buildGa4TrafficTrendPoint({ date: '2026-03-01', sessions: 100 }),
      buildGa4TrafficTrendPoint({ date: '2026-03-02', sessions: 120 }),
    ]
    render(<Ga4TrafficTrend data={data} />)

    expect(screen.getByText('Traffic Trend (28 Days)')).toBeInTheDocument()
    expect(screen.getByText('03-01')).toBeInTheDocument()
    expect(screen.getByText('03-02')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('120')).toBeInTheDocument()
  })

  it('shows empty state when no data', () => {
    render(<Ga4TrafficTrend data={[]} />)

    expect(screen.getByText('Traffic Trend (28 Days)')).toBeInTheDocument()
    expect(screen.getByText('No trend data available yet.')).toBeInTheDocument()
  })
})
