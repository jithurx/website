'use client'

export default function Contact() {
  return (
    <section className="py-20 px-4 md:px-8 max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          Get in Touch
        </h2>
        <p className="text-neutral-light/70 text-lg">
          Questions about implementation? Reach out for support and guidance.
        </p>
      </div>

      <div className="glass p-12 rounded-xl border border-cyan-neon/20">
        <div className="text-center space-y-6">
          <div>
            <h3 className="text-2xl font-semibold mb-2">Email</h3>
            <a
              href="mailto:contact@example.com"
              className="text-cyan-neon hover:text-magenta-neon transition-colors text-lg"
            >
              contact@example.com
            </a>
          </div>

          <div className="w-12 h-px bg-cyan-neon/30 mx-auto" />

          <div>
            <h3 className="text-2xl font-semibold mb-4">Connect</h3>
            <div className="flex justify-center gap-4">
              <a
                href="#"
                className="w-10 h-10 rounded-full border border-cyan-neon/50 flex items-center justify-center hover:bg-cyan-neon/10 transition-all"
                title="GitHub"
              >
                🐙
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full border border-cyan-neon/50 flex items-center justify-center hover:bg-cyan-neon/10 transition-all"
                title="Twitter"
              >
                𝕏
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full border border-cyan-neon/50 flex items-center justify-center hover:bg-cyan-neon/10 transition-all"
                title="LinkedIn"
              >
                💼
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
