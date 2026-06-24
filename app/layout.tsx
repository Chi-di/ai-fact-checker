import type { Metadata } from 'next'
import { Fraunces, Geist_Mono } from 'next/font/google'
import './globals.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  axes: ['opsz', 'SOFT', 'WONK'],
})

const geistMono = Geist_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'FactCheckAI — Verify AI-generated content instantly',
  description:
    'Paste AI-generated text or a URL and instantly see which claims are confirmed, uncertain, or contradicted — with real source citations.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${fraunces.variable} ${geistMono.variable} bg-ink text-snow antialiased`}
      >
        {children}
      </body>
    </html>
  )
}
