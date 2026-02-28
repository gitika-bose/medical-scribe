import { Link } from 'react-router-dom'

function AvailableTodaySection() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6"
            style={{ fontFamily: 'var(--font-family-heading)', color: 'var(--dark-text-color)' }}
          >
            Start understanding your health today.
          </h2>
          <p className="text-xl max-w-2xl mx-auto" style={{ color: 'var(--gray-text-color)' }}>
            Juno is already helping patients gain clarity — right now, in real appointments, and
            with any medical document.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Live Feature 1 */}
          <div
            className="relative rounded-3xl p-1"
            style={{ background: 'linear-gradient(to bottom right, var(--primary-color), var(--accent-color))' }}
          >
            <div className="bg-white rounded-3xl p-8 lg:p-10 h-full">
              <div className="flex items-center gap-3 mb-6">
                <span className="flex h-3 w-3 relative">
                  <span
                    className="animate-ping absolute inline-flex h-3 w-3 rounded-full opacity-75"
                    style={{ backgroundColor: 'var(--accent-color)' }}
                  />
                  <span
                    className="relative inline-flex rounded-full h-3 w-3"
                    style={{ backgroundColor: 'var(--accent-color)' }}
                  />
                </span>
                <span className="font-semibold text-sm" style={{ color: 'var(--accent-color)' }}>
                  Live
                </span>
              </div>

              <h3
                className="text-2xl font-bold mb-4"
                style={{ fontFamily: 'var(--font-family-heading)', color: 'var(--dark-text-color)' }}
              >
                Live Appointment Clarity
              </h3>
              <p className="text-lg mb-8" style={{ color: 'var(--gray-text-color)' }}>
                Real-time structured notes and intelligent question support during your
                appointments. Never miss important details again.
              </p>

              <ul className="space-y-3 mb-8">
                {[
                  'Real-time transcription',
                  'Key points extraction',
                  'Smart question suggestions',
                  'Next steps summary',
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
                    <span style={{ color: 'var(--dark-text-color)' }}>{item}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/contact"
                className="inline-flex items-center font-semibold transition-all"
                style={{ color: 'var(--primary-color)' }}
              >
                Get Started
                <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Live Feature 2 */}
          <div
            className="relative rounded-3xl p-1"
            style={{ background: 'linear-gradient(to bottom right, var(--accent2-color), var(--accent3-color))' }}
          >
            <div className="bg-white rounded-3xl p-8 lg:p-10 h-full">
              <div className="flex items-center gap-3 mb-6">
                <span className="flex h-3 w-3 relative">
                  <span
                    className="animate-ping absolute inline-flex h-3 w-3 rounded-full opacity-75"
                    style={{ backgroundColor: 'var(--accent2-color)' }}
                  />
                  <span
                    className="relative inline-flex rounded-full h-3 w-3"
                    style={{ backgroundColor: 'var(--accent2-color)' }}
                  />
                </span>
                <span className="font-semibold text-sm" style={{ color: 'var(--accent2-color)' }}>
                  Live
                </span>
              </div>

              <h3
                className="text-2xl font-bold mb-4"
                style={{ fontFamily: 'var(--font-family-heading)', color: 'var(--dark-text-color)' }}
              >
                Multi-Format Medical Understanding
              </h3>
              <p className="text-lg mb-8" style={{ color: 'var(--gray-text-color)' }}>
                Upload recordings, documents, or notes — receive clear explanations and actionable
                next steps in return.
              </p>

              <ul className="space-y-3 mb-8">
                {[
                  'Audio recording analysis',
                  'Document parsing',
                  'Plain language translation',
                  'Actionable insights',
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
                    <span style={{ color: 'var(--dark-text-color)' }}>{item}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/contact"
                className="inline-flex items-center font-semibold transition-all"
                style={{ color: 'var(--accent2-color)' }}
              >
                Get Started
                <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Link
            to="/contact"
            className="inline-flex items-center justify-center text-white px-10 py-5 font-bold text-xl transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
            style={{
              backgroundColor: 'var(--primary-color)',
              borderRadius: 'var(--button-rounded-radius)',
            }}
          >
            Start Your Journey to Clarity
            <svg className="ml-3 w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}

export default AvailableTodaySection
