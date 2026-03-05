import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Ga4ConnectionStatus } from '../ga4-connection-status'

describe('Ga4ConnectionStatus', () => {
  it('shows connected badge with property ID', () => {
    render(<Ga4ConnectionStatus isConnected={true} propertyId="properties/123456" />)

    expect(screen.getByText('Connected')).toBeInTheDocument()
    expect(screen.getByText('properties/123456')).toBeInTheDocument()
  })

  it('shows connected badge without property ID', () => {
    render(<Ga4ConnectionStatus isConnected={true} propertyId={null} />)

    expect(screen.getByText('Connected')).toBeInTheDocument()
    expect(screen.queryByText('properties/')).not.toBeInTheDocument()
  })

  it('shows disconnected CTA with settings link', () => {
    render(<Ga4ConnectionStatus isConnected={false} propertyId={null} />)

    expect(screen.getByText('Google Analytics not connected')).toBeInTheDocument()
    expect(screen.getByText('Go to Settings')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to Settings' })).toHaveAttribute(
      'href',
      '/settings',
    )
  })
})
