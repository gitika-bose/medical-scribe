import { Link } from 'react-router-dom'
import './NewLandingPage.css'
import Footer from '../components/shared/Footer'
import {
  HeroSection,
  ProblemSection,
  MissionSection,
  PillarsSection,
  PlatformSection,
  AvailableTodaySection,
} from '../components/landing'

function NewLandingPage() {
  return (
    <div className="min-h-screen w-full" style={{ fontFamily: 'var(--font-family-body)' }}>
      {/* Header */}
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
          <a href="#problem" className="text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: 'var(--dark-text-color)', textDecoration: 'none' }}>
            The Problem
          </a>
          <a href="#mission" className="text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: 'var(--dark-text-color)', textDecoration: 'none' }}>
            Mission
          </a>
          <Link to="/aboutus" className="text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: 'var(--dark-text-color)', textDecoration: 'none' }}>
            About Us
          </Link>
        </div>
        <div className="flex gap-3 items-center">
          <Link
            to="/contact"
            className="px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{
              backgroundColor: 'var(--primary-color)',
              borderRadius: 'var(--button-rounded-radius)',
              textDecoration: 'none',
            }}
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Sections */}
      <HeroSection />
      <div id="problem">
        <ProblemSection />
      </div>
      <div id="mission">
        <MissionSection />
      </div>
      <PillarsSection />
      <PlatformSection />
      <AvailableTodaySection />

      {/* Footer */}
      <Footer />
    </div>
  )
}

export default NewLandingPage
