import { useState } from 'react'
import './NewLandingPage.css'
import Header from '../components/shared/Header'
import Footer from '../components/shared/Footer'

function ContactPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  const isMessageValid = message.trim().length >= 10
  const canSubmit = isEmailValid && isMessageValid && !submitting && !submitted

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return

    setSubmitting(true)
    setError(null)

    try {
      const body = [
        `Source: contact-page`,
        `Email: ${email.trim()}`,
        `Message: ${message.trim()}`,
      ].join('\n')

      await fetch('https://formspree.io/f/mjgeorjw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email: email.trim(), message: body }),
      })
      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen w-full" style={{ fontFamily: 'var(--font-family-body)' }}>
      <Header />

      {/* Hero */}
      <section
        className="pt-32 pb-16"
        style={{ backgroundColor: 'var(--light-background-color)' }}
      >
        <div className="max-w-3xl mx-auto px-6 sm:px-10 text-center">
          <h1
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{
              fontFamily: 'var(--font-family-heading)',
              color: 'var(--dark-text-color)',
            }}
          >
            Get in <span style={{ color: 'var(--primary-color)' }}>Touch</span>
          </h1>
          <p
            className="text-lg"
            style={{ color: 'var(--gray-text-color)' }}
          >
            Have a question, feedback, or just want to say hi? We'd love to hear from you.
          </p>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-16" style={{ backgroundColor: 'white' }}>
        <div className="max-w-xl mx-auto px-6 sm:px-10">
          {submitted ? (
            <div
              className="rounded-2xl p-10 text-center"
              style={{
                backgroundColor: 'var(--light-background-color)',
                border: '1px solid var(--light-border-color)',
              }}
            >
              <div className="text-5xl mb-4">✉️</div>
              <h2
                className="text-2xl font-bold mb-2"
                style={{
                  fontFamily: 'var(--font-family-heading)',
                  color: 'var(--dark-text-color)',
                }}
              >
                Thanks for reaching out!
              </h2>
              <p style={{ color: 'var(--gray-text-color)' }}>
                We'll get back to you as soon as we can.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {/* Email */}
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="contact-email"
                  className="text-sm font-semibold"
                  style={{ color: 'var(--dark-text-color)' }}
                >
                  Email <span style={{ color: 'var(--accent2-color)' }}>*</span>
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  className="px-4 py-3 text-base transition-all outline-none"
                  style={{
                    border: '1px solid var(--light-border-color)',
                    borderRadius: 'var(--button-rounded-radius)',
                    backgroundColor: 'white',
                    color: 'var(--dark-text-color)',
                    fontFamily: 'var(--font-family-body)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary-color)'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(107, 95, 216, 0.12)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--light-border-color)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
                {email.length > 0 && !isEmailValid && (
                  <span className="text-xs" style={{ color: 'var(--accent2-color)' }}>
                    Please enter a valid email address.
                  </span>
                )}
              </div>

              {/* Message */}
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="contact-message"
                  className="text-sm font-semibold"
                  style={{ color: 'var(--dark-text-color)' }}
                >
                  Message <span style={{ color: 'var(--accent2-color)' }}>*</span>
                  <span
                    className="font-normal ml-1"
                    style={{ color: 'var(--gray-text-color)', fontSize: '0.8125rem' }}
                  >
                    (at least 10 characters)
                  </span>
                </label>
                <textarea
                  id="contact-message"
                  required
                  minLength={10}
                  placeholder="Tell us what's on your mind…"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={submitting}
                  rows={6}
                  className="px-4 py-3 text-base transition-all outline-none resize-y"
                  style={{
                    border: '1px solid var(--light-border-color)',
                    borderRadius: 'var(--button-rounded-radius)',
                    backgroundColor: 'white',
                    color: 'var(--dark-text-color)',
                    fontFamily: 'var(--font-family-body)',
                    lineHeight: 1.6,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary-color)'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(107, 95, 216, 0.12)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--light-border-color)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
                <div className="flex justify-between items-center">
                  {message.length > 0 && message.trim().length < 10 ? (
                    <span className="text-xs" style={{ color: 'var(--accent2-color)' }}>
                      {10 - message.trim().length} more character{10 - message.trim().length !== 1 ? 's' : ''} needed.
                    </span>
                  ) : (
                    <span />
                  )}
                  <span
                    className="text-xs"
                    style={{ color: 'var(--gray-text-color)' }}
                  >
                    {message.trim().length} character{message.trim().length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div
                  className="rounded-lg px-4 py-3 text-sm"
                  style={{
                    backgroundColor: 'rgba(232, 93, 117, 0.08)',
                    color: 'var(--accent2-color)',
                    border: '1px solid rgba(232, 93, 117, 0.2)',
                  }}
                >
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={!canSubmit}
                className="px-8 py-3.5 text-base font-semibold text-white transition-all border-none cursor-pointer"
                style={{
                  backgroundColor: canSubmit ? 'var(--primary-color)' : 'var(--dark-border-color)',
                  borderRadius: 'var(--button-rounded-radius)',
                  opacity: canSubmit ? 1 : 0.6,
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                }}
                onMouseEnter={(e) => {
                  if (canSubmit) {
                    e.currentTarget.style.backgroundColor = 'var(--primary-button-hover-bg-color)'
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(107, 95, 216, 0.3)'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = canSubmit ? 'var(--primary-color)' : 'var(--dark-border-color)'
                  e.currentTarget.style.transform = 'none'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                {submitting ? 'Sending…' : 'Send Message'}
              </button>

              <p
                className="text-center text-xs"
                style={{ color: 'var(--gray-text-color)' }}
              >
                We typically respond within 24 hours.
              </p>
            </form>
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default ContactPage
