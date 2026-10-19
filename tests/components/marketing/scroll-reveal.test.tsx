import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { ScrollReveal } from '@/components/marketing/scroll-reveal'

type ObserverCallback = (entries: Partial<IntersectionObserverEntry>[]) => void

function installObserver() {
  let callback: ObserverCallback = () => {}
  const observe = vi.fn()
  class MockObserver {
    constructor(cb: ObserverCallback) {
      callback = cb
    }
    observe = observe
    unobserve = vi.fn()
    disconnect = vi.fn()
  }
  vi.stubGlobal('IntersectionObserver', MockObserver)
  return { trigger: () => callback([{ isIntersecting: true }]), observe }
}

function placeAt(top: number) {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    top,
  } as DOMRect)
}

describe('ScrollReveal', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('server-renders content without hiding it', () => {
    const html = renderToString(<ScrollReveal>Interior painting</ScrollReveal>)
    expect(html).toContain('Interior painting')
    expect(html).not.toContain('opacity-0')
  })

  it('leaves content visible when IntersectionObserver is unavailable', () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    render(<ScrollReveal>Visible text</ScrollReveal>)
    expect(screen.getByText('Visible text').className).not.toContain('opacity-0')
  })

  it('does not hide content that is already on screen', () => {
    installObserver()
    placeAt(10)
    render(<ScrollReveal>Above the fold</ScrollReveal>)
    expect(screen.getByText('Above the fold').className).not.toContain('opacity-0')
  })

  it('fades in below-the-fold content when it scrolls into view', () => {
    vi.useFakeTimers()
    const io = installObserver()
    placeAt(5000)
    render(<ScrollReveal delay={100}>Below the fold</ScrollReveal>)

    const el = screen.getByText('Below the fold')
    expect(el.className).toContain('opacity-0')
    expect(io.observe).toHaveBeenCalledWith(el)

    act(() => {
      io.trigger()
      vi.advanceTimersByTime(100)
    })
    expect(el.className).not.toContain('opacity-0')
    expect(el.className).toContain('animate-fade-in-up')
  })

  it('respects prefers-reduced-motion', () => {
    installObserver()
    placeAt(5000)
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce') }))
    render(<ScrollReveal>Calm</ScrollReveal>)
    expect(screen.getByText('Calm').className).not.toContain('opacity-0')
  })
})
