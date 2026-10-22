import { describe, it, expect, vi, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import type { ReactNode } from 'react'

vi.mock('next/script', () => ({
  default: ({ src, id, children }: { src?: string; id?: string; children?: ReactNode }) => (
    <script data-testid="script" data-src={src} data-id={id}>
      {children}
    </script>
  ),
}))

import { Ga4 } from '@/components/marketing/ga4'

describe('Ga4', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('renders nothing when the measurement id is unset', () => {
    vi.stubEnv('NEXT_PUBLIC_GA_MEASUREMENT_ID', '')
    const { container } = render(<Ga4 />)
    expect(container).toBeEmptyDOMElement()
  })

  it.each(['G-abc', 'UA-12345', 'G-ABC"</script>', 'G-ABC123 ', "G-1');alert(1);('"])(
    'renders nothing for invalid id %j',
    (id) => {
      vi.stubEnv('NEXT_PUBLIC_GA_MEASUREMENT_ID', id)
      const { container } = render(<Ga4 />)
      expect(container).toBeEmptyDOMElement()
    },
  )

  it('loads gtag with signals and ad personalization disabled for a valid id', () => {
    vi.stubEnv('NEXT_PUBLIC_GA_MEASUREMENT_ID', 'G-ABC123XYZ')
    const { container } = render(<Ga4 />)
    const scripts = container.querySelectorAll('script')
    expect(scripts).toHaveLength(2)
    expect(scripts[0]!.getAttribute('data-src')).toBe(
      'https://www.googletagmanager.com/gtag/js?id=G-ABC123XYZ',
    )
    const inline = scripts[1]!.textContent ?? ''
    expect(inline).toContain("gtag('config', 'G-ABC123XYZ'")
    expect(inline).toContain('allow_google_signals: false')
    expect(inline).toContain('allow_ad_personalization_signals: false')
  })
})
