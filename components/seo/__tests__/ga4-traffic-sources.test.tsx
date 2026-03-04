import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Ga4TrafficSources } from '../ga4-traffic-sources'
import { buildGa4TrafficSource } from '@/tests/factories'

describe('Ga4TrafficSources', () => {
  it('renders table with source data', () => {
    const sources = [
      buildGa4TrafficSource({ source: 'google', medium: 'organic', sessions: 1800, users: 1200 }),
      buildGa4TrafficSource({ source: '(direct)', medium: '(none)', sessions: 500, users: 400 }),
    ]
    render(<Ga4TrafficSources sources={sources} />)

    expect(screen.getByText('Traffic Sources')).toBeInTheDocument()
    expect(screen.getByText('google')).toBeInTheDocument()
    expect(screen.getByText('organic')).toBeInTheDocument()
    expect(screen.getByText('(direct)')).toBeInTheDocument()
    expect(screen.getByText('(none)')).toBeInTheDocument()
  })

  it('shows empty state when no sources', () => {
    render(<Ga4TrafficSources sources={[]} />)

    expect(screen.getByText('Traffic Sources')).toBeInTheDocument()
    expect(screen.getByText('No traffic source data available yet.')).toBeInTheDocument()
  })
})
