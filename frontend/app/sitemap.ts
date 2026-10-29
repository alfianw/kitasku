import type { MetadataRoute } from 'next'

const BASE_URL = 'https://kitasku.id'

const serviceSlugs = [
  'e-visa-services',
  'kitas-itas-services',
  'rptka-imta-services',
  'immigration-services',
  'business-establishment',
  'product-import-export-registration',
  'other-services',
  'imta-notifikasi-working-visa-312',
  'kitas-temporary-stay-permit',
  'visa-kunjungan-211',
  'visa-kunjungan-212',
  'investor-visa-313-314',
  'family-visa-317',
  'repatriasi-visa-318',
  'service-visa-embassy-jakarta',
  'multiple-exit-repermit',
  'exit-reentry-permit',
  'exit-permit-only',
  'laporan-keberadaan-lakeb',
  'stm-police-record',
  'sktt',
  'skld',
  'pendirian-badan-usaha-legalitas',
]

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const serviceRoutes: MetadataRoute.Sitemap = serviceSlugs.map((slug) => ({
    url: `${BASE_URL}/services/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.85,
  }))

  return [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    ...serviceRoutes,
  ]
}
