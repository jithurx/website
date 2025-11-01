'use client'

import { useState, useEffect } from 'react'

export default function Header() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? 'glass border-b border-cyan-neon/20'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-neon to-magenta-neon flex items-center justify-center">
            <span className="text-white font-bold text-sm">PP</span>
          </div>
          <span className="text-lg font-semibold text-cyan-neon">Portal</span>
        </div>

        <nav className="hidden md:flex gap-8">
          <a href="#" className="text-neutral-light/70 hover:text-cyan-neon transition-colors">
            Home
          </a>
          <a href="#" className="text-neutral-light/70 hover:text-cyan-neon transition-colors">
            Features
          </a>
          <a href="#" className="text-neutral-light/70 hover:text-cyan-neon transition-colors">
            Work
          </a>
          <a href="#" className="text-neutral-light/70 hover:text-cyan-neon transition-colors">
            Contact
          </a>
        </nav>

        <button className="px-4 py-2 rounded-lg bg-cyan-neon/10 text-cyan-neon border border-cyan-neon/50 hover:bg-cyan-neon/20 transition-all">
          Documentation
        </button>
      </div>
    </header>
  )
}
