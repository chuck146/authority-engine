import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { VideoGenerateForm } from '@/components/video/video-generate-form'

vi.mock('@/components/video/video-generation-status', () => ({
  VideoGenerationStatus: ({ jobId }: { jobId: string }) => (
    <div data-testid="video-generation-status">Status for {jobId}</div>
  ),
}))

// Mock Radix Select to avoid JSDOM pointer-capture limitations
vi.mock('@/components/ui/select', () => ({
  Select: ({
    value,
    onValueChange,
    children,
  }: {
    value?: string
    onValueChange?: (v: string) => void
    children: React.ReactNode
  }) => (
    <select data-testid="select" value={value} onChange={(e) => onValueChange?.(e.target.value)}>
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => (
    <option value={value}>{children}</option>
  ),
}))

const onJobComplete = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  global.fetch = vi.fn()
})

/** Find the engine select by looking for the one with 'premium' as an option value */
function getEngineSelect(): HTMLSelectElement {
  const selects = screen.getAllByTestId('select') as HTMLSelectElement[]
  return selects.find((s) => Array.from(s.options).some((o) => o.value === 'premium'))!
}

function selectPremiumEngine() {
  render(<VideoGenerateForm onJobComplete={onJobComplete} />)
  const engineSelect = getEngineSelect()
  fireEvent.change(engineSelect, { target: { value: 'premium' } })
}

describe('VideoGenerateForm — Premium engine', () => {
  it('shows Premium (Pipeline C) in engine selector', () => {
    render(<VideoGenerateForm onJobComplete={onJobComplete} />)
    const engineSelect = getEngineSelect()
    const options = Array.from(engineSelect.options).map((o) => o.textContent)
    expect(options).toContain('Premium (Pipeline C)')
  })

  it('shows premium description when Premium engine selected', () => {
    selectPremiumEngine()
    expect(screen.getByText(/Full premium pipeline/)).toBeTruthy()
  })

  it('renders topic textarea when Premium selected', () => {
    selectPremiumEngine()
    expect(screen.getByText('Topic')).toBeTruthy()
  })

  it('renders style select when Premium selected', () => {
    selectPremiumEngine()
    expect(screen.getByText('Style')).toBeTruthy()
  })

  it('renders scene count select when Premium selected', () => {
    selectPremiumEngine()
    expect(screen.getByText('Scenes (2-5)')).toBeTruthy()
  })

  it('renders target audience input when Premium selected', () => {
    selectPremiumEngine()
    expect(screen.getByText('Target Audience (optional)')).toBeTruthy()
  })

  it('renders CTA fields when Premium selected', () => {
    selectPremiumEngine()
    const ctaLabels = screen.getAllByText(/CTA/)
    expect(ctaLabels.length).toBeGreaterThanOrEqual(2)
  })

  it('renders intro/outro checkboxes when Premium selected', () => {
    selectPremiumEngine()
    expect(screen.getByText('Include branded intro (3s)')).toBeTruthy()
    expect(screen.getByText('Include branded outro (3s)')).toBeTruthy()
  })

  it('shows cost estimate text for Pipeline C', () => {
    selectPremiumEngine()
    expect(screen.getByText(/\$3-6 per video/)).toBeTruthy()
  })

  it('renders font selectors for Premium engine', () => {
    selectPremiumEngine()
    expect(screen.getByText('Heading Font')).toBeTruthy()
    expect(screen.getByText('Body Font')).toBeTruthy()
  })

  it('shows Premium Reel video type when Premium engine selected', () => {
    selectPremiumEngine()
    const selects = screen.getAllByTestId('select') as HTMLSelectElement[]
    const videoTypeSelect = selects.find((s) =>
      Array.from(s.options).some((o) => o.value === 'premium_reel'),
    )
    expect(videoTypeSelect).toBeTruthy()
    expect(videoTypeSelect!.value).toBe('premium_reel')
  })

  it('shows model selector for Premium engine', () => {
    selectPremiumEngine()
    const selects = screen.getAllByTestId('select') as HTMLSelectElement[]
    const modelSelect = selects.find((s) =>
      Array.from(s.options).some((o) => o.value === 'veo-3.1-generate-preview'),
    )
    expect(modelSelect).toBeTruthy()
  })

  it('defaults model to Veo Standard for Premium', () => {
    selectPremiumEngine()
    const selects = screen.getAllByTestId('select') as HTMLSelectElement[]
    const modelSelect = selects.find((s) =>
      Array.from(s.options).some((o) => o.value === 'veo-3.1-generate-preview'),
    )
    expect(modelSelect!.value).toBe('veo-3.1-generate-preview')
  })

  it('submits premium request body with correct videoType', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ jobId: 'premium-org-456-123' }),
    })
    global.fetch = mockFetch

    selectPremiumEngine()

    // Fill in topic (uses textarea)
    const topicInput = screen.getByPlaceholderText(/Describe the video topic/)
    fireEvent.change(topicInput, {
      target: { value: 'Spring exterior painting transformation in Summit, NJ' },
    })

    // Submit
    const submitButton = screen
      .getAllByText('Generate Video')
      .find((el) => el.tagName === 'BUTTON')!
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled()
    })

    const [url, options] = mockFetch.mock.calls[0]!
    expect(url).toBe('/api/v1/video/generate')
    const body = JSON.parse(options.body)
    expect(body.videoType).toBe('premium_reel')
    expect(body.topic).toBe('Spring exterior painting transformation in Summit, NJ')
    expect(body.style).toBe('cinematic')
    expect(body.sceneCount).toBe(3)
  })

  it('does NOT show composite fields when Premium selected', () => {
    selectPremiumEngine()
    const allText = document.body.textContent ?? ''
    expect(allText).not.toContain('Generate starting frame')
  })

  it('does NOT show Remotion fields when Premium selected', () => {
    selectPremiumEngine()
    const allText = document.body.textContent ?? ''
    expect(allText).not.toContain('Customer Quote')
    expect(allText).not.toContain('Star Rating')
  })

  it('includes style options: cinematic, documentary, energetic, elegant', () => {
    selectPremiumEngine()
    const selects = screen.getAllByTestId('select') as HTMLSelectElement[]
    const styleSelect = selects.find((s) =>
      Array.from(s.options).some((o) => o.value === 'elegant'),
    )
    expect(styleSelect).toBeTruthy()
    const styleOptions = Array.from(styleSelect!.options).map((o) => o.value)
    expect(styleOptions).toContain('cinematic')
    expect(styleOptions).toContain('documentary')
    expect(styleOptions).toContain('energetic')
    expect(styleOptions).toContain('elegant')
  })
})
