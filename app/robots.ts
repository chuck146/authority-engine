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
          // Old WordPress paths — domain was previously WP on SiteGround.
          // Vercel WAF returns 403 for these; disallow prevents GSC indexing errors.
          '/wp-admin',
          '/wp-login.php',
          '/xmlrpc.php',
          '/wp-cron.php',
          '/wp-signup.php',
          '/wp-content/',
          '/wp-includes/',
          '/wp-json/',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
