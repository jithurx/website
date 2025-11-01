'use client'

const caseStudies = [
  {
    id: 1,
    title: 'Enterprise Portal',
    description: 'Deployed secure portal for 500+ users',
    tags: ['Security', 'Deployment'],
  },
  {
    id: 2,
    title: 'Encrypted Backup',
    description: 'Automated encrypted backups with rclone',
    tags: ['Infrastructure', 'Backup'],
  },
  {
    id: 3,
    title: 'Multi-Factor Auth',
    description: 'Implemented TOTP and WebAuthn authentication',
    tags: ['Security', 'Auth'],
  },
  {
    id: 4,
    title: 'Docker Deployment',
    description: 'Full containerization with Caddy reverse proxy',
    tags: ['DevOps', 'Docker'],
  },
  {
    id: 5,
    title: 'Monitoring Setup',
    description: 'Centralized logging and alerting',
    tags: ['Monitoring', 'Infrastructure'],
  },
  {
    id: 6,
    title: 'Client Certificates',
    description: 'mTLS authentication implementation',
    tags: ['Security', 'Networking'],
  },
]

export default function Gallery() {
  return (
    <section className="py-20 px-4 md:px-8 max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          Implementation Examples
        </h2>
        <p className="text-neutral-light/70 text-lg max-w-2xl mx-auto">
          Real-world scenarios and architectural patterns
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {caseStudies.map((study) => (
          <a
            key={study.id}
            href="#"
            className="glass p-6 rounded-lg border border-magenta-neon/20 hover:border-magenta-neon/50 group transition-all hover:transform hover:-translate-y-1"
          >
            <h3 className="text-lg font-semibold mb-2 text-magenta-neon group-hover:text-cyan-neon transition-colors">
              {study.title}
            </h3>
            <p className="text-neutral-light/70 text-sm mb-4">
              {study.description}
            </p>
            <div className="flex flex-wrap gap-2">
              {study.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-cyan-neon/10 text-cyan-neon px-2 py-1 rounded border border-cyan-neon/30"
                >
                  {tag}
                </span>
              ))}
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}
