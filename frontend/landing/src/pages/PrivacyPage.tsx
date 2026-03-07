import './NewLandingPage.css'
import Footer from '../components/shared/Footer'

function PrivacyPage() {
  return (
    <div className="min-h-screen w-full" style={{ fontFamily: 'var(--font-family-body)' }}>
      {/* <Header /> */}

      <section
        className="pt-32 pb-16"
        style={{ backgroundColor: 'var(--light-background-color)' }}
      >
        <div className="max-w-3xl mx-auto px-6 sm:px-10 lg:px-16">
          <h1
            className="text-4xl md:text-5xl font-bold mb-2 text-center"
            style={{
              fontFamily: 'var(--font-family-heading)',
              color: 'var(--dark-text-color)',
            }}
          >
            Privacy Policy
          </h1>
          <p
            className="text-sm text-center mb-12"
            style={{ color: 'var(--gray-text-color)' }}
          >
            <strong>Last Updated: March 2026</strong>
          </p>

          <div
            className="text-base leading-relaxed flex flex-col gap-6"
            style={{ color: 'var(--dark-text-color)' }}
          >
            <p>
              Juno ("we", "our", or "us") provides a tool that helps users better understand medical
              conversations and documents by generating structured summaries and explanations in plain
              language.
            </p>
            <p>
              This Privacy Policy explains how we collect, use, and handle information when you use the
              Juno website and services.
            </p>

            <h2
              className="text-2xl font-bold mt-4"
              style={{ fontFamily: 'var(--font-family-heading)', color: 'var(--dark-text-color)' }}
            >
              1. Information You Provide
            </h2>
            <p>When using Juno, you may choose to upload or submit information such as:</p>
            <ul className="list-disc pl-6 flex flex-col gap-2">
              <li>Audio recordings of medical appointments</li>
              <li>Medical documents or reports</li>
              <li>Typed or written notes</li>
              <li>Other information you voluntarily submit for summarization</li>
            </ul>
            <p>
              This information may contain personal or sensitive information, including health-related
              information.
            </p>

            <h2
              className="text-2xl font-bold mt-4"
              style={{ fontFamily: 'var(--font-family-heading)', color: 'var(--dark-text-color)' }}
            >
              2. How We Use Your Information
            </h2>
            <p>
              Information you submit is used <strong>only for the purpose of generating summaries,
              explanations, and follow-up questions</strong> through our AI processing system.
            </p>
            <p>Specifically, submitted information is used to:</p>
            <ul className="list-disc pl-6 flex flex-col gap-2">
              <li>Generate structured summaries of medical conversations or documents</li>
              <li>Translate complex medical information into plain language</li>
              <li>Suggest potential follow-up questions for your healthcare provider</li>
            </ul>
            <p>
              Juno <strong>does not provide medical advice, diagnosis, or treatment recommendations</strong>.
            </p>

            <h2
              className="text-2xl font-bold mt-4"
              style={{ fontFamily: 'var(--font-family-heading)', color: 'var(--dark-text-color)' }}
            >
              3. Data Retention
            </h2>
            <p>Juno is designed to minimize data retention.</p>
            <ul className="list-disc pl-6 flex flex-col gap-2">
              <li>
                Uploaded files and submitted information are processed temporarily to generate results.
              </li>
              <li>
                We <strong>do not store recordings, documents, notes, or summaries after processing is
                complete</strong>.
              </li>
              <li>
                Submitted content is <strong>deleted automatically after processing</strong>.
              </li>
            </ul>
            <p>
              Because of this design, we <strong>do not maintain long-term records of your
              submissions</strong>.
            </p>

            <h2
              className="text-2xl font-bold mt-4"
              style={{ fontFamily: 'var(--font-family-heading)', color: 'var(--dark-text-color)' }}
            >
              4. No User Accounts
            </h2>
            <p>
              Juno currently allows users to try the service <strong>without creating an account</strong>.
              We do not collect user profiles or maintain personal user databases for this version of the
              product.
            </p>

            <h2
              className="text-2xl font-bold mt-4"
              style={{ fontFamily: 'var(--font-family-heading)', color: 'var(--dark-text-color)' }}
            >
              5. Infrastructure and Service Providers
            </h2>
            <p>
              Juno uses trusted cloud infrastructure and services to operate the platform, including:
            </p>
            <ul className="list-disc pl-6 flex flex-col gap-2">
              <li><strong>Google Cloud Platform</strong> for hosting and infrastructure</li>
              <li><strong>Firebase</strong> for application services and infrastructure</li>
            </ul>
            <p>
              These providers may process data temporarily as required to operate the service. They are
              subject to their own security and privacy practices.
            </p>

            <h2
              className="text-2xl font-bold mt-4"
              style={{ fontFamily: 'var(--font-family-heading)', color: 'var(--dark-text-color)' }}
            >
              6. Security
            </h2>
            <p>
              We take reasonable measures to protect information during transmission and processing,
              including secure infrastructure and encrypted connections.
            </p>

            <h2
              className="text-2xl font-bold mt-4"
              style={{ fontFamily: 'var(--font-family-heading)', color: 'var(--dark-text-color)' }}
            >
              7. Cookies and Technical Data
            </h2>
            <p>
              Like most websites, we may collect limited technical information automatically, such as:
            </p>
            <ul className="list-disc pl-6 flex flex-col gap-2">
              <li>Browser type</li>
              <li>Device type</li>
              <li>General usage analytics</li>
              <li>IP address</li>
            </ul>
            <p>
              This information is used only to maintain service reliability and improve the product.
            </p>

            <h2
              className="text-2xl font-bold mt-4"
              style={{ fontFamily: 'var(--font-family-heading)', color: 'var(--dark-text-color)' }}
            >
              8. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time as the product evolves. Updates will be
              posted on this page with a revised date.
            </p>

            <h2
              className="text-2xl font-bold mt-4"
              style={{ fontFamily: 'var(--font-family-heading)', color: 'var(--dark-text-color)' }}
            >
              9. Contact
            </h2>
            <p>
              If you have questions about this Privacy Policy, you may contact us at:{' '}
              <a
                href="mailto:support@meetjuno.health"
                style={{ color: 'var(--primary-color)', textDecoration: 'underline' }}
              >
                support@meetjuno.health
              </a>
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default PrivacyPage
