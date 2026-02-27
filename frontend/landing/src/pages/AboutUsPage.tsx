import '../App.css'
import { Link } from 'react-router-dom'
import Footer from '../components/shared/Footer'

function AboutUsPage() {
  return (
    <div className="landing-page">
      {/* Header */}
      <header className="header">
        <div className="logo-container">
          <Link to="/">
            <img src="/logo/android-chrome-192x192.png" alt="Juno Logo" className="logo" />
          </Link>
          <Link to="/" className="logo-text">Juno</Link>
        </div>
        <div className="header-nav">
          <Link to="/#features" className="nav-link">The Problem</Link>
        </div>
        <div className="header-actions">
          <Link to="/beta" className="login-button">Join the beta</Link>
          <Link to="/try" className="cta-button-small">Try it now</Link>
        </div>
      </header>

      {/* About Us Section */}
      <section className="about-us" id="about-us">
        <div className="about-content-wrapper">
          <div className="section-header">
            <span className="section-label">ABOUT US</span>
            <h2>Empowering patients through better communication</h2>
          </div>
          <div className="about-layout">
            <div className="about-image-side">
              <img src="/aboutuspic.jpg" alt="Tejit Pabari and Gitika Bose" className="about-founders-photo" />
              <p className="about-caption">Tejit Pabari (Co-Founder & CEO) and Gitika Bose (Co-Founder & CTO)</p>
            </div>
            <div className="about-text-side">
              <p>
                My husband and I created Juno when we observed that as healthcare gets more complex, we are barely 
                able to keep up for our loved ones. When my grandmom was diagnosed with Alzheimer's, I realized what it
                means to be a caregiver.
              </p>
              <p>
                After consulting with numerous doctors in the US, we developed this note taking solution.
                This goal of this simple tool is to empower patients and caregivers
                to take control of their health information.
              </p>
              <p>
                We are continuously trying to improve Juno for our family and anyone else who it may help. If you try it, do 
                let us know if it could support you in any better way. 
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}

export default AboutUsPage
