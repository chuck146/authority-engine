import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
      },
    ],
  },
  typedRoutes: true,
  // Consolidate the www host onto the canonical apex domain.
  redirects: async () => [
    {
      source: '/:path*',
      has: [{ type: 'host', value: 'www.cleanestpaintingnj.com' }],
      destination: 'https://cleanestpaintingnj.com/:path*',
      permanent: true,
    },
  ],
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            // googletagmanager.com: GA4 tag on marketing pages (only loads when
            // NEXT_PUBLIC_GA_MEASUREMENT_ID is set)
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' https: data: blob:",
            "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.r2.cloudflarestorage.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com",
            "frame-src 'self' https://www.google.com",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
          ].join('; '),
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
      ],
    },
  ],
}

export default nextConfig
