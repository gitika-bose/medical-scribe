import { Link } from 'react-router-dom'

function AvailableTodaySection() {
  return (
    <section className="py-24 bg-white">
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
                  Live Now
                </span>
              </div>

              <h3
                className="text-3xl font-bold mb-3"
                style={{ fontFamily: 'var(--font-family-heading)', color: 'var(--dark-text-color)' }}
              >
                Live Appointment Clarity
              </h3>
              <p className="mb-6 text-xl" style={{ color: 'var(--gray-text-color)' }}>
                Real-time structured notes and smart question support during your visits. Never miss important details.
              </p>

              <ul className="space-y-2 mb-6">
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
                  Live Now
                </span>
              </div>

              <h3
                className="text-3xl font-bold mb-3"
                style={{ fontFamily: 'var(--font-family-heading)', color: 'var(--dark-text-color)' }}
              >
                Upload & Understand
              </h3>
              <p className="mb-6 text-xl" style={{ color: 'var(--gray-text-color)' }}>
                Upload recordings, documents, or notes — get clear explanations and actionable next steps.
              </p>

              <ul className="space-y-2 mb-6">
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
            </div>
          </div>
        </div>

        {/* Prominent CTA */}
        <div className="mt-14 text-center">
          <Link
            to="/contact"
            className="inline-flex items-center justify-center text-white px-12 py-5 font-bold text-xl transition-all transform hover:scale-105 shadow-xl hover:shadow-2xl"
            style={{
              background: 'linear-gradient(to right, var(--primary-color), var(--accent-color))',
              borderRadius: 'var(--button-rounded-radius)',
            }}
          >
            Get Started — It's Free
            <svg className="ml-3 w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
          <p className="mt-4 text-sm" style={{ color: 'var(--gray-text-color)' }}>
            No credit card required. Start understanding your health today.
          </p>
        </div>
      </div>
    </section>
  )
}

export default AvailableTodaySection
