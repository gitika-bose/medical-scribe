import heroSvg from '../../assets/hero.svg'

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
                href="#explain-upload"
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
              <a
                href="#coming-soon"
                className="inline-flex items-center justify-center px-8 py-4 font-semibold text-lg transition-all transform hover:scale-105 shadow-md hover:shadow-lg"
                style={{
                  backgroundColor: 'var(--secondary-button-bg-color)',
                  color: 'var(--secondary-button-text-color)',
                  borderRadius: 'var(--button-rounded-radius)',
                  border: '1px solid var(--dark-border-color)',
                }}
              >
                Join Waitlist
              </a>
            </div>
          </div>

          {/* Right: Hero SVG */}
          <div className="relative flex items-center justify-center">
            <img
              src={heroSvg}
              alt="Juno — medical records, appointments, lab results converging into a clear summary"
              className="hero-svg-graphic"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
