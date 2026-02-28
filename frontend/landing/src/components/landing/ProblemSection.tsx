const problemCards = [
  {
    icon: (
      <svg className="w-7 h-7" style={{ color: 'var(--primary-color)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    iconBg: 'var(--primary-color)',
    hoverBorder: 'var(--primary-color)',
    title: 'Healthcare is complex.',
    description: 'Medical terminology, procedures, and systems are designed for trained professionals — not everyday patients trying to understand their own care.',
  },
  {
    icon: (
      <svg className="w-7 h-7" style={{ color: 'var(--accent-color)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
      </svg>
    ),
    iconBg: 'var(--accent-color)',
    hoverBorder: 'var(--accent-color)',
    title: 'Language is technical.',
    description: 'Lab results, prescriptions, and medical reports use specialized language that requires years of training to interpret — leaving patients in the dark.',
  },
  {
    icon: (
      <svg className="w-7 h-7" style={{ color: 'var(--accent2-color)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    iconBg: 'var(--accent2-color)',
    hoverBorder: 'var(--accent2-color)',
    title: 'Appointments are short.',
    description: 'The average doctor visit is 15-20 minutes. Patients often leave with more questions than answers — and no way to review what was discussed.',
  },
  {
    icon: (
      <svg className="w-7 h-7" style={{ color: 'var(--accent3-color)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    iconBg: 'var(--accent3-color)',
    hoverBorder: 'var(--accent3-color)',
    title: 'Records are fragmented.',
    description: "Your medical history lives across multiple providers, hospitals, and systems. There's no single place to see the full picture of your health.",
  },
  {
    icon: (
      <svg className="w-7 h-7" style={{ color: 'var(--accent4-color)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    iconBg: 'var(--accent4-color)',
    hoverBorder: 'var(--accent4-color)',
    title: 'Insurance is opaque.',
    description: "Coverage codes, deductibles, and explanations of benefits are nearly impossible to decode — leaving patients surprised by bills they didn't expect.",
  },
  {
    icon: (
      <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    iconBg: 'rgba(255, 255, 255, 0.2)',
    hoverBorder: 'rgba(255, 255, 255, 0.5)',
    title: 'High stakes decisions.',
    description: 'Patients are expected to make life-altering decisions about treatments, medications, and care plans — without fully understanding the information at hand.',
  },
]

function ProblemSection() {
  return (
    <section className="py-24" style={{ backgroundColor: 'var(--dark-background-color)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6"
            style={{ fontFamily: 'var(--font-family-heading)' }}
          >
            Medical information isn't designed to be understood by patients.
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            The healthcare system was built for providers — not patients. Here's what we're up against.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {problemCards.map((card, index) => (
            <div
              key={index}
              className="rounded-2xl p-8 transition-all group"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = card.hoverBorder
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255, 255, 255, 0.1)'
              }}
            >
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-colors"
                style={{ backgroundColor: `color-mix(in srgb, ${card.iconBg} 20%, transparent)` }}
              >
                {card.icon}
              </div>
              <h3
                className="text-xl font-bold text-white mb-3"
                style={{ fontFamily: 'var(--font-family-heading)' }}
              >
                {card.title}
              </h3>
              <p className="text-gray-400 leading-relaxed">{card.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p
            className="text-2xl font-bold text-white"
            style={{ fontFamily: 'var(--font-family-heading)' }}
          >
            <span style={{ color: 'var(--accent-color)' }}>Medical literacy should not be a privilege.</span>
          </p>
        </div>
      </div>
    </section>
  )
}

export default ProblemSection
