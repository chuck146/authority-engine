import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReviewEntryForm } from '../review-entry-form'

describe('ReviewEntryForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders form fields', () => {
    render(<ReviewEntryForm />)

    expect(screen.getByLabelText('Platform')).toBeInTheDocument()
    expect(screen.getByLabelText('Reviewer Name')).toBeInTheDocument()
    expect(screen.getByText('Rating')).toBeInTheDocument()
    expect(screen.getByLabelText('Review Text (optional)')).toBeInTheDocument()
    expect(screen.getByLabelText('Review Date')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add Review' })).toBeInTheDocument()
  })

  it('renders star rating buttons', () => {
    render(<ReviewEntryForm />)

    const starButtons = screen.getAllByLabelText(/stars$/)
    expect(starButtons.length).toBe(5)
  })

  it('submits form data to API', async () => {
    const onCreated = vi.fn()
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'new-review' }),
    })
    global.fetch = mockFetch

    const user = userEvent.setup()
    render(<ReviewEntryForm onCreated={onCreated} />)

    await user.type(screen.getByLabelText('Reviewer Name'), 'John Smith')
    await user.click(screen.getByRole('button', { name: 'Add Review' }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/reviews', expect.any(Object))
    })

    await waitFor(() => {
      expect(screen.getByText(/Review added successfully/)).toBeInTheDocument()
    })

    expect(onCreated).toHaveBeenCalledOnce()
  })

  it('shows error on API failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Server error' }),
    })

    const user = userEvent.setup()
    render(<ReviewEntryForm />)

    await user.type(screen.getByLabelText('Reviewer Name'), 'John Smith')
    await user.click(screen.getByRole('button', { name: 'Add Review' }))

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument()
    })
  })

  it('disables submit button when reviewer name is empty', () => {
    render(<ReviewEntryForm />)

    const submitButton = screen.getByRole('button', { name: 'Add Review' })
    expect(submitButton).toBeDisabled()
  })
})
