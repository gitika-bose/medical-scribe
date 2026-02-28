import { useEffect } from 'react'
import '../App.css'
import { Link } from 'react-router-dom'
import Footer from '../components/shared/Footer'
import { analyticsEvents } from '../api/analytics'

function LandingPage() {
  useEffect(() => {
    analyticsEvents.landingPageOpen();
  }, []);

  const APP_URL = import.meta.env.VITE_APP_URL || 'https://app.meetjuno.health/';

  return (
    <div className="landing-page">
      {/* Header */}
      <header className="header">
        <Link to="/" className="logo-container" style={{ textDecoration: 'none' }}>
          <span className="logo-text">Juno</span>
        </Link>
        <div className="header-nav">
          <a href="#features" className="nav-link" onClick={() => analyticsEvents.landingClickNavLink('features')}>The Problem</a>
          <Link to="/aboutus" className="nav-link" onClick={() => analyticsEvents.landingClickNavLink('about-us')}>About Us</Link>
        </div>
        <div className="header-actions">
          <a href={APP_URL} className="login-button" onClick={() => analyticsEvents.landingClickJoinBeta('header')}>Login</a>
          <Link to="/upload-understand" className="cta-button-small" onClick={() => analyticsEvents.landingClickTryNow('header')}>Try it now</Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1>Doctor appointments are confusing.</h1>
            <h2 color='blue'>Juno turns them into clear next steps.</h2>
            <p>
             Upload notes or record a medical visit.
             Juno explains what matters in plain language so you don’t miss anything.
            </p>
            <div className="hero-cta">
              <Link to="/upload-understand" className="cta-button" onClick={() => analyticsEvents.landingClickTryNow('hero')}>Try it now</Link>
              {/* <Link to="/beta" className="cta-button-outline" onClick={() => analyticsEvents.landingClickJoinBeta('hero')}>Join the Beta</Link> */}
            </div>
            <div className="trust-badges">
              <span className="badge">No login required</span>
              <span className="badge">Instant results</span>
            </div>
          </div>
          <div className="hero-visual">
            <div className="card-mockup">
              <img src="/cropDemo2.gif" alt="Juno App Demo" className="app-demo-gif" />
            </div>
          </div>
        </div>
      </section>

      {/* Who for? Section */}
      {/* <section className="audience" id="audience">
        <div className="section-header">
          <span className="section-label">WHO IS THIS FOR?</span>
          <h2>Juno is especially helpful for</h2>
        </div>
        <div className="audience-grid">
          <div className="audience-card">
            <h3>Family & Caregivers</h3>
            <p>
              You’re managing care for a parent, partner, or anyone else.
            </p>
          </div>
          <div className="audience-card">
            <h3>ESL Students</h3>
            <p>
              English isn't your first language.
            </p>
          </div>
          <div className="audience-card">
            <h3>New patients</h3>
            <p>
              Appointments feel rushed and overwhelming.
            </p>
          </div>
          <div className="audience-card">
            <h3>Everyone!</h3>
            <p>
              You leave visits unsure what to do next.
            </p>
          </div>
        </div>
      </section> */}

      {/* How It Works Section */}
      {/* <section className="how-it-works" id="how-it-works">
        <div className="section-header-dark">
          <h2>How Juno works</h2>
          <p>In three simple steps</p>
        </div>
        <div className="steps-container">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3>Let Juno listen</h3>
            <p>
              Paste notes, upload recordings, or live record an appointment.
            </p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h3>Hit Explain</h3>
            <p>
              Juno summarizes what matters with clear next steps and follow-up questions to ask
            </p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h3>Review & share</h3>
            <p>
              Share with family, caregivers, or keep it for your records.
            </p>
          </div>
        </div>
      </section> */}

      {/* Features Section */}
      <section className="features" id="features">
        <div className="section-header">
          <span className="section-label">THE MOMENT WE’RE FIXING</span>
          <h2>After appointments, people often</h2>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <h3>Forget key instructions</h3>
            <p>
              Juno doesn't choose what to show you. Even the smallest detail is captured
              and instantly available to you.
            </p>
          </div>
          <div className="feature-card">
            <h3>Misunderstand medications</h3>
            <p>
              Juno lists all follow-up actions, including medications with details like dosages and timings.
            </p>
          </div>
          <div className="feature-card">
            <h3>Can’t explain things to family</h3>
            <p>
              Juno allows you to easily share this information with loved ones and caregivers, giving them full access if you prefer.
            </p>
          </div>
          <div className="feature-card">
            <h3>Feel embarrassed repeteadly calling the doctor with questions</h3>
            <p>
              Juno generates all the relevant questions you need to ask at once, at the appointment or afterwards.
            </p>
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
            <a href={APP_URL} className="cta-button-large" onClick={() => analyticsEvents.landingClickGetStarted()}>Get Started</a>
            <Link to="/beta" className="cta-button-secondary" onClick={() => analyticsEvents.landingClickJoinBeta('cta')}>Join the Beta List</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}

export default LandingPage
