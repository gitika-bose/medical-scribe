function MissionSection() {
  return (
    <section
      className="py-24"
      style={{ background: 'linear-gradient(to bottom right, var(--light-background-color), white)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8"
            style={{ fontFamily: 'var(--font-family-heading)', color: 'var(--dark-text-color)' }}
          >
            We believe medical understanding should be accessible to everyone.
          </h2>

          {/* Gradient border card */}
          <div
            className="rounded-3xl p-1 mb-10"
            style={{ background: 'linear-gradient(to right, var(--primary-color), var(--accent-color))' }}
          >
            <div className="bg-white rounded-3xl p-8 md:p-12">
              <p
                className="text-2xl md:text-3xl font-bold leading-relaxed"
                style={{ fontFamily: 'var(--font-family-heading)', color: 'var(--primary-color)' }}
              >
                Juno democratizes access to medical understanding.
              </p>
              <p className="text-xl mt-6" style={{ color: 'var(--gray-text-color)' }}>
                Not by replacing doctors. Not by diagnosing. But by transforming complex medical
                information into clarity.
              </p>
            </div>
          </div>

          {/* Three pillars */}
          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="flex flex-col items-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: 'color-mix(in srgb, var(--primary-color) 10%, transparent)' }}
              >
                <svg className="w-8 h-8" style={{ color: 'var(--primary-color)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3
                className="text-lg font-bold"
                style={{ fontFamily: 'var(--font-family-heading)', color: 'var(--dark-text-color)' }}
              >
                Patient-Centered
              </h3>
              <p className="mt-2" style={{ color: 'var(--gray-text-color)' }}>
                Designed for patients, not providers
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: 'color-mix(in srgb, var(--accent-color) 10%, transparent)' }}
              >
                <svg className="w-8 h-8" style={{ color: 'var(--accent-color)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3
                className="text-lg font-bold"
                style={{ fontFamily: 'var(--font-family-heading)', color: 'var(--dark-text-color)' }}
              >
                Privacy First
              </h3>
              <p className="mt-2" style={{ color: 'var(--gray-text-color)' }}>
                Your health data stays yours
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: 'color-mix(in srgb, var(--accent2-color) 10%, transparent)' }}
              >
                <svg className="w-8 h-8" style={{ color: 'var(--accent2-color)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3
                className="text-lg font-bold"
                style={{ fontFamily: 'var(--font-family-heading)', color: 'var(--dark-text-color)' }}
              >
                Complementary
              </h3>
              <p className="mt-2" style={{ color: 'var(--gray-text-color)' }}>
                Works with your healthcare team
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default MissionSection
