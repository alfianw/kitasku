import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { CompanyProfileAnimations } from '@/components/company-profile-animations'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://kitasku.id'),
  title: {
    default: 'KITASKU.ID — Jasa Pengurusan KITAS, Visa, RPTKA, IMTA & Legalitas Perusahaan Indonesia',
    template: '%s | KITASKU.ID',
  },
  description:
    'KITASKU.ID adalah konsultan resmi pengurusan KITAS, ITAS, e-Visa Indonesia (Visa 211, 212, 312, 313, 314, 317), RPTKA, IMTA TKA, Pendirian PT & PMA, NIB, BPOM, serta layanan imigrasi terpercaya di Jakarta, Bekasi, dan seluruh Indonesia.',
  keywords: [
    'KITASKU.ID',
    'kitasku',
    'jasa pengurusan KITAS',
    'biro jasa KITAS Jakarta',
    'pengurusan KITAS Bekasi',
    'jasa visa Indonesia',
    'working visa 312',
    'investor KITAS 313 314',
    'family KITAS 317',
    'visa kunjungan 211 212',
    'jasa RPTKA IMTA TKA',
    'pendirian PT PMA Indonesia',
    'konsultan imigrasi Indonesia',
    'EPO MERP STM SKTT',
  ],
  authors: [{ name: 'KITASKU.ID', url: 'https://kitasku.id' }],
  creator: 'KITASKU.ID',
  publisher: 'KITASKU.ID',
  alternates: {
    canonical: 'https://kitasku.id',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    alternateLocale: ['en_US'],
    url: 'https://kitasku.id',
    siteName: 'KITASKU.ID',
    title: 'KITASKU.ID — Jasa Pengurusan KITAS, Visa, RPTKA & Legalitas Bisnis Indonesia',
    description:
      'Solusi profesional pengurusan KITAS/ITAS, e-Visa, izin kerja TKA (RPTKA & IMTA), pendirian PT/PMA, dan dokumen imigrasi di Indonesia.',
    images: [
      {
        url: '/logo-kitasku.png',
        width: 512,
        height: 512,
        alt: 'KITASKU.ID — Legal & Immigration Consultant',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KITASKU.ID — Konsultan KITAS, Visa & Legalitas Indonesia',
    description:
      'Layanan resmi pengurusan KITAS, ITAS, e-Visa, RPTKA/IMTA, dan pendirian PT/PMA di Indonesia.',
    images: ['/logo-kitasku.png'],
  },
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
    { media: '(prefers-color-scheme: light)', color: '#fcfcfa' },
    { media: '(prefers-color-scheme: dark)', color: '#242421' },
  ],
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LegalService',
  name: 'KITASKU.ID',
  alternateName: 'KITASKU.ID — Legal & Immigration Consultant',
  url: 'https://kitasku.id',
  logo: 'https://kitasku.id/logo-kitasku.png',
  image: 'https://kitasku.id/logo-kitasku.png',
  description:
    'Konsultan profesional pengurusan KITAS, ITAS, e-Visa, RPTKA, IMTA, pendirian PT/PMA, dan layanan imigrasi di Indonesia.',
  telephone: '+62-819-3202-4405',
  email: 'kitaskuu@gmail.com',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Bonia Residence blok D13 RT.004/RW.005, Jatimurni, Kec. Pd. Melati',
    addressLocality: 'Kota Bekasi',
    addressRegion: 'Jawa Barat',
    postalCode: '17431',
    addressCountry: 'ID',
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '17:00',
    },
  ],
  sameAs: ['https://instagram.com/kitasku.id'],
  areaServed: {
    '@type': 'Country',
    name: 'Indonesia',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id">
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <CompanyProfileAnimations />
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
