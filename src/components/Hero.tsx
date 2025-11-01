'use client'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Animated SVG Background */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1200 800"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="heroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00d9ff" stopOpacity="0.1" />
            <stop offset="50%" stopColor="#ff006e" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#0f0f1e" stopOpacity="0.2" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Gradient background */}
        <rect width="1200" height="800" fill="url(#heroGradient)" />

        {/* Animated circles */}
        <circle cx="100" cy="100" r="150" fill="none" stroke="#00d9ff" strokeWidth="2" opacity="0.3">
          <animate attributeName="r" values="150;200;150" dur="6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0.1;0.3" dur="6s" repeatCount="indefinite" />
        </circle>

        <circle cx="1100" cy="700" r="120" fill="none" stroke="#ff006e" strokeWidth="2" opacity="0.3">
          <animate attributeName="r" values="120;180;120" dur="8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0.1;0.3" dur="8s" repeatCount="indefinite" />
        </circle>
      </svg>

      {/* Content */}
      <div className="relative z-10 text-center px-4 md:px-8 max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          Your Personal Portal{' '}
          <span className="text-cyan-neon glow-cyan">Secure & Private</span>
        </h1>

        <p className="text-lg md:text-xl text-neutral-light/80 mb-8 max-w-2xl mx-auto leading-relaxed">
          A modern, ultra-secure personal vault for your files, credentials, links, and services.
          Military-grade encryption meets elegant design.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="px-8 py-3 bg-cyan-neon text-navy-dark font-semibold rounded-lg hover:bg-cyan-neon/80 transform hover:scale-105 transition-all">
            Learn More
          </button>
          <button className="px-8 py-3 border-2 border-cyan-neon text-cyan-neon font-semibold rounded-lg hover:bg-cyan-neon/10 transform hover:scale-105 transition-all">
            Documentation
          </button>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-10">
        <svg className="w-6 h-6 text-cyan-neon animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  )
}
