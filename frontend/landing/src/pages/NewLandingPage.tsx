import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import './NewLandingPage.css'
import Header from '../components/shared/Header'
import Footer from '../components/shared/Footer'
import {
  HeroSection,
  ProblemSection,
  PillarsSection,
  AvailableTodaySection,
} from '../components/landing'

function NewLandingPage() {
  const location = useLocation()

  useEffect(() => {
    const hash = location.hash
    if (hash) {
      // Small delay to ensure DOM is rendered
      setTimeout(() => {
        const element = document.querySelector(hash)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
    }
  }, [location.hash])

  return (
    <div className="min-h-screen w-full" style={{ fontFamily: 'var(--font-family-body)' }}>
      <Header />

      {/* Sections */}
      <HeroSection />
      <div id="problem">
        <ProblemSection />
      </div>
      <div id="pillars">
        <PillarsSection />
      </div>
      <div id="available-today">
        <AvailableTodaySection />
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}

export default NewLandingPage
