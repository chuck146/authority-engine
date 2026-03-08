import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
    <select
      data-testid="select"
      value={value}
      onChange={(e) => onValueChange?.(e.target.value)}
    >
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

/** Find the engine select by looking for the one with 'remotion' as an option value */
function getEngineSelect(): HTMLSelectElement {
  const selects = screen.getAllByTestId('select') as HTMLSelectElement[]
  return selects.find((s) => Array.from(s.options).some((o) => o.value === 'composite'))!
}

describe('VideoGenerateForm — composite engine', () => {
  describe('engine selector', () => {
    it('renders composite option in the engine selector', () => {
      render(<VideoGenerateForm onJobComplete={onJobComplete} />)

      const engineSelect = getEngineSelect()
      const values = Array.from(engineSelect.options).map((o) => o.value)
      expect(values).toContain('remotion')
      expect(values).toContain('veo')
      expect(values).toContain('composite')
    })

    it('shows composite description text when composite engine selected', () => {
      render(<VideoGenerateForm onJobComplete={onJobComplete} />)

      fireEvent.change(getEngineSelect(), { target: { value: 'composite' } })

      expect(
        screen.getByText(
          'Create a polished reel: branded intro + cinematic clip + branded outro.',
        ),
      ).toBeDefined()
    })

    it('shows Composite Reel video type when composite engine selected', () => {
      render(<VideoGenerateForm onJobComplete={onJobComplete} />)

      fireEvent.change(getEngineSelect(), { target: { value: 'composite' } })

      expect(screen.getByText('Composite Reel')).toBeDefined()
    })
  })

  describe('composite-specific fields', () => {
    function renderWithCompositeEngine() {
      render(<VideoGenerateForm onJobComplete={onJobComplete} />)
      fireEvent.change(getEngineSelect(), { target: { value: 'composite' } })
    }

    it('shows Scene Description textarea', () => {
      renderWithCompositeEngine()

      expect(screen.getByLabelText('Scene Description')).toBeDefined()
    })

    it('shows Audio Mood input', () => {
      renderWithCompositeEngine()

      expect(screen.getByLabelText('Audio Mood')).toBeDefined()
    })

    it('shows CTA Text and CTA URL inputs', () => {
      renderWithCompositeEngine()

      expect(screen.getByLabelText('CTA Text (optional)')).toBeDefined()
      expect(screen.getByLabelText('CTA URL (optional)')).toBeDefined()
    })

    it('shows include intro checkbox checked by default', () => {
      renderWithCompositeEngine()

      const introCheckbox = screen.getByRole('checkbox', { name: /branded intro/i })
      expect((introCheckbox as HTMLInputElement).checked).toBe(true)
    })

    it('shows include outro checkbox checked by default', () => {
      renderWithCompositeEngine()

      const outroCheckbox = screen.getByRole('checkbox', { name: /branded outro/i })
      expect((outroCheckbox as HTMLInputElement).checked).toBe(true)
    })

    it('shows generate starting frame checkbox checked by default', () => {
      renderWithCompositeEngine()

      const startingFrameCheckbox = screen.getByRole('checkbox', { name: /starting frame/i })
      expect((startingFrameCheckbox as HTMLInputElement).checked).toBe(true)
    })

    it('shows Pipeline B cost estimate text', () => {
      renderWithCompositeEngine()

      expect(screen.getAllByText(/Pipeline B/).length).toBeGreaterThan(0)
      expect(screen.getByText(/\$1\.50-\$3\.00/)).toBeDefined()
    })

    it('shows Veo model options for composite engine', () => {
      renderWithCompositeEngine()

      // Model select is shown for composite engine (same as veo)
      const selects = screen.getAllByTestId('select') as HTMLSelectElement[]
      const modelSelect = selects.find((s) =>
        Array.from(s.options).some((o) => o.value === 'veo-3.1-fast-generate-preview'),
      )
      expect(modelSelect).toBeDefined()
    })

    it('allows toggling intro checkbox off', async () => {
      const user = userEvent.setup()
      render(<VideoGenerateForm onJobComplete={onJobComplete} />)
      fireEvent.change(getEngineSelect(), { target: { value: 'composite' } })

      const introCheckbox = screen.getByRole('checkbox', { name: /branded intro/i })
      await user.click(introCheckbox)

      expect((introCheckbox as HTMLInputElement).checked).toBe(false)
    })
  })

  describe('form submission with composite engine', () => {
    it('submits and shows status component on success', async () => {
      const user = userEvent.setup()
      render(<VideoGenerateForm onJobComplete={onJobComplete} />)

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ jobId: 'composite-org-456-111', status: 'queued' }),
      })

      fireEvent.change(getEngineSelect(), { target: { value: 'composite' } })

      await user.type(
        screen.getByLabelText('Scene Description'),
        'A freshly painted living room with warm afternoon light streaming in',
      )
      await user.type(screen.getByLabelText('Audio Mood'), 'Warm orchestral strings')

      fireEvent.submit(screen.getByRole('button', { name: 'Generate Video' }).closest('form')!)

      await waitFor(() => {
        expect(screen.getByTestId('video-generation-status')).toBeDefined()
        expect(screen.getByText('Status for composite-org-456-111')).toBeDefined()
      })
    })

    it('sends composite_reel videoType in request body', async () => {
      const user = userEvent.setup()
      render(<VideoGenerateForm onJobComplete={onJobComplete} />)

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ jobId: 'composite-org-456-111', status: 'queued' }),
      })

      fireEvent.change(getEngineSelect(), { target: { value: 'composite' } })

      await user.type(
        screen.getByLabelText('Scene Description'),
        'A freshly painted living room with warm afternoon light streaming in',
      )
      await user.type(screen.getByLabelText('Audio Mood'), 'Warm orchestral strings')

      fireEvent.submit(screen.getByRole('button', { name: 'Generate Video' }).closest('form')!)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/v1/video/generate',
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"videoType":"composite_reel"'),
          }),
        )
      })
    })

    it('includes includeIntro and includeOutro in request body', async () => {
      const user = userEvent.setup()
      render(<VideoGenerateForm onJobComplete={onJobComplete} />)

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ jobId: 'composite-org-456-111', status: 'queued' }),
      })

      fireEvent.change(getEngineSelect(), { target: { value: 'composite' } })

      await user.type(
        screen.getByLabelText('Scene Description'),
        'A freshly painted living room with warm afternoon light streaming in',
      )
      await user.type(screen.getByLabelText('Audio Mood'), 'Warm orchestral strings')

      fireEvent.submit(screen.getByRole('button', { name: 'Generate Video' }).closest('form')!)

      await waitFor(() => {
        const body = JSON.parse(
          (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]![1].body,
        )
        expect(body.includeIntro).toBe(true)
        expect(body.includeOutro).toBe(true)
        expect(body.useStartingFrame).toBe(true)
      })
    })

    it('shows error message when generation fails', async () => {
      const user = userEvent.setup()
      render(<VideoGenerateForm onJobComplete={onJobComplete} />)

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed to start video generation' }),
      })

      fireEvent.change(getEngineSelect(), { target: { value: 'composite' } })

      await user.type(
        screen.getByLabelText('Scene Description'),
        'A freshly painted living room with warm afternoon light streaming in',
      )
      await user.type(screen.getByLabelText('Audio Mood'), 'Warm orchestral strings')

      fireEvent.submit(screen.getByRole('button', { name: 'Generate Video' }).closest('form')!)

      await waitFor(() => {
        expect(screen.getByText('Failed to start video generation')).toBeDefined()
      })
    })
  })
})
