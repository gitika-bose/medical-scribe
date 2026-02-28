function PillarsSection() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span
            className="inline-block px-4 py-2 rounded-full font-semibold text-sm mb-4"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--primary-color) 10%, transparent)',
              color: 'var(--primary-color)',
            }}
          >
            Our Vision
          </span>
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6"
            style={{ fontFamily: 'var(--font-family-heading)', color: 'var(--dark-text-color)' }}
          >
            Three Core Pillars
          </h2>
          <p className="text-xl max-w-2xl mx-auto" style={{ color: 'var(--gray-text-color)' }}>
            The foundation of everything we build at Juno
          </p>
        </div>

        <div className="space-y-8">
          {/* Pillar 1 */}
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="relative">
              <div
                className="absolute -inset-4 rounded-3xl opacity-20"
                style={{ background: 'linear-gradient(to right, var(--primary-color), var(--accent-color))' }}
              />
              <div
                className="relative rounded-2xl p-8 lg:p-12"
                style={{
                  background: 'linear-gradient(to bottom right, color-mix(in srgb, var(--primary-color) 5%, transparent), color-mix(in srgb, var(--accent-color) 5%, transparent))',
                  border: '1px solid var(--light-border-color)',
                }}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: 'var(--primary-color)' }}
                >
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3
                  className="text-2xl md:text-3xl font-bold mb-4"
                  style={{ fontFamily: 'var(--font-family-heading)', color: 'var(--dark-text-color)' }}
                >
                  Make Medical Information Understandable
                </h3>
                <p className="text-lg leading-relaxed" style={{ color: 'var(--gray-text-color)' }}>
                  We translate complex medical language, reports, and billing codes into plain,
                  structured explanations designed for real comprehension.
                </p>
                <p className="mt-4 font-semibold" style={{ color: 'var(--primary-color)' }}>
                  Understanding shouldn't require a medical degree.
                </p>
              </div>
            </div>
            <div className="hidden lg:block">
              <img
                src="https://imagedelivery.net/xaKlCos5cTg_1RWzIu_h-A/3ba03b47-8346-4fa4-f383-36161216e300/publicContain"
                alt="Doctor Work with AI and Medical Report"
                className="w-full h-80 object-cover rounded-2xl shadow-xl"
              />
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="hidden lg:block lg:order-2">
              <img
                src="https://imagedelivery.net/xaKlCos5cTg_1RWzIu_h-A/e2a966cc-46ee-44af-e210-9b142321c100/publicContain"
                alt="Healthcare and medical service concept"
                className="w-full h-80 object-cover rounded-2xl shadow-xl"
              />
            </div>
            <div className="lg:order-1">
              <div className="relative">
                <div
                  className="absolute -inset-4 rounded-3xl opacity-20"
                  style={{ background: 'linear-gradient(to right, var(--accent-color), var(--accent4-color))' }}
                />
                <div
                  className="relative rounded-2xl p-8 lg:p-12"
                  style={{
                    background: 'linear-gradient(to bottom right, color-mix(in srgb, var(--accent-color) 5%, transparent), color-mix(in srgb, var(--accent4-color) 5%, transparent))',
                    border: '1px solid var(--light-border-color)',
                  }}
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                    style={{ backgroundColor: 'var(--accent-color)' }}
                  >
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </div>
                  <h3
                    className="text-2xl md:text-3xl font-bold mb-4"
                    style={{ fontFamily: 'var(--font-family-heading)', color: 'var(--dark-text-color)' }}
                  >
                    Create Holistic Understanding Across the Care Journey
                  </h3>
                  <p className="text-lg leading-relaxed" style={{ color: 'var(--gray-text-color)' }}>
                    Medical information is scattered — across appointments, reports, test results, and
                    insurance documents. Juno brings it together into a coherent, continuous narrative
                    so patients can see the full picture of their care.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="relative">
                <div
                  className="absolute -inset-4 rounded-3xl opacity-20"
                  style={{ background: 'linear-gradient(to right, var(--accent2-color), var(--accent3-color))' }}
                />
                <div
                  className="relative rounded-2xl p-8 lg:p-12"
                  style={{
                    background: 'linear-gradient(to bottom right, color-mix(in srgb, var(--accent2-color) 5%, transparent), color-mix(in srgb, var(--accent3-color) 5%, transparent))',
                    border: '1px solid var(--light-border-color)',
                  }}
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                    style={{ backgroundColor: 'var(--accent2-color)' }}
                  >
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3
                    className="text-2xl md:text-3xl font-bold mb-4"
                    style={{ fontFamily: 'var(--font-family-heading)', color: 'var(--dark-text-color)' }}
                  >
                    Empower Informed Participation
                  </h3>
                  <p className="text-lg leading-relaxed mb-6" style={{ color: 'var(--gray-text-color)' }}>
                    Better understanding leads to better conversations. Juno equips patients to:
                  </p>
                  <ul className="space-y-3">
                    {[
                      'Ask smarter questions',
                      'Prepare for appointments',
                      'Track their treatment journey',
                      'Make confident, informed decisions',
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
                  <p className="mt-6 font-semibold" style={{ color: 'var(--accent2-color)' }}>
                    Medical literacy is the foundation of patient empowerment.
                  </p>
                </div>
              </div>
            </div>
            <div className="hidden lg:block">
              <img
                src="https://imagedelivery.net/xaKlCos5cTg_1RWzIu_h-A/fc10cb6c-eb87-4f18-d658-e86c1ac76f00/public"
                alt="Digital checklist with doctor analyzing medical records"
                className="w-full h-80 object-cover rounded-2xl shadow-xl"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PillarsSection
