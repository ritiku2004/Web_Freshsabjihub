/** @type {import('next').NextConfig} */
const nextConfig = {
  // Limit CPU usage on shared hosting
  experimental: {
    cpus: 1,
    workerThreads: false,
  },

  // Add headers to prevent stale Server Action calls from old deployments
  async headers() {
    return [
      {
        // Tell browsers/CDN not to cache Next.js internal routes
        source: '/_next/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Prevent caching of HTML pages so users always get the latest build
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },
    ];
  },

  // Redirect HTTP → HTTPS
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'header', key: 'x-forwarded-proto', value: 'http' }],
        destination: 'https://shop.freshsabjihub.com/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
