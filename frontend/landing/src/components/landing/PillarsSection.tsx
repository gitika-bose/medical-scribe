function PillarsSection() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        <div className="text-center mb-16">
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
            style={{ fontFamily: 'var(--font-family-heading)', color: 'var(--dark-text-color)' }}
          >
            Juno democratizes access <br /> to medical understanding
          </h2>
        </div>

        {/* Three Pillar Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {/* Pillar 1 */}
          <div
            className="rounded-2xl p-8 lg:p-10 transition-all hover:shadow-xl"
            style={{
              background: 'linear-gradient(to bottom right, color-mix(in srgb, var(--primary-color) 5%, white), color-mix(in srgb, var(--accent-color) 5%, white))',
              border: '1px solid var(--light-border-color)',
            }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
              style={{ backgroundColor: 'var(--primary-color)' }}
            >
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3
              className="text-xl md:text-2xl font-bold mb-3"
              style={{ fontFamily: 'var(--font-family-heading)', color: 'var(--dark-text-color)' }}
            >
              Make It Understandable
            </h3>
            <p className="leading-relaxed mb-4 text-lg" style={{ color: 'var(--gray-text-color)' }}>
              We translate complex medical language, reports, and billing codes into plain, structured explanations.
            </p>
            <p className="font-semibold text-md" style={{ color: 'var(--primary-color)' }}>
              Understanding shouldn't require a medical degree.
            </p>
          </div>

          {/* Pillar 2 */}
          <div
            className="rounded-2xl p-8 lg:p-10 transition-all hover:shadow-xl"
            style={{
              background: 'linear-gradient(to bottom right, color-mix(in srgb, var(--accent-color) 5%, white), color-mix(in srgb, var(--accent4-color) 5%, white))',
              border: '1px solid var(--light-border-color)',
            }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
              style={{ backgroundColor: 'var(--accent-color)' }}
            >
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </div>
            <h3
              className="text-xl md:text-2xl font-bold mb-3"
              style={{ fontFamily: 'var(--font-family-heading)', color: 'var(--dark-text-color)' }}
            >
              See the Full Picture
            </h3>
            <p className="leading-relaxed mb-4 text-lg" style={{ color: 'var(--gray-text-color)' }}>
              Medical info is scattered across appointments, reports, and insurance docs. We bring it together into one clear narrative.
            </p>
            <p className="font-semibold text-md" style={{ color: 'var(--accent-color)' }}>
              Your health story, connected.
            </p>
          </div>

          {/* Pillar 3 */}
          <div
            className="rounded-2xl p-8 lg:p-10 transition-all hover:shadow-xl"
            style={{
              background: 'linear-gradient(to bottom right, color-mix(in srgb, var(--accent2-color) 5%, white), color-mix(in srgb, var(--accent3-color) 5%, white))',
              border: '1px solid var(--light-border-color)',
            }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
              style={{ backgroundColor: 'var(--accent2-color)' }}
            >
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3
              className="text-xl md:text-2xl font-bold mb-3"
              style={{ fontFamily: 'var(--font-family-heading)', color: 'var(--dark-text-color)' }}
            >
              Empower Your Decisions
            </h3>
            <p className="leading-relaxed mb-4 text-lg" style={{ color: 'var(--gray-text-color)' }}>
              Better understanding leads to better conversations. Ask smarter questions, prepare for visits, and make confident choices.
            </p>
            <p className="font-semibold text-md" style={{ color: 'var(--accent2-color)' }}>
              Knowledge is patient power.
            </p>
          </div>
        </div>

        {/* Bottom Values */}
        <div
          className="rounded-2xl p-8 lg:p-12"
          style={{ backgroundColor: 'var(--light-background-color)', border: '1px solid var(--light-border-color)' }}
        >
          <h3
            className="text-2xl font-bold text-center mb-10"
            style={{ fontFamily: 'var(--font-family-heading)', color: 'var(--dark-text-color)' }}
          >
            Built on principles that matter
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: 'white', border: '2px solid var(--primary-color)' }}
              >
                <svg className="w-7 h-7" style={{ color: 'var(--primary-color)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h4
                className="text-lg font-bold mb-2"
                style={{ fontFamily: 'var(--font-family-heading)', color: 'var(--dark-text-color)' }}
              >
                Patient-Centered
              </h4>
              <p style={{ color: 'var(--gray-text-color)' }}>
                Designed for patients, not providers
              </p>
            </div>

            <div className="text-center">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: 'white', border: '2px solid var(--accent-color)' }}
              >
                <svg className="w-7 h-7" style={{ color: 'var(--accent-color)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h4
                className="text-lg font-bold mb-2"
                style={{ fontFamily: 'var(--font-family-heading)', color: 'var(--dark-text-color)' }}
              >
                Privacy First
              </h4>
              <p style={{ color: 'var(--gray-text-color)' }}>
                Your health data stays yours
              </p>
            </div>

            <div className="text-center">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: 'white', border: '2px solid var(--accent2-color)' }}
              >
                <svg className="w-7 h-7" style={{ color: 'var(--accent2-color)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h4
                className="text-lg font-bold mb-2"
                style={{ fontFamily: 'var(--font-family-heading)', color: 'var(--dark-text-color)' }}
              >
                Complementary Care
              </h4>
              <p style={{ color: 'var(--gray-text-color)' }}>
                Works alongside your healthcare team
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PillarsSection
