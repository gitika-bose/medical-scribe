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
            Medical clarity, when it matters most.
          </p>
          <div className="footer-links-mobile">
            <a href="https://app.meetjuno.health" target="_blank" rel="noopener noreferrer">Live Appointment</a>
            <span className="separator">|</span>
            <a href="/#explain-upload">Explain My Appointment</a>
            <span className="separator">|</span>
            <Link to="/aboutus">About</Link>
            <span className="separator">|</span>
            <Link to="/privacy">Privacy</Link>
            <span className="separator">|</span>
            <Link to="/terms">Terms</Link>
            <span className="separator">|</span>
            <Link to="/contact">Contact</Link>
          </div>
        </div>
        <div className="footer-section">
          <h4>Features</h4>
          {/* <a href="https://app.meetjuno.health" target="_blank" rel="noopener noreferrer">Live Appointment Clarity</a> */}
          <a href="/#explain-upload">Explain My Appointment</a>
        </div>
        <div className="footer-section">
          <h4>Company</h4>
          <Link to="/aboutus">About</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
        </div>
        {/* <div className="footer-section">
          <h4>Support</h4>
          <a href="#help">Help Center</a>
          <Link to="/contact">Contact</Link>
        </div> */}
      </div>
      <div className="footer-bottom">
        <p>&copy; 2026 Juno. All rights reserved.</p>
      </div>
    </footer>
  )
}

export default Footer
