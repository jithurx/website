'use client'

export default function Footer() {
  return (
    <footer className="border-t border-cyan-neon/10 mt-20 py-12 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-cyan-neon font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-neutral-light/60 text-sm">
              <li><a href="#" className="hover:text-cyan-neon transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-cyan-neon transition-colors">Security</a></li>
              <li><a href="#" className="hover:text-cyan-neon transition-colors">Pricing</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-cyan-neon font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-neutral-light/60 text-sm">
              <li><a href="#" className="hover:text-cyan-neon transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-cyan-neon transition-colors">API Reference</a></li>
              <li><a href="#" className="hover:text-cyan-neon transition-colors">Support</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-cyan-neon font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-neutral-light/60 text-sm">
              <li><a href="#" className="hover:text-cyan-neon transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-cyan-neon transition-colors">Terms</a></li>
              <li><a href="#" className="hover:text-cyan-neon transition-colors">Security</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-cyan-neon/10 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-neutral-light/40 text-sm">
            © 2024 Personal Portal. All rights reserved.
          </p>
          <p className="text-neutral-light/40 text-sm mt-4 md:mt-0">
            Built with security-first principles
          </p>
        </div>
      </div>
    </footer>
  )
}
