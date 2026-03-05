import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReviewRequestForm } from '../review-request-form'

describe('ReviewRequestForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders form fields', () => {
    render(<ReviewRequestForm />)

    expect(screen.getByLabelText('Customer Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Phone Number')).toBeInTheDocument()
    expect(screen.getByLabelText('Review Platform')).toBeInTheDocument()
    expect(screen.getByLabelText('Review URL')).toBeInTheDocument()
    expect(screen.getByLabelText('Custom Message (optional)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create Request' })).toBeInTheDocument()
  })

  it('submits form data to API', async () => {
    const onCreated = vi.fn()
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'rr-new', status: 'pending' }),
    })
    global.fetch = mockFetch

    const user = userEvent.setup()
    render(<ReviewRequestForm onCreated={onCreated} />)

    await user.type(screen.getByLabelText('Customer Name'), 'John Smith')
    await user.type(screen.getByLabelText('Phone Number'), '+12015551234')
    await user.type(screen.getByLabelText('Review URL'), 'https://g.page/review')
    await user.click(screen.getByRole('button', { name: 'Create Request' }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/reviews/requests', expect.any(Object))
    })

    await waitFor(() => {
      expect(screen.getByText(/Review request created/)).toBeInTheDocument()
    })

    expect(onCreated).toHaveBeenCalledOnce()
  })

  it('shows error on API failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Validation failed' }),
    })

    const user = userEvent.setup()
    render(<ReviewRequestForm />)

    await user.type(screen.getByLabelText('Customer Name'), 'John')
    await user.type(screen.getByLabelText('Review URL'), 'https://g.page/review')
    await user.click(screen.getByRole('button', { name: 'Create Request' }))

    await waitFor(() => {
      expect(screen.getByText('Validation failed')).toBeInTheDocument()
    })
  })

  it('disables submit when name is empty', () => {
    render(<ReviewRequestForm />)

    const submitButton = screen.getByRole('button', { name: 'Create Request' })
    expect(submitButton).toBeDisabled()
  })

  it('disables submit when URL is empty', async () => {
    const user = userEvent.setup()
    render(<ReviewRequestForm />)

    await user.type(screen.getByLabelText('Customer Name'), 'John')

    const submitButton = screen.getByRole('button', { name: 'Create Request' })
    expect(submitButton).toBeDisabled()
  })

  it('shows character limit hint for custom message', () => {
    render(<ReviewRequestForm />)

    expect(screen.getByText(/Max 320 characters/)).toBeInTheDocument()
  })
})
