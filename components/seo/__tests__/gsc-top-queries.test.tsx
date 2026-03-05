import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { GscTopQueries } from '../gsc-top-queries'
import { buildKeywordRankingItem } from '@/tests/factories'

describe('GscTopQueries', () => {
  it('renders query table with data', () => {
    const queries = [
      buildKeywordRankingItem({
        query: 'painting nj',
        clicks: 85,
        position: 8.2,
        positionChange: 1.3,
      }),
      buildKeywordRankingItem({
        query: 'house painting',
        clicks: 42,
        position: 12.5,
        positionChange: -2.1,
      }),
    ]
    render(<GscTopQueries queries={queries} />)

    expect(screen.getByText('Top Queries')).toBeInTheDocument()
    expect(screen.getByText('painting nj')).toBeInTheDocument()
    expect(screen.getByText('house painting')).toBeInTheDocument()
    expect(screen.getByText('85')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('shows empty state when no queries', () => {
    render(<GscTopQueries queries={[]} />)
    expect(screen.getByText('No query data available yet.')).toBeInTheDocument()
  })

  it('shows position change indicators', () => {
    const queries = [buildKeywordRankingItem({ query: 'test', positionChange: 2.5 })]
    render(<GscTopQueries queries={queries} />)
    expect(screen.getByText(/↑2.5/)).toBeInTheDocument()
  })
})
