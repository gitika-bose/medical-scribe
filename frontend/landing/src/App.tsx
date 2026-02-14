import './App.css'

function App() {
  const APP_URL = import.meta.env.VITE_APP_URL || 'https://app.meetjuno.health/';

  return (
    <div className="landing-page">
      {/* Header */}
      <header className="header">
        <div className="logo-container">
          <img src="/logo/android-chrome-192x192.png" alt="Juno Logo" className="logo" />
          <span className="logo-text">Juno</span>
        </div>
        <div className="header-nav">
          <a href="#features" className="nav-link">Features</a>
          <a href="#how-it-works" className="nav-link">How It Works</a>
          <a href="#about-us" className="nav-link">About Us</a>
        </div>
        <div className="header-actions">
          <a href={APP_URL} className="login-button">Login</a>
          <a href={APP_URL} className="cta-button-small">Get Started</a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1>Your trusted companion for medical visits</h1>
            <p>
              Never miss important details from your healthcare appointments. 
              Juno helps you remember, understand, and share what matters most.
            </p>
            <div className="hero-cta">
              <a href={APP_URL} className="cta-button">Get Started →</a>
            </div>
            <div className="trust-badges">
              <span className="badge">End-to-End Encrypted</span>
              <span className="badge">Privacy First</span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="card-mockup">
              <img src="/cropDemo2.gif" alt="Juno App Demo" className="app-demo-gif" />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works" id="how-it-works">
        <div className="section-header-dark">
          <h2>How Juno works</h2>
          <p>Get started in three simple steps</p>
        </div>
        <div className="steps-container">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>Start Juno</h3>
            <p>
              Open Juno before your appointment and tap start. 
              Ask your healthcare provider for permission to take notes.
            </p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h3>Let Juno listen</h3>
            <p>
              Focus on your conversation while Juno captures everything and generates questions for you on the fly.
            </p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h3>Review & share</h3>
            <p>
              Get an organized summary instantly. Share with family, 
              caregivers, or keep it for your records.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features" id="features">
        <div className="section-header">
          <span className="section-label">FEATURES</span>
          <h2>Everything you need for better healthcare visits</h2>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🎙️</div>
            <h3>Smart summaries</h3>
            <p>
              Get organized summaries with diagnoses, treatment plans, medications, 
              and follow-up instructions automatically extracted.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📝</div>
            <h3>Generate questions</h3>
            <p>
              During the appointment, Juno helps you ask relevant questions 
              so you never leave the appointment room confused.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Privacy first</h3>
            <p>
              Your data is encrypted and automatically deleted after processing. 
              We only keep what you see and nothing more.
            </p>
          </div>
        </div>
      </section>

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
                Juno was born from a simple observation: healthcare conversations are complex, 
                and it's nearly impossible to remember everything discussed during an appointment. 
                The founders have been through this countless times during medical visits for themselves and loved ones.
              </p>
              <p>
                After consulting with numerous doctors in the US, we developed this AI powered note taking solution.
                With privacy and security at its core, we built a tool that empowers patients 
                to take control of their health information.
              </p>
              <p>
                Whether you're managing a chronic condition, caring for a loved one, or simply want to 
                be more informed about your health, Juno is here to help you every step of the way.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="section-header">
          <span className="section-label">TESTIMONIALS</span>
          <h2>What our users are saying</h2>
        </div>
        <div className="testimonials-container">
          <div className="testimonials-track">
            <div className="testimonial-card">
              <div className="quote-icon">"</div>
              <p className="testimonial-text">
                Juno has been a game-changer for managing my mother's appointments. 
                I can finally keep track of all her medications and doctor's instructions without feeling overwhelmed.
              </p>
              <div className="testimonial-author">
                <div className="author-role">Family Caregiver</div>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="quote-icon">"</div>
              <p className="testimonial-text">
                As someone with multiple chronic conditions, remembering everything from appointments is impossible. 
                Juno gives me peace of mind knowing I have accurate records of everything my doctors say.
              </p>
              <div className="testimonial-author">
                <div className="author-role">Patient</div>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="quote-icon">"</div>
              <p className="testimonial-text">
                The question generation feature is incredible. It helps me ask the right questions during appointments 
                so I don't leave confused. This app truly empowers patients.
              </p>
              <div className="testimonial-author">
                {/* <div className="author-name">Dr. Emily Rodriguez</div> */}
                <div className="author-role">Healthcare Advocate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="final-cta">
        <div className="cta-content">
          <h2>Ready to take control of your healthcare?</h2>
          <p>Join thousands of users who never miss important medical information.</p>
          <div className="cta-buttons">
            <a href={APP_URL} className="cta-button-large">Get Started Free</a>
          </div>
        </div>
      </section>

      {/* Footer */}
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
              <a href="#features">Features</a>
              <span className="separator">|</span>
              <a href="#how-it-works">How It Works</a>
              <span className="separator">|</span>
              <a href="#about">About</a>
              <span className="separator">|</span>
              <a href="#privacy">Privacy</a>
              <span className="separator">|</span>
              <a href="#terms">Terms</a>
              <span className="separator">|</span>
              <a href="#help">Help Center</a>
              <span className="separator">|</span>
              <a href="#contact">Contact</a>
            </div>
          </div>
          <div className="footer-section">
            <h4>Product</h4>
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
          </div>
          <div className="footer-section">
            <h4>Company</h4>
            <a href="#about">About</a>
            <a href="#privacy">Privacy</a>
            <a href="#terms">Terms</a>
          </div>
          <div className="footer-section">
            <h4>Support</h4>
            <a href="#help">Help Center</a>
            <a href="#contact">Contact</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 Juno. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default App
