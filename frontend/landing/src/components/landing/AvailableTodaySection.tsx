function AvailableTodaySection() {
  return (
    <section id="available-today" className="py-24" style={{ backgroundColor: 'var(--medium-background-color)' }}>
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        <div className="text-center mb-16">
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
            style={{ fontFamily: 'var(--font-family-heading)', color: 'var(--dark-text-color)' }}
          >
            Ready when you are.
          </h2>
          <p className="text-xl max-w-2xl mx-auto" style={{ color: 'var(--gray-text-color)' }}>
            Juno is live and helping patients gain clarity — in real appointments and with any medical document.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Feature 1: Live Appointment Clarity */}
          <div
            className="relative rounded-3xl p-1"
            style={{ background: 'linear-gradient(to bottom right, var(--primary-color), var(--accent-color))' }}
          >
            <div className="bg-white rounded-3xl p-8 lg:p-10 h-full flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, var(--primary-color), var(--accent-color))' }}
                >
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <span
                  className="font-bold text-sm tracking-wide uppercase"
                  style={{ color: 'var(--primary-color)' }}
                >
                  Available Now
                </span>
              </div>

              <h3
                className="text-3xl font-bold mb-3"
                style={{ fontFamily: 'var(--font-family-heading)', color: 'var(--dark-text-color)' }}
              >
                Medical Notetaker
              </h3>
              <p className="mb-6 text-xl" style={{ color: 'var(--gray-text-color)' }}>
                Take live medical notes and ask smart questions during your visits. Never miss any important details.
              </p>

              <ul className="space-y-2 mb-8">
                {[
                  'Real-time medical note taker',
                  'Smart question suggestions',
                  'Appointment summary and action items',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <svg
                      className="w-5 h-5 flex-shrink-0"
                      style={{ color: 'var(--accent-color)' }}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-lg" style={{ color: 'var(--dark-text-color)' }}>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                <a
                  href="https://app.meetjuno.health"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center text-white px-8 py-3 font-semibold text-base transition-all hover:scale-105 hover:shadow-lg"
                  style={{
                    background: 'linear-gradient(to right, var(--primary-color), var(--accent-color))',
                    borderRadius: 'var(--button-rounded-radius)',
                    textDecoration: 'none',
                  }}
                >
                  Start Notetaking
                  <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Feature 2: Explain My Appointment */}
          <div
            className="relative rounded-3xl p-1"
            style={{ background: 'linear-gradient(to bottom right, var(--accent2-color), var(--accent3-color))' }}
          >
            <div className="bg-white rounded-3xl p-8 lg:p-10 h-full flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, var(--accent2-color), var(--accent3-color))' }}
                >
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span
                  className="font-bold text-sm tracking-wide uppercase"
                  style={{ color: 'var(--accent2-color)' }}
                >
                  Available Now
                </span>
              </div>

              <h3
                className="text-3xl font-bold mb-3"
                style={{ fontFamily: 'var(--font-family-heading)', color: 'var(--dark-text-color)' }}
              >
                Explain My Appointment
              </h3>
              <p className="mb-6 text-xl" style={{ color: 'var(--gray-text-color)' }}>
                Upload recordings, documents, or notes and get clear explanations and next steps.
              </p>

              <ul className="space-y-2 mb-8">
                {[
                  'Medical documents and recording upload',
                  'Plain language translation',
                  'Actionable insights and follow up guidance',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <svg
                      className="w-5 h-5 flex-shrink-0"
                      style={{ color: 'var(--accent2-color)' }}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-lg" style={{ color: 'var(--dark-text-color)' }}>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                <a
                  href="/explain-my-appointment"
                  className="inline-flex items-center justify-center text-white px-8 py-3 font-semibold text-base transition-all hover:scale-105 hover:shadow-lg"
                  style={{
                    background: 'linear-gradient(to right, var(--accent2-color), var(--accent3-color))',
                    borderRadius: 'var(--button-rounded-radius)',
                    textDecoration: 'none',
                  }}
                >
                  Explain now
                  <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
                <p className="text-xs mt-2" style={{ color: 'var(--gray-text-color)' }}>
                  No login required
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AvailableTodaySection
