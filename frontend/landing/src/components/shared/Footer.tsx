import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <div className="logo-container">
            <img src="/logo/android-chrome-192x192.png" alt="Juno Logo" className="logo" />
            <span className="logo-text">Juno</span>
          </div>
          <p className="footer-description">
            Your privacy-first companion for medical visits.
          </p>
          <div className="footer-links-mobile">
            <a href="https://app.meetjuno.health" target="_blank" rel="noopener noreferrer">Live Appointment</a>
            <span className="separator">|</span>
            <Link to="/upload-understand">Upload & Understand</Link>
            <span className="separator">|</span>
            <Link to="/aboutus">About</Link>
            <span className="separator">|</span>
            <a href="#privacy">Privacy</a>
            <span className="separator">|</span>
            <a href="#terms">Terms</a>
            <span className="separator">|</span>
            <Link to="/contact">Contact</Link>
          </div>
        </div>
        <div className="footer-section">
          <h4>Features</h4>
          <a href="https://app.meetjuno.health" target="_blank" rel="noopener noreferrer">Live Appointment Clarity</a>
          <Link to="/upload-understand">Upload & Understand</Link>
        </div>
        <div className="footer-section">
          <h4>Company</h4>
          <Link to="/aboutus">About</Link>
          <a href="#privacy">Privacy</a>
          <a href="#terms">Terms</a>
        </div>
        <div className="footer-section">
          <h4>Support</h4>
          <a href="#help">Help Center</a>
          <Link to="/contact">Contact</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2026 Juno. All rights reserved.</p>
      </div>
    </footer>
  )
}

export default Footer
