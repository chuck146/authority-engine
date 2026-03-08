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

/** Find the engine select by looking for the one with 'composite' as an option value */
function getEngineSelect(): HTMLSelectElement {
  const selects = screen.getAllByTestId('select') as HTMLSelectElement[]
  return selects.find((s) => Array.from(s.options).some((o) => o.value === 'composite'))!
}

/**
 * Find font selects by querying for nested <option> elements with font IDs.
 * Font selects have <div> wrappers for category labels, so HTMLSelectElement.options
 * won't find them. We use querySelectorAll('option') instead.
 */
function getFontSelects(): HTMLSelectElement[] {
  const selects = screen.getAllByTestId('select') as HTMLSelectElement[]
  return selects.filter((s) => s.querySelector('option[value="PlayfairDisplay"]') !== null)
}

function getFontOptionValues(selectEl: HTMLSelectElement): string[] {
  const options = selectEl.querySelectorAll('option')
  return Array.from(options).map((o) => o.value)
}

describe('VideoGenerateForm — font selectors', () => {
  describe('font dropdown visibility', () => {
    it('renders font dropdowns when Remotion engine is selected (default)', () => {
      render(<VideoGenerateForm onJobComplete={onJobComplete} />)

      // Default engine is remotion
      expect(screen.getByText('Heading Font')).toBeDefined()
      expect(screen.getByText('Body Font')).toBeDefined()
      const fontSelects = getFontSelects()
      expect(fontSelects.length).toBe(2)
    })

    it('renders font dropdowns when Composite engine is selected', () => {
      render(<VideoGenerateForm onJobComplete={onJobComplete} />)
      fireEvent.change(getEngineSelect(), { target: { value: 'composite' } })

      expect(screen.getByText('Heading Font')).toBeDefined()
      expect(screen.getByText('Body Font')).toBeDefined()
      const fontSelects = getFontSelects()
      expect(fontSelects.length).toBe(2)
    })

    it('does NOT render font dropdowns when Veo engine is selected', () => {
      render(<VideoGenerateForm onJobComplete={onJobComplete} />)
      fireEvent.change(getEngineSelect(), { target: { value: 'veo' } })

      expect(screen.queryByText('Heading Font')).toBeNull()
      expect(screen.queryByText('Body Font')).toBeNull()
    })
  })

  describe('font dropdown options', () => {
    it('font selects contain all 12 font options', () => {
      render(<VideoGenerateForm onJobComplete={onJobComplete} />)

      const fontSelects = getFontSelects()
      const values = getFontOptionValues(fontSelects[0]!)

      expect(values).toContain('DMSans')
      expect(values).toContain('Montserrat')
      expect(values).toContain('PlayfairDisplay')
      expect(values).toContain('CormorantGaramond')
      expect(values).toContain('Italiana')
      expect(values).toContain('Pacifico')
      expect(values).toContain('Satisfy')
      expect(values).toContain('Anton')
      expect(values).toContain('BebasNeue')
      expect(values).toContain('Oswald')
      expect(values).toContain('BarlowCondensed')
      expect(values).toContain('SpaceMono')
      expect(values).toHaveLength(12)
    })

    it('font options are grouped with category labels', () => {
      render(<VideoGenerateForm onJobComplete={onJobComplete} />)

      // Category labels rendered as div elements inside the mock Select
      expect(screen.getAllByText('Sans-Serif').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Serif').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Script').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Display').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Monospace').length).toBeGreaterThan(0)
    })

    it('font selects show placeholder text for defaults', () => {
      render(<VideoGenerateForm onJobComplete={onJobComplete} />)

      expect(screen.getByText('Default (Montserrat)')).toBeDefined()
      expect(screen.getByText('Default (DM Sans)')).toBeDefined()
    })
  })

  describe('font fields in form submission', () => {
    it('both heading and body font selects start with empty value (optional)', () => {
      render(<VideoGenerateForm onJobComplete={onJobComplete} />)

      const fontSelects = getFontSelects()
      // Both font selects default to empty string (no font selected)
      expect(fontSelects[0]!.value).toBe('')
      expect(fontSelects[1]!.value).toBe('')
    })

    it('omits font fields from request when no fonts are selected', async () => {
      render(<VideoGenerateForm onJobComplete={onJobComplete} />)
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ jobId: 'remotion-org-456-333', status: 'queued' }),
      })

      // Fill required fields only (no font selection)
      fireEvent.change(screen.getByLabelText('Customer Quote'), {
        target: { value: 'Wonderful experience!' },
      })
      fireEvent.change(screen.getByLabelText('Customer Name'), {
        target: { value: 'Lisa R.' },
      })

      fireEvent.submit(screen.getByRole('button', { name: 'Generate Video' }).closest('form')!)

      await waitFor(() => {
        const body = JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]![1].body)
        expect(body.headingFont).toBeUndefined()
        expect(body.bodyFont).toBeUndefined()
      })
    })
  })
})
