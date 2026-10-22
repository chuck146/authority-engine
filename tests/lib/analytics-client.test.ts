import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  captureAttribution,
  readAttribution,
  trackEvent,
  sendMarketingEvent,
} from '@/lib/analytics/client'

const KEY = 'ce_attribution'
const DAY = 24 * 60 * 60 * 1000

function readBlob(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsText(blob)
  })
}

describe('analytics client', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.history.replaceState(null, '', '/')
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    delete window.gtag
  })

  describe('captureAttribution', () => {
    it('stores a first-touch record', () => {
      window.history.replaceState(null, '', '/services/x?utm_source=newsletter&utm_medium=email')
      captureAttribution()
      const stored = JSON.parse(window.localStorage.getItem(KEY)!)
      expect(typeof stored.savedAt).toBe('number')
      expect(stored.data).toMatchObject({
        landing_page: '/services/x',
        utm_source: 'newsletter',
        utm_medium: 'email',
      })
    })

    it('does not overwrite an existing valid record', () => {
      const existing = JSON.stringify({ savedAt: Date.now(), data: { landing_page: '/first' } })
      window.localStorage.setItem(KEY, existing)
      window.history.replaceState(null, '', '/second')
      captureAttribution()
      expect(window.localStorage.getItem(KEY)).toBe(existing)
    })

    it('replaces an expired record', () => {
      window.localStorage.setItem(
        KEY,
        JSON.stringify({ savedAt: Date.now() - 31 * DAY, data: { landing_page: '/old' } }),
      )
      window.history.replaceState(null, '', '/new')
      captureAttribution()
      expect(JSON.parse(window.localStorage.getItem(KEY)!).data.landing_page).toBe('/new')
    })

    it('swallows storage errors', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('blocked')
      })
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('blocked')
      })
      expect(() => captureAttribution()).not.toThrow()
    })
  })

  describe('readAttribution', () => {
    it('returns undefined when nothing is stored', () => {
      expect(readAttribution()).toBeUndefined()
    })

    it('returns a valid stored record', () => {
      window.localStorage.setItem(
        KEY,
        JSON.stringify({ savedAt: Date.now(), data: { landing_page: '/a', gclid: true } }),
      )
      expect(readAttribution()).toEqual({ landing_page: '/a', gclid: true })
    })

    it('removes and ignores entries older than 30 days', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
      window.localStorage.setItem(
        KEY,
        JSON.stringify({ savedAt: Date.now(), data: { landing_page: '/a' } }),
      )
      vi.setSystemTime(new Date('2026-01-29T00:00:00Z'))
      expect(readAttribution()).toEqual({ landing_page: '/a' })
      vi.setSystemTime(new Date('2026-02-01T00:00:00Z'))
      expect(readAttribution()).toBeUndefined()
      expect(window.localStorage.getItem(KEY)).toBeNull()
    })

    it('returns undefined for corrupt JSON', () => {
      window.localStorage.setItem(KEY, '{not json')
      expect(readAttribution()).toBeUndefined()
    })

    it.each([
      ['gclid wrong type', { gclid: 'yes' }],
      ['landing_page wrong type', { landing_page: 123 }],
      ['string over the length limit', { landing_page: 'x'.repeat(301) }],
      ['data is an array', []],
      ['data is a string', 'oops'],
    ])('returns undefined for stored data with %s', (_name, data) => {
      window.localStorage.setItem(KEY, JSON.stringify({ savedAt: Date.now(), data }))
      expect(readAttribution()).toBeUndefined()
    })

    it('swallows storage errors', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('blocked')
      })
      expect(readAttribution()).toBeUndefined()
    })
  })

  describe('trackEvent', () => {
    it('is a no-op without gtag', () => {
      expect(window.gtag).toBeUndefined()
      expect(() => trackEvent('call_click', { link_location: 'header' })).not.toThrow()
    })

    it('calls gtag when defined', () => {
      const gtag = vi.fn()
      window.gtag = gtag
      trackEvent('call_click', { link_location: 'header' })
      expect(gtag).toHaveBeenCalledWith('event', 'call_click', { link_location: 'header' })
    })

    it('swallows gtag errors', () => {
      window.gtag = () => {
        throw new Error('boom')
      }
      expect(() => trackEvent('x', {})).not.toThrow()
    })
  })

  describe('sendMarketingEvent', () => {
    it('uses sendBeacon with a JSON blob', async () => {
      const sendBeacon = vi.fn().mockReturnValue(true)
      const fetchMock = vi.fn()
      vi.stubGlobal('fetch', fetchMock)
      Object.defineProperty(navigator, 'sendBeacon', { value: sendBeacon, configurable: true })
      window.history.replaceState(null, '', '/services/interior')

      sendMarketingEvent('call_click', 'header')

      expect(sendBeacon).toHaveBeenCalledTimes(1)
      const [url, blob] = sendBeacon.mock.calls[0]!
      expect(url).toBe('/api/v1/events')
      expect(blob).toBeInstanceOf(Blob)
      expect((blob as Blob).type).toBe('application/json')
      expect(JSON.parse(await readBlob(blob as Blob))).toEqual({
        event_type: 'call_click',
        page_path: '/services/interior',
        link_location: 'header',
      })
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('falls back to fetch with keepalive when sendBeacon returns false', () => {
      Object.defineProperty(navigator, 'sendBeacon', {
        value: vi.fn().mockReturnValue(false),
        configurable: true,
      })
      const fetchMock = vi.fn().mockResolvedValue(new Response('{}'))
      vi.stubGlobal('fetch', fetchMock)
      window.localStorage.setItem(
        KEY,
        JSON.stringify({ savedAt: Date.now(), data: { landing_page: '/a' } }),
      )

      sendMarketingEvent('call_click', 'footer')

      expect(fetchMock).toHaveBeenCalledTimes(1)
      const [url, init] = fetchMock.mock.calls[0]!
      expect(url).toBe('/api/v1/events')
      expect(init.method).toBe('POST')
      expect(init.keepalive).toBe(true)
      expect(init.headers).toEqual({ 'Content-Type': 'application/json' })
      const body = JSON.parse(init.body)
      expect(Object.keys(body).sort()).toEqual([
        'attribution',
        'event_type',
        'link_location',
        'page_path',
      ])
      expect(body.attribution).toEqual({ landing_page: '/a' })
      expect(init.body).not.toMatch(/phone|email|name|tel:/i)
    })

    it('falls back to fetch when sendBeacon is unavailable', () => {
      Object.defineProperty(navigator, 'sendBeacon', { value: undefined, configurable: true })
      const fetchMock = vi.fn().mockResolvedValue(new Response('{}'))
      vi.stubGlobal('fetch', fetchMock)
      sendMarketingEvent('call_click', 'header')
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('swallows fetch rejection', async () => {
      Object.defineProperty(navigator, 'sendBeacon', { value: undefined, configurable: true })
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
      expect(() => sendMarketingEvent('call_click', 'header')).not.toThrow()
      await Promise.resolve()
    })
  })
})
