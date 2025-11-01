'use client'

const services = [
  {
    id: 1,
    title: 'Secure Storage',
    description: 'Military-grade encryption for all your files and sensitive documents.',
    icon: '🔐',
  },
  {
    id: 2,
    title: 'Password Vault',
    description: 'Manage credentials and secrets with Argon2-hashed security.',
    icon: '🗝️',
  },
  {
    id: 3,
    title: 'Multi-Factor Auth',
    description: 'TOTP, WebAuthn, and client certificates for layered protection.',
    icon: '🛡️',
  },
  {
    id: 4,
    title: 'Audit Logging',
    description: 'Complete visibility into all access events and security activities.',
    icon: '📊',
  },
]

export default function Services() {
  return (
    <section className="py-20 px-4 md:px-8 max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          Enterprise-Grade Security
        </h2>
        <p className="text-neutral-light/70 text-lg max-w-2xl mx-auto">
          Built with security-first principles. Combine obscurity, cryptography, and access controls.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {services.map((service) => (
          <div
            key={service.id}
            className="glass p-8 rounded-xl border border-cyan-neon/20 hover:border-cyan-neon/50 transition-all hover:transform hover:scale-105 group"
          >
            <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform">
              {service.icon}
            </div>
            <h3 className="text-xl font-semibold mb-3 text-cyan-neon">
              {service.title}
            </h3>
            <p className="text-neutral-light/70 leading-relaxed">
              {service.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
