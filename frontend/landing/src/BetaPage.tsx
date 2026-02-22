import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import Footer from './components/shared/Footer'
import './App.css'
import './BetaPage.css'

function BetaPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setStatus('submitting')
    setErrorMessage('')

    try {
      const response = await fetch('https://formspree.io/f/mjgeorjw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'beta-signup' }),
      })

      if (response.ok) {
        setStatus('success')
        setEmail('')
      } else {
        throw new Error('Submission failed')
      }
    } catch {
      setStatus('error')
      setErrorMessage('Something went wrong. Please try again.')
    }
  }

  return (
    <div className="landing-page">
      {/* Header */}
      <header className="header">
        <Link to="/" className="logo-container" style={{ textDecoration: 'none' }}>
          <img src="/logo/android-chrome-192x192.png" alt="Juno Logo" className="logo" />
          <span className="logo-text">Juno</span>
        </Link>
        <div className="header-actions">
          <Link to="/" className="nav-link">← Back to Home</Link>
        </div>
      </header>

      {/* Beta Hero */}
      <section className="beta-hero">
        <div className="beta-hero-content" id="earlyAccess">
          <span className="beta-label">EARLY ACCESS</span>
          <h1>Join the Juno Beta</h1>
          <p>
            Be among the first to experience the future of healthcare visit management.
            Help us shape a product that truly serves patients and caregivers.
          </p>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="beta-benefits">
        <div className="beta-benefits-inner">
          <h2>What beta testers get</h2>
          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon">🤝</div>
              <h3>Shape the Product</h3>
              <p>
                Work directly with our founding team. Your feedback drives what we build next — 
                from features to design, your voice matters.
              </p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">🎁</div>
              <h3>Free Forever</h3>
              <p>
                As a thank-you for helping us build Juno, beta testers receive a 
                free account for life — no strings attached.
              </p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">🚀</div>
              <h3>Early Access</h3>
              <p>
                Be the first to try new features before anyone else. 
                Get a front-row seat to every improvement and update.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Signup Section */}
      <section className="beta-signup">
        <div className="beta-signup-inner">
          {status === 'success' ? (
            <div className="beta-success">
              <div className="success-icon">🎉</div>
              <h2>You're on the list!</h2>
              <p>
                Thanks for signing up. We'll be in touch soon with next steps. 
                Keep an eye on your inbox!
              </p>
              <Link to="/" className="cta-button" style={{ marginTop: '1.5rem' }}>
                Back to Home
              </Link>
            </div>
          ) : (
            <>
              <h2>Ready to get early access?</h2>
              <p>
                Drop your email below and we'll reach out when it's your turn to join.
              </p>
              <form className="beta-form" onSubmit={handleSubmit}>
                <input
                  type="email"
                  className="beta-email-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={status === 'submitting'}
                />
                <button
                  type="submit"
                  className="beta-submit-button"
                  disabled={status === 'submitting'}
                >
                  {status === 'submitting' ? 'Signing up...' : 'Sign Up for Beta'}
                </button>
              </form>
              {status === 'error' && (
                <p className="beta-error">{errorMessage}</p>
              )}
              <p className="beta-privacy-note">
                We respect your privacy. Your email will only be used for beta program communication.
              </p>
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default BetaPage
