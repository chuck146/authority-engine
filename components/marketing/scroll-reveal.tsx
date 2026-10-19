'use client'

import { useRef, useEffect, type ReactNode } from 'react'

type ScrollRevealProps = {
  children: ReactNode
  className?: string
  delay?: number
}

// Progressive enhancement: content is fully visible in the server HTML (for
// crawlers, no-JS visitors, and anyone who prefers reduced motion). After
// hydration, only elements still below the fold are hidden and then faded in
// as they scroll into view.
export function ScrollReveal({ children, className = '', delay = 0 }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    if (el.getBoundingClientRect().top < window.innerHeight) return

    el.classList.add('opacity-0')
    let timer: ReturnType<typeof setTimeout> | undefined
    const observer = new IntersectionObserver(
      ([entry]: IntersectionObserverEntry[]) => {
        if (entry?.isIntersecting) {
          timer = setTimeout(() => {
            el.classList.remove('opacity-0')
            el.classList.add('animate-fade-in-up')
          }, delay)
          observer.unobserve(el)
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
    )

    observer.observe(el)
    return () => {
      observer.disconnect()
      if (timer) clearTimeout(timer)
      el.classList.remove('opacity-0')
    }
  }, [delay])

  return (
    <div ref={ref} className={className || undefined}>
      {children}
    </div>
  )
}
