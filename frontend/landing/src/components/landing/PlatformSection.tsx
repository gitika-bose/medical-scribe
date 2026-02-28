const platformFeatures = [
  {
    iconColor: 'var(--primary-color)',
    icon: (
      <svg className="w-6 h-6" style={{ color: 'var(--primary-color)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    title: 'Appointment Clarity',
    description: 'Real-time notes and summaries during your visits',
  },
  {
    iconColor: 'var(--accent-color)',
    icon: (
      <svg className="w-6 h-6" style={{ color: 'var(--accent-color)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Smart Question Prep',
    description: 'AI-suggested questions for your next doctor visit',
  },
  {
    iconColor: 'var(--accent2-color)',
    icon: (
      <svg className="w-6 h-6" style={{ color: 'var(--accent2-color)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: 'Journey Summaries',
    description: 'Shareable summaries for your care team',
  },
  {
    iconColor: 'var(--accent3-color)',
    icon: (
      <svg className="w-6 h-6" style={{ color: 'var(--accent3-color)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'Insurance Decoded',
    description: 'Understand your coverage and billing codes',
  },
  {
    iconColor: 'var(--accent4-color)',
    icon: (
      <svg className="w-6 h-6" style={{ color: 'var(--accent4-color)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Personalized Prep',
    description: 'Appointment prep based on your history',
  },
  {
    iconColor: 'var(--primary-color)',
    icon: (
      <svg className="w-6 h-6" style={{ color: 'var(--primary-color)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
      </svg>
    ),
    title: 'Health Timeline',
    description: 'Track your health journey over time',
  },
]

function PlatformSection() {
  return (
    <section className="py-24" style={{ backgroundColor: 'var(--medium-background-color)' }}>
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        <div className="text-center mb-16">
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
            style={{ fontFamily: 'var(--font-family-heading)', color: 'var(--dark-text-color)' }}
          >
            Tools for every step of your care.
          </h2>
          <p className="text-xl max-w-2xl mx-auto" style={{ color: 'var(--gray-text-color)' }}>
            One platform to understand every layer of your healthcare experience.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {platformFeatures.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow"
              style={{ border: '1px solid var(--light-border-color)' }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{
                  backgroundColor: `color-mix(in srgb, ${feature.iconColor} 10%, transparent)`,
                }}
              >
                {feature.icon}
              </div>
              <h3
                className="text-lg font-bold mb-2"
                style={{ fontFamily: 'var(--font-family-heading)', color: 'var(--dark-text-color)' }}
              >
                {feature.title}
              </h3>
              <p style={{ color: 'var(--gray-text-color)' }}>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default PlatformSection
