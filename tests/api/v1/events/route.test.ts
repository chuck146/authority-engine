import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockSupabaseClient } from '@/tests/mocks/supabase'

const mockSupabase = createMockSupabaseClient()
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn().mockReturnValue(mockSupabase),
}))

let ipCounter = 0

async function callPost(body: unknown, ip = `10.0.0.${++ipCounter}`) {
  const { POST } = await import('@/app/api/v1/events/route')
  return POST(
    new Request('http://localhost/api/v1/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  )
}

const validEvent = {
  event_type: 'call_click',
  page_path: '/services/interior-painting',
  link_location: 'header',
  attribution: { referrer_host: 'chatgpt.com', landing_page: '/' },
}

describe('POST /api/v1/events', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
    mockSupabase.single.mockResolvedValue({ data: { id: 'org-1' }, error: null })
    mockSupabase.insert.mockResolvedValue({ error: null })
  })

  it('stores an anonymous call click with its channel', async () => {
    const res = await callPost(validEvent)
    expect(res.status).toBe(204)
    expect(mockSupabase.from).toHaveBeenCalledWith('marketing_events')
    expect(mockSupabase.insert).toHaveBeenCalledWith({
      organization_id: 'org-1',
      event_type: 'call_click',
      page_path: '/services/interior-painting',
      link_location: 'header',
      channel: 'ai_assistant',
      attribution: { referrer_host: 'chatgpt.com', landing_page: '/' },
    })
  })

  it('rejects unknown event types and malformed payloads', async () => {
    expect((await callPost({ ...validEvent, event_type: 'form_view' })).status).toBe(400)
    expect((await callPost({ ...validEvent, page_path: 'https://evil.example' })).status).toBe(400)
    expect((await callPost({ ...validEvent, link_location: 'Header <script>' })).status).toBe(400)
    expect((await callPost('not json')).status).toBe(400)
    expect(mockSupabase.insert).not.toHaveBeenCalled()
  })

  it('does not surface database errors (e.g. table not migrated yet)', async () => {
    mockSupabase.insert.mockResolvedValue({ error: { message: 'relation does not exist' } })
    const res = await callPost(validEvent)
    expect(res.status).toBe(204)
  })

  it('stops recording after the per-IP limit', async () => {
    for (let i = 0; i < 30; i++) await callPost(validEvent, '192.168.1.1')
    mockSupabase.insert.mockClear()
    const res = await callPost(validEvent, '192.168.1.1')
    expect(res.status).toBe(204)
    expect(mockSupabase.insert).not.toHaveBeenCalled()
  })
})
