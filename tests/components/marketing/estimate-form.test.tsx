import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EstimateForm } from '@/components/marketing/home/estimate-form'

const services = [
  { title: 'Interior Painting Services', slug: 'interior-painting' },
  { title: 'Deck Staining & Sealing', slug: 'deck-staining' },
]

function fillRequired() {
  fireEvent.change(screen.getByPlaceholderText('Full name'), { target: { value: 'Jane Doe' } })
  fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'jane@example.com' } })
  fireEvent.change(screen.getByPlaceholderText('Phone'), { target: { value: '201-555-1234' } })
}

describe('EstimateForm', () => {
  const gtag = vi.fn()
  const fetchMock = vi.fn()

  beforeEach(() => {
    gtag.mockReset()
    fetchMock.mockReset()
    window.gtag = gtag
    vi.stubGlobal('fetch', fetchMock)
    window.localStorage.clear()
  })

  afterEach(() => {
    delete window.gtag
    vi.unstubAllGlobals()
    window.history.replaceState(null, '', '/')
  })

  it('preselects the service from ?service=', async () => {
    window.history.replaceState(null, '', '/estimate?service=deck-staining')
    render(<EstimateForm orgSlug="cleanest-painting" services={services} />)
    await waitFor(() =>
      expect((screen.getByLabelText('Service') as HTMLSelectElement).value).toBe('deck-staining'),
    )
  })

  it('sends discovery source and attribution, and tracks generate_lead after a 201', async () => {
    window.localStorage.setItem(
      'ce_attribution',
      JSON.stringify({
        savedAt: Date.now(),
        data: { landing_page: '/services/deck-staining', referrer_host: 'chatgpt.com' },
      }),
    )
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 201 }))

    render(
      <EstimateForm orgSlug="cleanest-painting" services={services} formLocation="estimate_page" />,
    )
    fillRequired()
    fireEvent.change(screen.getByLabelText('Service'), { target: { value: 'deck-staining' } })
    fireEvent.change(screen.getByLabelText('How did you hear about us? (optional)'), {
      target: { value: 'ai_assistant' },
    })
    fireEvent.submit(screen.getByRole('button', { name: 'Request Free Estimate' }))

    await screen.findByText('Thank you!')

    const body = JSON.parse(fetchMock.mock.calls[0]![1].body)
    expect(body).toMatchObject({
      service: 'Deck Staining & Sealing',
      discovery_source: 'ai_assistant',
      attribution: { landing_page: '/services/deck-staining', referrer_host: 'chatgpt.com' },
    })

    expect(gtag).toHaveBeenCalledTimes(1)
    expect(gtag).toHaveBeenCalledWith('event', 'generate_lead', {
      form_location: 'estimate_page',
      service_slug: 'deck-staining',
      discovery_source: 'ai_assistant',
    })
    // No personal data in the analytics event
    expect(JSON.stringify(gtag.mock.calls)).not.toMatch(/jane|555/i)
  })

  it('does not track a lead when the server rejects the submission', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400 }),
    )
    render(<EstimateForm orgSlug="cleanest-painting" services={services} />)
    fillRequired()
    fireEvent.submit(screen.getByRole('button', { name: 'Request Free Estimate' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid request')
    expect(gtag).not.toHaveBeenCalled()
  })

  it('keeps the #estimate anchor after a successful submission', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 201 }))
    const { container } = render(<EstimateForm orgSlug="cleanest-painting" services={services} />)
    fillRequired()
    fireEvent.submit(screen.getByRole('button', { name: 'Request Free Estimate' }))
    await screen.findByText('Thank you!')
    expect(container.querySelector('#estimate')).not.toBeNull()
  })

  it('renders the heading as h1 on the estimate page', () => {
    render(
      <EstimateForm
        orgSlug="cleanest-painting"
        services={services}
        headingAs="h1"
        title="Request a Free Painting Estimate"
      />,
    )
    expect(
      screen.getByRole('heading', { level: 1, name: 'Request a Free Painting Estimate' }),
    ).toBeInTheDocument()
  })
})
