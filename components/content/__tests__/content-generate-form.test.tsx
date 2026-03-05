import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ContentGenerateForm } from '../content-generate-form'
import { buildStructuredContent } from '@/tests/factories'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const { toast } = await import('sonner')

function mockFetchSuccess() {
  const content = buildStructuredContent()
  return vi.fn().mockResolvedValue({
    ok: true,
    json: () =>
      Promise.resolve({
        id: 'gen-1',
        contentType: 'service_page',
        title: 'Interior Painting',
        slug: 'interior-painting',
        content,
        status: 'review',
      }),
  })
}

describe('ContentGenerateForm', () => {
  const mockOnGenerated = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', vi.fn())
  })

  it('renders the form card title', () => {
    render(<ContentGenerateForm onGenerated={mockOnGenerated} />)
    expect(
      screen.getByText('Generate Content', { selector: '[data-slot="card-title"]' }),
    ).toBeInTheDocument()
  })

  it('renders the Generate Content submit button', () => {
    render(<ContentGenerateForm onGenerated={mockOnGenerated} />)
    expect(screen.getByRole('button', { name: /Generate Content/ })).toBeInTheDocument()
  })

  it('shows service page fields by default', () => {
    render(<ContentGenerateForm onGenerated={mockOnGenerated} />)
    expect(screen.getByPlaceholderText('e.g., Interior Painting')).toBeInTheDocument()
    expect(
      screen.getByPlaceholderText('Brief description of what this service includes...'),
    ).toBeInTheDocument()
  })

  it('shows tone and keywords fields', () => {
    render(<ContentGenerateForm onGenerated={mockOnGenerated} />)
    expect(screen.getByText('Tone')).toBeInTheDocument()
    expect(screen.getByText(/Target Keywords/)).toBeInTheDocument()
  })

  it('calls fetch with POST on submit', async () => {
    const user = userEvent.setup()
    const fetchMock = mockFetchSuccess()
    vi.stubGlobal('fetch', fetchMock)

    render(<ContentGenerateForm onGenerated={mockOnGenerated} />)

    await user.type(screen.getByPlaceholderText('e.g., Interior Painting'), 'Interior Painting')
    await user.click(screen.getByRole('button', { name: /Generate Content/ }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/v1/content/generate',
        expect.objectContaining({ method: 'POST' }),
      )
    })
  })

  it('shows success toast on successful generation', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', mockFetchSuccess())

    render(<ContentGenerateForm onGenerated={mockOnGenerated} />)

    await user.type(screen.getByPlaceholderText('e.g., Interior Painting'), 'Interior Painting')
    await user.click(screen.getByRole('button', { name: /Generate Content/ }))

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Content generated successfully! Review it below.')
    })
  })

  it('calls onGenerated with content list item', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', mockFetchSuccess())

    render(<ContentGenerateForm onGenerated={mockOnGenerated} />)

    await user.type(screen.getByPlaceholderText('e.g., Interior Painting'), 'Interior Painting')
    await user.click(screen.getByRole('button', { name: /Generate Content/ }))

    await waitFor(() => {
      expect(mockOnGenerated).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'gen-1',
          type: 'service_page',
          title: 'Interior Painting',
          slug: 'interior-painting',
          status: 'review',
        }),
      )
    })
  })

  it('shows error toast when API returns error', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Rate limit exceeded' }),
      }),
    )

    render(<ContentGenerateForm onGenerated={mockOnGenerated} />)

    await user.type(screen.getByPlaceholderText('e.g., Interior Painting'), 'Interior Painting')
    await user.click(screen.getByRole('button', { name: /Generate Content/ }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Rate limit exceeded')
    })
  })

  it('shows error toast on network failure', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    render(<ContentGenerateForm onGenerated={mockOnGenerated} />)

    await user.type(screen.getByPlaceholderText('e.g., Interior Painting'), 'Interior Painting')
    await user.click(screen.getByRole('button', { name: /Generate Content/ }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to fetch')
    })
  })

  it('shows loading state during generation', async () => {
    const user = userEvent.setup()
    // Mock fetch that never resolves
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {})),
    )

    render(<ContentGenerateForm onGenerated={mockOnGenerated} />)

    await user.type(screen.getByPlaceholderText('e.g., Interior Painting'), 'Interior Painting')
    await user.click(screen.getByRole('button', { name: /Generate Content/ }))

    await waitFor(() => {
      expect(screen.getByText(/Generating/)).toBeInTheDocument()
    })
  })

  it('renders preview after successful generation', async () => {
    const user = userEvent.setup()
    vi.stubGlobal('fetch', mockFetchSuccess())

    render(<ContentGenerateForm onGenerated={mockOnGenerated} />)

    await user.type(screen.getByPlaceholderText('e.g., Interior Painting'), 'Interior Painting')
    await user.click(screen.getByRole('button', { name: /Generate Content/ }))

    await waitFor(() => {
      expect(screen.getByText(/Preview:/)).toBeInTheDocument()
    })
  })
})
