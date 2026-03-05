import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ImageGenerateForm } from '../image-generate-form'

// Mock sonner
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ImageGenerateForm', () => {
  const mockOnGenerated = vi.fn()

  it('renders with blog thumbnail selected by default', () => {
    render(<ImageGenerateForm onGenerated={mockOnGenerated} />)

    expect(
      screen.getByText('Generate Image', { selector: '[data-slot="card-title"]' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Topic')).toBeInTheDocument()
  })

  it('shows loading state during generation', async () => {
    const user = userEvent.setup()
    mockFetch.mockImplementation(() => new Promise(() => {})) // never resolves

    render(<ImageGenerateForm onGenerated={mockOnGenerated} />)

    const topicInput = screen.getByLabelText('Topic')
    await user.type(topicInput, 'Choosing Paint Colors for Living Room')

    const submitButton = screen.getByRole('button', { name: /generate image/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/generating/i)).toBeInTheDocument()
    })
  })

  it('calls onGenerated after successful generation', async () => {
    const user = userEvent.setup()
    const mockResponse = {
      id: 'media-1',
      imageType: 'blog_thumbnail',
      filename: 'blog-test.png',
      storagePath: 'org/images/blog_thumbnail/abc.png',
      publicUrl: 'https://example.com/image.png',
      mimeType: 'image/png',
      sizeBytes: 102400,
      width: null,
      height: null,
      altText: 'Test image',
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    render(<ImageGenerateForm onGenerated={mockOnGenerated} />)

    const topicInput = screen.getByLabelText('Topic')
    await user.type(topicInput, 'Choosing Paint Colors for Living Room')

    const submitButton = screen.getByRole('button', { name: /generate image/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockOnGenerated).toHaveBeenCalledWith(mockResponse)
    })
  })

  it('shows error toast on failure', async () => {
    const user = userEvent.setup()
    const { toast } = await import('sonner')

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Gemini API error' }),
    })

    render(<ImageGenerateForm onGenerated={mockOnGenerated} />)

    const topicInput = screen.getByLabelText('Topic')
    await user.type(topicInput, 'Choosing Paint Colors for Living Room')

    const submitButton = screen.getByRole('button', { name: /generate image/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Gemini API error')
    })
  })
})
