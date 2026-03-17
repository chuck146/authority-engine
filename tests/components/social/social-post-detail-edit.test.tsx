import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { SocialPostDetail } from '@/components/social/social-post-detail'
import { buildSocialPostDetail } from '@/tests/factories'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('SocialPostDetail — Edit Mode', () => {
  const defaultProps = {
    postId: 'social-1',
    onClose: vi.fn(),
    onStatusChange: vi.fn(),
  }

  function renderWithPost(overrides?: Parameters<typeof buildSocialPostDetail>[0]) {
    const post = buildSocialPostDetail(overrides)
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(post),
    })
    return post
  }

  it('shows Edit button for posts in review status', async () => {
    renderWithPost({ status: 'review' })
    await act(async () => {
      render(<SocialPostDetail {...defaultProps} />)
    })
    expect(screen.getByText('Edit')).toBeDefined()
  })

  it('shows Edit button for posts in draft status', async () => {
    renderWithPost({ status: 'draft' })
    await act(async () => {
      render(<SocialPostDetail {...defaultProps} />)
    })
    expect(screen.getByText('Edit')).toBeDefined()
  })

  it('does NOT show Edit button for published posts', async () => {
    renderWithPost({ status: 'published' })
    await act(async () => {
      render(<SocialPostDetail {...defaultProps} />)
    })
    expect(screen.queryByText('Edit')).toBeNull()
  })

  it('does NOT show Edit button for archived posts', async () => {
    renderWithPost({ status: 'archived' })
    await act(async () => {
      render(<SocialPostDetail {...defaultProps} />)
    })
    expect(screen.queryByText('Edit')).toBeNull()
  })

  it('clicking Edit enters edit mode with form fields', async () => {
    renderWithPost({ status: 'review', body: 'Test post body' })
    await act(async () => {
      render(<SocialPostDetail {...defaultProps} />)
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Edit'))
    })

    // Form fields should be visible
    expect(screen.getByLabelText('Title')).toBeDefined()
    expect(screen.getByLabelText('Body')).toBeDefined()
    expect(screen.getByLabelText('Hashtags')).toBeDefined()
    expect(screen.getByText('Save Changes')).toBeDefined()
    expect(screen.getByText('Cancel')).toBeDefined()
  })

  it('form fields populate from post data', async () => {
    renderWithPost({
      status: 'review',
      title: 'My Title',
      body: 'My body text',
      ctaType: 'BOOK',
      ctaUrl: 'https://example.com',
    })
    await act(async () => {
      render(<SocialPostDetail {...defaultProps} />)
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Edit'))
    })

    const titleInput = screen.getByLabelText('Title') as HTMLInputElement
    const bodyInput = screen.getByLabelText('Body') as HTMLTextAreaElement

    expect(titleInput.value).toBe('My Title')
    expect(bodyInput.value).toBe('My body text')
  })

  it('Cancel exits edit mode without saving', async () => {
    renderWithPost({ status: 'review' })
    await act(async () => {
      render(<SocialPostDetail {...defaultProps} />)
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Edit'))
    })

    expect(screen.getByText('Save Changes')).toBeDefined()

    await act(async () => {
      fireEvent.click(screen.getByText('Cancel'))
    })

    // Should be back in read-only mode
    expect(screen.queryByText('Save Changes')).toBeNull()
    expect(screen.getByText('Edit')).toBeDefined()
  })

  it('Save calls PUT with edited data', async () => {
    const post = renderWithPost({ status: 'review', body: 'Original body' })

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(post) }) // initial load
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ...post, body: 'Edited body' }),
      }) // PUT save

    global.fetch = fetchMock

    await act(async () => {
      render(<SocialPostDetail {...defaultProps} />)
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Edit'))
    })

    const bodyInput = screen.getByLabelText('Body') as HTMLTextAreaElement
    await act(async () => {
      fireEvent.change(bodyInput, { target: { value: 'Edited body' } })
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Save Changes'))
    })

    // Check PUT was called
    const putCall = fetchMock.mock.calls.find(
      (call) => typeof call[1] === 'object' && call[1]?.method === 'PUT',
    )
    expect(putCall).toBeDefined()

    const putBody = JSON.parse(putCall![1]!.body as string)
    expect(putBody.body).toBe('Edited body')
  })

  it('edit mode hides approve/reject buttons', async () => {
    renderWithPost({ status: 'review' })
    await act(async () => {
      render(<SocialPostDetail {...defaultProps} />)
    })

    // Approve should be visible in read-only mode
    expect(screen.getByText('Approve')).toBeDefined()

    await act(async () => {
      fireEvent.click(screen.getByText('Edit'))
    })

    // Approve should NOT be visible in edit mode
    expect(screen.queryByText('Approve')).toBeNull()
    expect(screen.queryByText('Reject')).toBeNull()
  })

  it('body textarea updates character count in live preview', async () => {
    renderWithPost({ status: 'review', body: 'Short' })
    await act(async () => {
      render(<SocialPostDetail {...defaultProps} />)
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Edit'))
    })

    const bodyInput = screen.getByLabelText('Body') as HTMLTextAreaElement
    await act(async () => {
      fireEvent.change(bodyInput, { target: { value: 'A much longer body text for testing' } })
    })

    // Character count should reflect the new body
    expect(screen.getByText('35 / 2,200 characters')).toBeDefined()
  })
})
