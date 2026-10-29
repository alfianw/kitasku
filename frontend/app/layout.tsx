import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { CompanyProfileAnimations } from '@/components/company-profile-animations'
import './globals.css'

export const metadata: Metadata = {
  title: 'KITASKU.ID — Legal & Immigration Services',
  description: 'Professional licensing, immigration, and legal services designed to help people and businesses move forward with confidence.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/logo-kitasku.png',
        type: 'image/png',
      },
    ],
    shortcut: '/logo-kitasku.png',
    apple: '/logo-kitasku.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id">
      <body className="antialiased">
        <CompanyProfileAnimations />
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
