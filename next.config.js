/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  async rewrites() {
    const backendOrigin =
      process.env.NEXT_PUBLIC_API_ORIGIN?.replace(/\/$/, '') || 'http://localhost:5000';

    return [
      {
        source: '/auth/:path*',
        destination: `${backendOrigin}/auth/:path*`,
      },
    ];
  },
  async headers() {
    // Conservative, non-breaking security headers applied to all routes.
    // Intentionally NOT setting Content-Security-Policy or Permissions-Policy
    // here: the app relies on CDN Tailwind, Google Tag Manager, PAY.JP, Apple
    // Pay and S3 images, and uses the camera for licence/photo uploads — those
    // need a carefully-scoped policy and are left as a follow-up.
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          // Blocks other sites from framing ours (clickjacking). The Google
          // Maps embed on /stores is us framing them, which is unaffected.
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
