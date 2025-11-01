import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Personal Portal - Secure Access',
  description: 'A modern, secure personal portal for private files, links, passwords, and services.',
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0f0f1e" />
      </head>
      <body className="bg-navy-dark text-neutral-light">
        {children}
      </body>
    </html>
  )
}
