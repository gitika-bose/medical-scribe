import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'

function Header() {
  const [featuresOpen, setFeaturesOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setFeaturesOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-[5%] py-5"
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid var(--light-border-color)',
      }}
    >
      <Link to="/" className="flex items-center gap-2.5" style={{ textDecoration: 'none' }}>
        <span
          className="text-2xl font-bold"
          style={{ color: 'var(--primary-color)' }}
        >
          Juno
        </span>
      </Link>
      <div className="hidden md:flex gap-8 items-center">
        <a href="/#problem" className="text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: 'var(--dark-text-color)', textDecoration: 'none' }}>
          The Problem
        </a>
        <a href="/#pillars" className="text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: 'var(--dark-text-color)', textDecoration: 'none' }}>
          Our Approach
        </a>
        {/* Features Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setFeaturesOpen(!featuresOpen)}
            className="text-sm font-medium hover:opacity-70 transition-opacity flex items-center gap-1 bg-transparent border-none cursor-pointer"
            style={{ color: 'var(--dark-text-color)', padding: 0 }}
          >
            Features
            <svg
              className={`w-4 h-4 transition-transform ${featuresOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {featuresOpen && (
            <div
              className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-72 rounded-2xl shadow-xl border overflow-hidden"
              style={{
                backgroundColor: 'white',
                borderColor: 'var(--light-border-color)',
              }}
            >
              <a
                href="https://app.meetjuno.health"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 px-5 py-4 hover:bg-gray-50 transition-colors"
                style={{ textDecoration: 'none' }}
                onClick={() => setFeaturesOpen(false)}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'linear-gradient(135deg, var(--primary-color), var(--accent-color))' }}
                >
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-sm" style={{ color: 'var(--dark-text-color)' }}>
                    Live Appointment Clarity
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--gray-text-color)' }}>
                    Real-time notes & smart questions during visits
                  </div>
                </div>
              </a>
              <Link
                to="/upload-understand"
                className="flex items-start gap-3 px-5 py-4 hover:bg-gray-50 transition-colors"
                style={{ textDecoration: 'none' }}
                onClick={() => setFeaturesOpen(false)}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'linear-gradient(135deg, var(--accent2-color), var(--accent3-color))' }}
                >
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-sm" style={{ color: 'var(--dark-text-color)' }}>
                    Upload & Understand
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--gray-text-color)' }}>
                    Upload docs or recordings for clear explanations
                  </div>
                </div>
              </Link>
            </div>
          )}
        </div>
        <Link to="/aboutus" className="text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: 'var(--dark-text-color)', textDecoration: 'none' }}>
          About Us
        </Link>
      </div>
      <div className="flex gap-3 items-center">
        <a
          href="/#available-today"
          className="px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{
            backgroundColor: 'var(--primary-color)',
            borderRadius: 'var(--button-rounded-radius)',
            textDecoration: 'none',
          }}
        >
          Get Started
        </a>
      </div>
    </header>
  )
}

export default Header
