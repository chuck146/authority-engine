'use client'

import { useState, useEffect, type ReactNode } from 'react'

type SiteHeaderWrapperProps = {
  children: ReactNode
  mobileMenu: ReactNode
}

export function SiteHeaderWrapper({ children, mobileMenu }: SiteHeaderWrapperProps) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-400 ${
        scrolled ? 'bg-white/95 py-3 shadow-sm backdrop-blur-xl' : 'bg-transparent py-5'
      }`}
    >
      <nav className="mx-auto flex max-w-[1400px] items-center justify-between px-6 md:px-10 lg:px-[60px]">
        {children}

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex flex-col gap-1.5 p-2 md:hidden"
          aria-label="Toggle menu"
        >
          <span
            className={`block h-0.5 w-7 transition-all ${
              scrolled ? 'bg-gray-900' : 'bg-gray-900'
            } ${menuOpen ? 'translate-y-2 rotate-45' : ''}`}
          />
          <span
            className={`block h-0.5 w-7 transition-all ${
              scrolled ? 'bg-gray-900' : 'bg-gray-900'
            } ${menuOpen ? 'opacity-0' : ''}`}
          />
          <span
            className={`block h-0.5 w-7 transition-all ${
              scrolled ? 'bg-gray-900' : 'bg-gray-900'
            } ${menuOpen ? '-translate-y-2 -rotate-45' : ''}`}
          />
        </button>
      </nav>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div className="border-t bg-white px-6 py-4 shadow-lg md:hidden">
          <div onClick={() => setMenuOpen(false)}>{mobileMenu}</div>
        </div>
      )}
    </header>
  )
}
