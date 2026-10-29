import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashbord', '/api/'],
      },
    ],
    sitemap: 'https://kitasku.id/sitemap.xml',
    host: 'https://kitasku.id',
  }
}
