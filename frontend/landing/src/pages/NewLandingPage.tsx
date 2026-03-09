import { useRef } from 'react'
import './NewLandingPage.css'
import ExplainAppComponentV2 from '../components/ExplainAppComponentV2'
import { HeroSection } from '../components/landing'
import Footer from '../components/shared/Footer'

function NewLandingPage() {
  const tryRef = useRef<HTMLDivElement>(null);

  return (
    <div className="new-landing-page min-h-screen w-full" style={{ fontFamily: 'var(--font-family-body)' }}>
      {/* ── Minimal Navbar ── */}
      {/* <nav className="minimal-navbar">
        <Link to="/" className="minimal-navbar-logo">
          <span className="minimal-navbar-logo-text">Juno</span>
        </Link> */}

        {/* Desktop links */}
        {/* <div className="minimal-navbar-links">
          <button onClick={() => scrollToSection('feedback')} className="minimal-navbar-link" style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', padding: 0 }}>Feedback</button>
          <button onClick={() => scrollToSection('waitlist')} className="minimal-navbar-link" style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', padding: 0 }}>Waitlist</button>
        </div> */}

        {/* Hamburger */}
        {/* <button className="minimal-navbar-hamburger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
          {mobileMenuOpen ? (
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          ) : (
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
          )}
        </button>
      </nav> */}

      {/* Mobile menu */}
      {/* <div className={`minimal-navbar-mobile-menu${mobileMenuOpen ? ' open' : ''}`}>
        <button onClick={() => scrollToSection('feedback')} className="minimal-navbar-mobile-link" style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', textAlign: 'left', padding: '0.5rem 0' }}>Feedback</button>
        <button onClick={() => scrollToSection('waitlist')} className="minimal-navbar-mobile-link" style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', textAlign: 'left', padding: '0.5rem 0' }}>Waitlist</button>
      </div> */}

      {/* ── Hero Graphic from existing landing page ── */}
      <HeroSection />

      {/* ── Try It / V2 Component (upload, results, feedback, coming soon, waitlist) ── */}
      <ExplainAppComponentV2 ref={tryRef} />

      <Footer />
    </div>
  )
}

export default NewLandingPage
