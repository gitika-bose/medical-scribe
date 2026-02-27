import { useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import '../App.css'
import './ExplainApp.css'
import Footer from '../components/shared/Footer'
import ExplainAppComponent from '../components/ExplainAppComponent'
import { analyticsEvents } from '../api/analytics'

function ExplainAppPage() {
  useEffect(() => {
    analyticsEvents.landingPageOpen();
  }, []);

  const tryComponentRef = useRef<HTMLDivElement>(null);

  const scrollToTry = () => {
    analyticsEvents.landingClickTryNow('hero');
    tryComponentRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="try-page">
      {/* Header */}
      <header className="header">
        <Link to="/" className="logo-container" style={{ textDecoration: 'none' }}>
          <span className="logo-text">Juno</span>
        </Link>
        <div className="header-actions">
          <Link
            to="/"
            className="nav-link"
            onClick={() => analyticsEvents.tryClickBackHome()}
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Hero – Landing style */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1>Doctor appointments are confusing.</h1>
            <h2 color="blue">Juno turns them into clear next steps.</h2>
            <p>
              Upload notes or record a medical visit.
              Juno explains what matters in plain language so you don't miss anything.
            </p>
            <div className="hero-cta">
              <button className="cta-button" onClick={scrollToTry}>
                Try it now
              </button>
              <Link
                to="/beta"
                className="cta-button-outline"
                onClick={() => analyticsEvents.landingClickJoinBeta('hero')}
              >
                Join the Beta
              </Link>
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

      {/* ExplainApp Component + Feedback */}
      <ExplainAppComponent ref={tryComponentRef} />

      {/* THE MOMENT WE'RE FIXING section */}
      <section className="features" id="features">
        <div className="section-header">
          <span className="section-label">THE MOMENT WE'RE FIXING</span>
          <h2>After appointments, people often</h2>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <h3>Forget key instructions</h3>
            <p>
              Get organized summaries with diagnoses, treatment plans, medications,
              and follow-up instructions automatically extracted.
            </p>
          </div>
          <div className="feature-card">
            <h3>Misunderstand medications</h3>
            <p>
              During the appointment, Juno helps you ask relevant questions
              so you never leave the appointment room confused.
            </p>
          </div>
          <div className="feature-card">
            <h3>Can't explain things to family</h3>
            <p>
              Your data is encrypted and automatically deleted after processing.
              We only keep what you see and nothing more.
            </p>
          </div>
          <div className="feature-card">
            <h3>Feel embarrassed repeatedly calling the doctor with questions</h3>
            <p>
              Get all the relevant questions you need to ask at once, at the appointment or afterwards.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default ExplainAppPage
