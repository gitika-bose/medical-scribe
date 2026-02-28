function HeroSection() {
  return (
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
              Medical clarity, <span style={{ color: 'var(--accent4-color)'}}>when it matters most.</span>
            </h1>
            <p
              className="text-xl mb-8"
              style={{
                fontFamily: 'var(--font-family-body)',
                color: 'var(--gray-text-color)',
              }}
            >
              Juno transforms complex health information into clear, structured understanding so you can make confident decisions about your care.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="#available-today"
                className="inline-flex items-center justify-center text-white px-8 py-4 font-semibold text-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
                style={{
                  backgroundColor: 'var(--primary-color)',
                  borderRadius: 'var(--button-rounded-radius)',
                }}
              >
                Get Started
                <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>
          </div>

          {/* Right Animation Visual */}
          <div className="relative scale-[0.6] -my-24 sm:scale-[0.75] sm:-my-12 md:scale-[0.85] md:-my-6 lg:scale-100 lg:my-0 origin-center">
            {/* Connecting Lines (SVG) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 400">
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#6B5FD8', stopOpacity: 0.6 }} />
                  <stop offset="100%" style={{ stopColor: '#00D4AA', stopOpacity: 0.8 }} />
                </linearGradient>
              </defs>
              <path d="M80 90 Q 150 190, 200 195" stroke="url(#lineGradient)" strokeWidth="2" fill="none" className="animate-pulse" style={{ animationDuration: '2s' }} />
              <path d="M50 160 Q 150 190, 200 195" stroke="url(#lineGradient)" strokeWidth="2" fill="none" className="animate-pulse" style={{ animationDuration: '2s' }} />
              <path d="M300 110 Q 250 170, 200 195" stroke="url(#lineGradient)" strokeWidth="2" fill="none" className="animate-pulse" style={{ animationDuration: '2.5s' }} />
              <path d="M60 280 Q 100 250, 180 210" stroke="url(#lineGradient)" strokeWidth="2" fill="none" className="animate-pulse" style={{ animationDuration: '3s' }} />
              <path d="M320 270 Q 280 240, 220 210" stroke="url(#lineGradient)" strokeWidth="2" fill="none" className="animate-pulse" style={{ animationDuration: '2.8s' }} />
            </svg>

            <div className="relative w-full aspect-square max-w-lg mx-auto">
              {/* Scattered Documents */}
              <div
                className="absolute top-0 left-4 w-24 h-32 bg-white rounded-lg shadow-lg p-2 transform -rotate-12"
                style={{ borderColor: 'var(--light-border-color)', borderWidth: 1, animationDuration: '3s' }}
              >
                <div className="w-full h-4 rounded mb-2" style={{ backgroundColor: 'var(--primary-color)', opacity: 0.2 }} />
                <div className="w-full h-2 rounded mb-1" style={{ backgroundColor: 'var(--dark-border-color)' }} />
                <div className="w-3/4 h-2 rounded mb-1" style={{ backgroundColor: 'var(--dark-border-color)' }} />
                <div className="w-1/2 h-2 rounded mb-1" style={{ backgroundColor: 'var(--dark-border-color)' }} />
                <div className="w-3/4 h-2 rounded mb-1" style={{ backgroundColor: 'var(--dark-border-color)' }} />

                <span
                  className="absolute -top-2 -right-2 text-white text-xs px-2 py-1 rounded-full"
                  style={{ backgroundColor: 'var(--accent2-color)' }}
                >
                  Insurance
                </span>
              </div>

              <div
                className="absolute top-4 right-8 w-28 h-36 bg-white rounded-lg shadow-lg p-2 transform rotate-6"
                style={{ borderColor: 'var(--light-border-color)', borderWidth: 1, animationDuration: '4s' }}
              >
                <div className="w-full h-4 rounded mb-2" style={{ backgroundColor: 'var(--accent4-color)', opacity: 0.2 }} />
                <div className="w-full h-2 rounded mb-1" style={{ backgroundColor: 'var(--dark-border-color)' }} />
                <div className="w-2/3 h-2 rounded mb-1" style={{ backgroundColor: 'var(--dark-border-color)' }} />
                <div className="w-full h-2 rounded mb-1" style={{ backgroundColor: 'var(--dark-border-color)' }} />
                <div className="w-3/4 h-2 rounded" style={{ backgroundColor: 'var(--dark-border-color)' }} />
                <span
                  className="absolute -top-2 -right-2 text-white text-xs px-2 py-1 rounded-full"
                  style={{ backgroundColor: '#8B5CF6' }}
                >
                  Records
                </span>
              </div>

              <div
                className="absolute top-[28%] -left-4 bg-white rounded-lg shadow-lg p-2 transform rotate-12"
                style={{ width: '5.5rem', height: '7rem', borderColor: 'var(--light-border-color)', borderWidth: 1, animationDuration: '2.5s' }}
              >
                <div className="w-full h-4 rounded mb-2" style={{ backgroundColor: 'var(--accent3-color)', opacity: 0.2 }} />
                <div className="w-full h-2 rounded mb-1" style={{ backgroundColor: 'var(--dark-border-color)' }} />
                <div className="w-full h-2 rounded mb-1" style={{ backgroundColor: 'var(--dark-border-color)' }} />
                <div className="w-4/5 h-2 rounded" style={{ backgroundColor: 'var(--dark-border-color)' }} />
                <span
                  className="absolute -top-2 -right-2 text-white text-xs px-2 py-1 rounded-full"
                  style={{ backgroundColor: 'var(--accent4-color)' }}
                >
                  Lab
                </span>
              </div>

              <div
                className="absolute bottom-24 -left-2 bg-white rounded-lg shadow-lg p-2 transform rotate-3"
                style={{ width: '6.5rem', height: '8.5rem', borderColor: 'var(--light-border-color)', borderWidth: 1, animationDuration: '3.5s' }}
              >
                <div className="w-full h-4 rounded mb-2" style={{ backgroundColor: 'var(--accent4-color)', opacity: 0.2 }} />
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full" style={{ backgroundColor: 'var(--primary-color)', opacity: 0.2 }} />
                  <div className="flex-1 h-2 rounded" style={{ backgroundColor: 'var(--dark-border-color)' }} />
                </div>
                <div className="w-full h-2 rounded mb-1" style={{ backgroundColor: 'var(--dark-border-color)' }} />
                <div className="w-4/5 h-2 rounded mb-1" style={{ backgroundColor: 'var(--dark-border-color)' }} />
                <div className="w-2/3 h-2 rounded" style={{ backgroundColor: 'var(--dark-border-color)' }} />
                <span
                  className="absolute -top-2 -right-2 text-white text-xs px-2 py-1 rounded-full"
                  style={{ backgroundColor: 'var(--primary-color)' }}
                >
                  Appointment
                </span>
              </div>

              <div
                className="absolute bottom-20 right-4 w-24 bg-white rounded-lg shadow-lg p-2 transform -rotate-6"
                style={{ height: '7.5rem', borderColor: 'var(--light-border-color)', borderWidth: 1, animationDuration: '4.5s' }}
              >
                <div className="w-full h-4 rounded mb-2" style={{ backgroundColor: 'var(--accent2-color)', opacity: 0.2 }} />
                <div className="w-full h-2 rounded mb-1" style={{ backgroundColor: 'var(--dark-border-color)' }} />
                <div className="w-full h-2 rounded mt-1" style={{ backgroundColor: 'var(--dark-border-color)' }} />
                <div className="w-2/3 h-2 rounded mt-1" style={{ backgroundColor: 'var(--dark-border-color)' }} />
                <span
                  className="absolute -top-2 -right-2 text-white text-xs font-bold px-2 py-1 rounded-full"
                  style={{ backgroundColor: '#059669' }}
                >
                  Rx
                </span>
              </div>

              {/* Center Person + Output Pills */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="relative">
                  <div
                    className="w-32 h-32 rounded-full flex items-center justify-center shadow-2xl"
                    style={{ background: 'linear-gradient(to bottom right, var(--primary-color), var(--accent-color))' }}
                  >
                    <svg className="w-20 h-20 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                  <div
                    className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: 'var(--accent-color)' }}
                  >
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                </div>

                {/* Output Pills - directly under person */}
                <div className="flex gap-2 flex-wrap justify-center mt-5" style={{ width: '20rem' }}>
                  <div className="bg-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5" style={{ border: '2px solid var(--primary-color)' }}>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--primary-color)' }}>
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span className="text-xs font-bold" style={{ color: 'var(--primary-color)' }}>Summary</span>
                  </div>
                  <div className="bg-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5" style={{ border: '2px solid var(--accent-color)' }}>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--accent-color)' }}>
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <span className="text-xs font-bold" style={{ color: 'var(--accent-color)' }}>Timeline</span>
                  </div>
                  <div className="bg-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5" style={{ border: '2px solid var(--accent2-color)' }}>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--accent2-color)' }}>
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <span className="text-xs font-bold" style={{ color: 'var(--accent2-color)' }}>Questions</span>
                  </div>
                  <div className="bg-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5" style={{ border: '2px solid var(--accent3-color)' }}>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--accent3-color)' }}>
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>
                    <span className="text-xs font-bold" style={{ color: 'var(--accent3-color)' }}>Prep</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
