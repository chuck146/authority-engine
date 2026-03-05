import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SocialGenerateForm } from '../social-generate-form'

describe('SocialGenerateForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  it('renders form with platform selector', () => {
    render(<SocialGenerateForm />)

    expect(screen.getByLabelText('Platform')).toBeInTheDocument()
    expect(screen.getByLabelText(/Topic/)).toBeInTheDocument()
    expect(screen.getByLabelText('Tone')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Generate Post' })).toBeInTheDocument()
  })

  it('disables submit button when topic is empty', () => {
    render(<SocialGenerateForm />)

    const button = screen.getByRole('button', { name: 'Generate Post' })
    expect(button).toBeDisabled()
  })

  it('enables submit button when topic is filled', async () => {
    const user = userEvent.setup()
    render(<SocialGenerateForm />)

    await user.type(screen.getByLabelText(/Topic/), 'Spring painting special')

    const button = screen.getByRole('button', { name: 'Generate Post' })
    expect(button).not.toBeDisabled()
  })

  it('shows keywords input', () => {
    render(<SocialGenerateForm />)

    expect(screen.getByLabelText(/Keywords/)).toBeInTheDocument()
  })

  it('shows generate image checkbox', () => {
    render(<SocialGenerateForm />)

    expect(screen.getByLabelText(/Generate accompanying image/)).toBeInTheDocument()
  })

  it('shows success message after successful generation', async () => {
    const user = userEvent.setup()
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'sp-1' }),
    })
    global.fetch = mockFetch

    render(<SocialGenerateForm />)

    await user.type(screen.getByLabelText(/Topic/), 'Spring painting special')
    await user.click(screen.getByRole('button', { name: 'Generate Post' }))

    expect(await screen.findByText(/Post generated successfully/)).toBeInTheDocument()
  })

  it('shows error message on failure', async () => {
    const user = userEvent.setup()
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Generation failed' }),
    })
    global.fetch = mockFetch

    render(<SocialGenerateForm />)

    await user.type(screen.getByLabelText(/Topic/), 'Spring painting special')
    await user.click(screen.getByRole('button', { name: 'Generate Post' }))

    expect(await screen.findByText('Generation failed')).toBeInTheDocument()
  })

  it('calls onGenerated callback after successful generation', async () => {
    const user = userEvent.setup()
    const onGenerated = vi.fn()
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'sp-1' }),
    })

    render(<SocialGenerateForm onGenerated={onGenerated} />)

    await user.type(screen.getByLabelText(/Topic/), 'Spring painting special')
    await user.click(screen.getByRole('button', { name: 'Generate Post' }))

    // Wait for async operations
    await screen.findByText(/Post generated successfully/)
    expect(onGenerated).toHaveBeenCalledOnce()
  })
})
