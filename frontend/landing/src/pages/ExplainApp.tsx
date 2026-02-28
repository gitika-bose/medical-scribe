import { useRef, useEffect } from 'react'
import './NewLandingPage.css'
import './ExplainApp.css'
import Header from '../components/shared/Header'
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
    <div className="min-h-screen w-full" style={{ fontFamily: 'var(--font-family-body)' }}>
      <Header />

      {/* Hero Section – matching landing page design */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-[var(--light-background-color)] to-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="relative z-10">
              <h1
                className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6"
                style={{
                  fontFamily: 'var(--font-family-heading)',
                  color: 'var(--dark-text-color)',
                }}
              >
                Confused after a visit?{' '}
                <span style={{ color: 'var(--primary-color)' }}>Get clarity now.</span>
              </h1>
              <p
                className="text-xl mb-8"
                style={{
                  fontFamily: 'var(--font-family-body)',
                  color: 'var(--gray-text-color)',
                }}
              >
                Upload your medical notes, recordings, or documents. Juno explains what matters in plain language — so you don't miss anything important.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={scrollToTry}
                  className="inline-flex items-center justify-center text-white px-8 py-4 font-semibold text-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl border-none cursor-pointer"
                  style={{
                    backgroundColor: 'var(--primary-color)',
                    borderRadius: 'var(--button-rounded-radius)',
                  }}
                >
                  Try it now
                </button>
              </div>
              <div className="flex gap-6 mt-6">
                <span
                  className="flex items-center gap-2 text-sm font-medium"
                  style={{ color: 'var(--gray-text-color)' }}
                >
                  <svg className="w-4 h-4" style={{ color: 'var(--accent-color)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  No login required
                </span>
                <span
                  className="flex items-center gap-2 text-sm font-medium"
                  style={{ color: 'var(--gray-text-color)' }}
                >
                  <svg className="w-4 h-4" style={{ color: 'var(--accent-color)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Instant results
                </span>
                <span
                  className="flex items-center gap-2 text-sm font-medium"
                  style={{ color: 'var(--gray-text-color)' }}
                >
                  <svg className="w-4 h-4" style={{ color: 'var(--accent-color)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Files deleted after use
                </span>
              </div>
            </div>

            {/* Right Visual */}
            {/* <div className="relative hidden lg:block">
              <div className="w-full max-w-md mx-auto">
                <div
                  className="rounded-2xl p-8 shadow-2xl"
                  style={{
                    backgroundColor: 'white',
                    border: '1px solid var(--light-border-color)',
                  }}
                >
                  <div className="flex gap-3 mb-5">
                    <div
                      className="flex-1 rounded-lg px-3 py-2.5 text-center"
                      style={{
                        border: '2px dashed var(--dark-border-color)',
                        backgroundColor: 'var(--light-background-color)',
                      }}
                    >
                      <div className="text-lg mb-0.5">📄</div>
                      <div className="text-xs font-medium" style={{ color: 'var(--gray-text-color)' }}>Documents</div>
                    </div>
                    <div
                      className="flex-1 rounded-lg px-3 py-2.5 text-center"
                      style={{
                        border: '2px dashed var(--dark-border-color)',
                        backgroundColor: 'var(--light-background-color)',
                      }}
                    >
                      <div className="text-lg mb-0.5">🎙️</div>
                      <div className="text-xs font-medium" style={{ color: 'var(--gray-text-color)' }}>Recordings</div>
                    </div>
                    <div
                      className="flex-1 rounded-lg px-3 py-2.5 text-center"
                      style={{
                        border: '2px dashed var(--dark-border-color)',
                        backgroundColor: 'var(--light-background-color)',
                      }}
                    >
                      <div className="text-lg mb-0.5">📝</div>
                      <div className="text-xs font-medium" style={{ color: 'var(--gray-text-color)' }}>Notes</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--primary-color) 15%, transparent)' }}
                      >
                        <span className="text-sm">📋</span>
                      </div>
                      <span className="text-sm font-medium" style={{ color: 'var(--dark-text-color)' }}>
                        Explained in simple language
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--accent-color) 15%, transparent)' }}
                      >
                        <span className="text-sm">✅</span>
                      </div>
                      <span className="text-sm font-medium" style={{ color: 'var(--dark-text-color)' }}>
                        Clear action items
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--accent2-color) 15%, transparent)' }}
                      >
                        <span className="text-sm">❓</span>
                      </div>
                      <span className="text-sm font-medium" style={{ color: 'var(--dark-text-color)' }}>
                        Critical questions to ask your doctor
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div> */}
            {/* Right Visual */}
            <div className="relative scale-[0.75] -my-8 sm:scale-[0.85] sm:-my-4 md:scale-90 md:-my-2 lg:scale-100 lg:my-0 origin-center">
              <div className="relative w-full max-w-md mx-auto">
                {/* Upload visual */}
                <div
                  className="rounded-2xl p-8 shadow-2xl"
                  style={{
                    backgroundColor: 'white',
                    border: '1px solid var(--light-border-color)',
                  }}
                >
                  {/* Fake upload area */}
                  <div className="flex gap-3 mb-5">
                    <div
                      className="flex-1 rounded-lg px-3 py-2.5 text-center"
                      style={{
                        border: '2px dashed var(--dark-border-color)',
                        backgroundColor: 'var(--light-background-color)',
                      }}
                    >
                      <div className="text-lg mb-0.5">📄</div>
                      <div className="text-xs font-medium" style={{ color: 'var(--gray-text-color)' }}>Documents</div>
                    </div>
                    <div
                      className="flex-1 rounded-lg px-3 py-2.5 text-center"
                      style={{
                        border: '2px dashed var(--dark-border-color)',
                        backgroundColor: 'var(--light-background-color)',
                      }}
                    >
                      <div className="text-lg mb-0.5">🎙️</div>
                      <div className="text-xs font-medium" style={{ color: 'var(--gray-text-color)' }}>Recordings</div>
                    </div>
                    <div
                      className="flex-1 rounded-lg px-3 py-2.5 text-center"
                      style={{
                        border: '2px dashed var(--dark-border-color)',
                        backgroundColor: 'var(--light-background-color)',
                      }}
                    >
                      <div className="text-lg mb-0.5">📝</div>
                      <div className="text-xs font-medium" style={{ color: 'var(--gray-text-color)' }}>Notes</div>
                    </div>
                  </div>
                  {/* Fake result preview */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--primary-color) 15%, transparent)' }}
                      >
                        <span className="text-sm">📋</span>
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-medium" style={{ color: 'var(--dark-text-color)' }}>
                          Explained in simple language
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--accent-color) 15%, transparent)' }}
                      >
                        <span className="text-sm">✅</span>
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-medium" style={{ color: 'var(--dark-text-color)' }}>
                          Clear action items
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: 'color-mix(in srgb, var(--accent2-color) 15%, transparent)' }}
                      >
                        <span className="text-sm">❓</span>
                      </div>
                      <div className="flex-1">
                        <span className="text-sm font-medium" style={{ color: 'var(--dark-text-color)' }}>
                          Critical questions to ask your doctor
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Try It Section */}
      <section
        ref={tryComponentRef}
        className="py-16"
        style={{ backgroundColor: 'var(--medium-background-color)' }}
      >
        <ExplainAppComponent />
          
      </section>

      {/* THE GAP WE'RE BRIDGING section – matching landing page dark section style */}
      <section className="py-24" style={{ backgroundColor: 'var(--dark-background-color)' }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
          <div className="text-center mb-16">
            <span
              className="inline-block text-xs font-bold tracking-widest uppercase mb-4"
              style={{ color: 'var(--accent-color)' }}
            >
              THE GAP WE'RE BRIDGING
            </span>
            <h2
              className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4"
              style={{ fontFamily: 'var(--font-family-heading)' }}
            >
              After appointments, people often…
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: (
                  <svg className="w-7 h-7" style={{ color: 'var(--primary-color)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ),
                iconBg: 'var(--primary-color)',
                hoverBorder: 'var(--primary-color)',
                title: 'Forget key instructions',
                description:
                  'Discharge summaries and treatment plans are dense. Juno organizes them into clear, structured summaries you can actually revisit.',
              },
              {
                icon: (
                  <svg className="w-7 h-7" style={{ color: 'var(--accent2-color)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                ),
                iconBg: 'var(--accent2-color)',
                hoverBorder: 'var(--accent2-color)',
                title: 'Misunderstand medications',
                description:
                  'Dosages, timing, interactions — it\u2019s a lot. Upload your notes and Juno breaks down exactly what you need to take and when.',
              },
              {
                icon: (
                  <svg className="w-7 h-7" style={{ color: 'var(--accent-color)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                ),
                iconBg: 'var(--accent-color)',
                hoverBorder: 'var(--accent-color)',
                title: "Can't explain things to family",
                description:
                  'Juno turns complex medical language into plain explanations that are easy to share and discuss with loved ones.',
              },
              {
                icon: (
                  <svg className="w-7 h-7" style={{ color: 'var(--accent3-color)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                iconBg: 'var(--accent3-color)',
                hoverBorder: 'var(--accent3-color)',
                title: 'Don\'t know what to ask next',
                description:
                  'Juno generates the follow-up questions you should ask your doctor — so you never leave a visit with unanswered concerns.',
              },
            ].map((card, index) => (
              <div
                key={index}
                className="rounded-2xl p-8 transition-all group"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(4px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = card.hoverBorder
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255, 255, 255, 0.1)'
                }}
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-colors"
                  style={{ backgroundColor: `color-mix(in srgb, ${card.iconBg} 20%, transparent)` }}
                >
                  {card.icon}
                </div>
                <h3
                  className="text-xl font-bold text-white mb-3"
                  style={{ fontFamily: 'var(--font-family-heading)' }}
                >
                  {card.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">{card.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <p
              className="text-2xl font-bold text-white"
              style={{ fontFamily: 'var(--font-family-heading)' }}
            >
              <span style={{ color: 'var(--accent-color)' }}>Upload once. Understand everything.</span>
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
