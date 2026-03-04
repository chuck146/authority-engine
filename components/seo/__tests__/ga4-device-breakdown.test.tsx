import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Ga4DeviceBreakdownCards } from '../ga4-device-breakdown'
import { buildGa4DeviceBreakdown } from '@/tests/factories'

describe('Ga4DeviceBreakdownCards', () => {
  it('renders device cards with percentages', () => {
    const devices = [
      buildGa4DeviceBreakdown({ deviceCategory: 'desktop', sessions: 1600, percentage: 50 }),
      buildGa4DeviceBreakdown({ deviceCategory: 'mobile', sessions: 1200, percentage: 37.5 }),
      buildGa4DeviceBreakdown({ deviceCategory: 'tablet', sessions: 400, percentage: 12.5 }),
    ]
    render(<Ga4DeviceBreakdownCards devices={devices} />)

    expect(screen.getByText('Device Breakdown')).toBeInTheDocument()
    expect(screen.getByText('Desktop')).toBeInTheDocument()
    expect(screen.getByText('Mobile')).toBeInTheDocument()
    expect(screen.getByText('Tablet')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.getByText('37.5%')).toBeInTheDocument()
    expect(screen.getByText('12.5%')).toBeInTheDocument()
  })

  it('shows empty state when no devices', () => {
    render(<Ga4DeviceBreakdownCards devices={[]} />)

    expect(screen.getByText('Device Breakdown')).toBeInTheDocument()
    expect(screen.getByText('No device data available yet.')).toBeInTheDocument()
  })

  it('falls back to raw category name when unknown', () => {
    const devices = [
      buildGa4DeviceBreakdown({ deviceCategory: 'smart_tv', sessions: 50, percentage: 100 }),
    ]
    render(<Ga4DeviceBreakdownCards devices={devices} />)

    expect(screen.getByText('smart_tv')).toBeInTheDocument()
  })
})
