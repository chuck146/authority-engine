import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SeoScoreBadge } from '../seo-score-badge'

describe('SeoScoreBadge', () => {
  it('renders -- for null score', () => {
    render(<SeoScoreBadge score={null} />)
    expect(screen.getByText('--')).toBeInTheDocument()
  })

  it('renders score/100 format', () => {
    render(<SeoScoreBadge score={72} />)
    expect(screen.getByText('72/100')).toBeInTheDocument()
  })

  it('shows label when showLabel is true', () => {
    render(<SeoScoreBadge score={85} showLabel />)
    expect(screen.getByText(/85\/100/)).toBeInTheDocument()
    expect(screen.getByText(/Excellent/)).toBeInTheDocument()
  })

  it('applies green color for scores >= 80', () => {
    const { container } = render(<SeoScoreBadge score={90} />)
    const badge = container.querySelector('[class*="bg-green"]')
    expect(badge).toBeInTheDocument()
  })

  it('applies yellow color for scores 60-79', () => {
    const { container } = render(<SeoScoreBadge score={65} />)
    const badge = container.querySelector('[class*="bg-yellow"]')
    expect(badge).toBeInTheDocument()
  })

  it('applies orange color for scores 40-59', () => {
    const { container } = render(<SeoScoreBadge score={45} />)
    const badge = container.querySelector('[class*="bg-orange"]')
    expect(badge).toBeInTheDocument()
  })

  it('applies red color for scores below 40', () => {
    const { container } = render(<SeoScoreBadge score={20} />)
    const badge = container.querySelector('[class*="bg-red"]')
    expect(badge).toBeInTheDocument()
  })

  it('shows correct label text for each tier', () => {
    const { rerender } = render(<SeoScoreBadge score={85} showLabel />)
    expect(screen.getByText(/Excellent/)).toBeInTheDocument()

    rerender(<SeoScoreBadge score={65} showLabel />)
    expect(screen.getByText(/Good/)).toBeInTheDocument()

    rerender(<SeoScoreBadge score={45} showLabel />)
    expect(screen.getByText(/Needs Work/)).toBeInTheDocument()

    rerender(<SeoScoreBadge score={20} showLabel />)
    expect(screen.getByText(/Poor/)).toBeInTheDocument()
  })
})
