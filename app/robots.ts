import type { MetadataRoute } from 'next'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cleanestpaintingnj.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/settings/',
          '/content/',
          '/seo/',
          '/social/',
          '/reviews/',
          '/video/',
          '/analytics/',
          '/media/',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
