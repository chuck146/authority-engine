import { describe, it, expect, vi } from 'vitest'
import { getKeywordRankings, getKeywordTrend } from '../keyword-rankings'

function createMockSupabase(data: Record<string, unknown[]>) {
  let callCount = 0

  const chainBuilder = () => {
    const chain: Record<string, ReturnType<typeof vi.fn>> = {}
    chain.select = vi.fn().mockReturnValue(chain)
    chain.eq = vi.fn().mockReturnValue(chain)
    chain.gte = vi.fn().mockReturnValue(chain)
    chain.lte = vi.fn().mockReturnValue(chain)
    chain.ilike = vi.fn().mockReturnValue(chain)
    chain.order = vi.fn().mockReturnValue(chain)

    // Make the chain thenable to resolve with data
    const keys = Object.keys(data)
    const currentCallIndex = callCount++
    const key = keys[currentCallIndex] ?? keys[0]!

    // Override the chain's then-ability
    Object.defineProperty(chain, 'then', {
      value: (resolve: (val: { data: unknown[]; error: null }) => void) => {
        resolve({ data: data[key] ?? [], error: null })
      },
    })

    return chain
  }

  return {
    from: vi.fn().mockImplementation(() => chainBuilder()),
  } as never
}

describe('getKeywordRankings', () => {
  it('aggregates and paginates keyword rankings', async () => {
    const mockData = {
      current: [
        { query: 'painting nj', clicks: 50, impressions: 1000, ctr: 0.05, position: 8 },
        { query: 'painting nj', clicks: 30, impressions: 800, ctr: 0.038, position: 9 },
        { query: 'house painter', clicks: 20, impressions: 500, ctr: 0.04, position: 12 },
      ],
      previous: [
        { query: 'painting nj', position: 10 },
        { query: 'house painter', position: 11 },
      ],
    }

    const supabase = createMockSupabase(mockData)

    const result = await getKeywordRankings(
      supabase,
      'org-123',
      { startDate: '2026-02-08', endDate: '2026-03-07' },
      { startDate: '2026-01-11', endDate: '2026-02-07' },
      { sort: 'clicks', order: 'desc', page: 1, pageSize: 25 },
    )

    expect(result.items.length).toBe(2)
    expect(result.total).toBe(2)
    // First item should be 'painting nj' (more clicks)
    expect(result.items[0]!.query).toBe('painting nj')
    expect(result.items[0]!.totalClicks).toBe(80) // 50 + 30
    expect(result.items[0]!.totalImpressions).toBe(1800) // 1000 + 800
  })

  it('applies search filter', async () => {
    const supabase = createMockSupabase({
      current: [{ query: 'painting nj', clicks: 50, impressions: 1000, ctr: 0.05, position: 8 }],
      previous: [],
    })

    const result = await getKeywordRankings(
      supabase,
      'org-123',
      { startDate: '2026-02-08', endDate: '2026-03-07' },
      { startDate: '2026-01-11', endDate: '2026-02-07' },
      { sort: 'clicks', order: 'desc', page: 1, pageSize: 25, search: 'painting' },
    )

    expect(result.items.length).toBe(1)
  })

  it('returns empty for no data', async () => {
    const supabase = createMockSupabase({
      current: [],
      previous: [],
    })

    const result = await getKeywordRankings(
      supabase,
      'org-123',
      { startDate: '2026-02-08', endDate: '2026-03-07' },
      { startDate: '2026-01-11', endDate: '2026-02-07' },
      { sort: 'clicks', order: 'desc', page: 1, pageSize: 25 },
    )

    expect(result.items).toEqual([])
    expect(result.total).toBe(0)
  })
})

describe('getKeywordTrend', () => {
  it('returns daily trend for a keyword', async () => {
    const supabase = createMockSupabase({
      trend: [
        { date: '2026-03-05', clicks: 10, impressions: 200, position: 8 },
        { date: '2026-03-06', clicks: 12, impressions: 250, position: 7.5 },
        { date: '2026-03-07', clicks: 15, impressions: 300, position: 7 },
      ],
    })

    const result = await getKeywordTrend(supabase, 'org-123', 'painting nj', {
      startDate: '2026-03-05',
      endDate: '2026-03-07',
    })

    expect(result.length).toBe(3)
    expect(result[0]!.date).toBe('2026-03-05')
    expect(result[2]!.date).toBe('2026-03-07')
    expect(result[2]!.clicks).toBe(15)
  })

  it('aggregates multiple entries per date', async () => {
    const supabase = createMockSupabase({
      trend: [
        { date: '2026-03-05', clicks: 5, impressions: 100, position: 8 },
        { date: '2026-03-05', clicks: 7, impressions: 150, position: 10 },
      ],
    })

    const result = await getKeywordTrend(supabase, 'org-123', 'painting nj', {
      startDate: '2026-03-05',
      endDate: '2026-03-05',
    })

    expect(result.length).toBe(1)
    expect(result[0]!.clicks).toBe(12) // 5 + 7
    expect(result[0]!.position).toBe(9) // avg of 8, 10
  })
})
