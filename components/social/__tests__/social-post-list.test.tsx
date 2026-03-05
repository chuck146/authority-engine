import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { SocialPostList } from '../social-post-list'

// Mock the detail component
vi.mock('../social-post-detail', () => ({
  SocialPostDetail: () => null,
}))

const mockPosts = [
  {
    id: 'sp-1',
    platform: 'gbp',
    postType: 'update',
    title: 'Spring Special',
    body: 'Check out our spring deals!',
    hashtags: [],
    status: 'review',
    mediaAssetId: null,
    createdAt: '2026-03-05T12:00:00Z',
  },
  {
    id: 'sp-2',
    platform: 'instagram',
    postType: 'update',
    title: null,
    body: 'Beautiful project reveal!',
    hashtags: ['painting', 'nj'],
    status: 'approved',
    mediaAssetId: 'media-1',
    createdAt: '2026-03-04T12:00:00Z',
  },
]

describe('SocialPostList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state initially', () => {
    global.fetch = vi.fn().mockReturnValue(new Promise(() => {}))
    render(<SocialPostList />)

    // Should show skeleton loading
    expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
  })

  it('renders posts after loading', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockPosts),
    })

    render(<SocialPostList />)

    await waitFor(() => {
      expect(screen.getByText('Spring Special')).toBeInTheDocument()
    })

    expect(screen.getByText('GBP')).toBeInTheDocument()
    expect(screen.getByText('Instagram')).toBeInTheDocument()
  })

  it('shows empty state when no posts', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    })

    render(<SocialPostList />)

    await waitFor(() => {
      expect(screen.getByText(/No posts yet/)).toBeInTheDocument()
    })
  })

  it('shows error state on fetch failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
    })

    render(<SocialPostList />)

    await waitFor(() => {
      expect(screen.getByText('Failed to load posts')).toBeInTheDocument()
    })
  })

  it('passes platform filter to API', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    })
    global.fetch = mockFetch

    render(<SocialPostList platform="instagram" />)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('platform=instagram'))
    })
  })

  it('renders title with platform filter', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockPosts),
    })

    render(<SocialPostList platform="gbp" />)

    await waitFor(() => {
      expect(screen.getByText('GBP Posts')).toBeInTheDocument()
    })
  })

  it('renders "All Posts" title without filter', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockPosts),
    })

    render(<SocialPostList />)

    await waitFor(() => {
      expect(screen.getByText('All Posts')).toBeInTheDocument()
    })
  })

  it('shows status badges', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockPosts),
    })

    render(<SocialPostList />)

    await waitFor(() => {
      expect(screen.getByText('review')).toBeInTheDocument()
      expect(screen.getByText('approved')).toBeInTheDocument()
    })
  })
})
