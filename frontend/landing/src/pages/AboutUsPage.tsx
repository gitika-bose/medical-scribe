import './NewLandingPage.css'
import Header from '../components/shared/Header'
import Footer from '../components/shared/Footer'

function AboutUsPage() {
  return (
    <div className="min-h-screen w-full" style={{ fontFamily: 'var(--font-family-body)' }}>
      <Header />

      {/* About Us Section */}
      <section
        className="pt-32 pb-16"
        style={{ backgroundColor: 'var(--light-background-color)' }}
      >
        <div className="max-w-5xl mx-auto px-6 sm:px-10 lg:px-16">
          <div className="text-center mb-12">
            <h1
              className="text-4xl md:text-5xl font-bold mb-4"
              style={{
                fontFamily: 'var(--font-family-heading)',
                color: 'var(--dark-text-color)',
              }}
            >
              Empowering patients through{' '}
              <span style={{ color: 'var(--primary-color)' }}>better communication</span>
            </h1>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col items-center">
              <img
                src="/aboutuspic.jpg"
                alt="Tejit Pabari and Gitika Bose"
                className="rounded-2xl shadow-lg w-full max-w-md"
                style={{ border: '1px solid var(--light-border-color)' }}
              />
              <p
                className="mt-4 text-sm text-center"
                style={{ color: 'var(--gray-text-color)' }}
              >
                Tejit Pabari (Co-Founder &amp; CEO) <br /> Gitika Bose (Co-Founder &amp; CTO)
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <p
                className="text-base leading-relaxed"
                style={{ color: 'var(--dark-text-color)' }}
              >
                My husband and I created Juno when we observed that as healthcare gets more complex, we are barely
                able to keep up for our loved ones. When my grandmom was diagnosed with Alzheimer's, I realized what it
                means to be a caregiver.
              </p>
              <p
                className="text-base leading-relaxed"
                style={{ color: 'var(--dark-text-color)' }}
              >
                After consulting with numerous doctors in the US, we developed this note taking solution.
                The goal of this simple tool is to empower patients and caregivers
                to take control of their health information.
              </p>
              <p
                className="text-base leading-relaxed"
                style={{ color: 'var(--dark-text-color)' }}
              >
                We are continuously trying to improve Juno for our family and anyone else who it may help. If you try it, do
                let us know if it could support you in any better way.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}

export default AboutUsPage
