/** @type {import('next').NextConfig} */
const nextConfig = {
  // Limit CPU usage on shared Hostinger hosting
  experimental: {
    cpus: 1,
    workerThreads: false,
  },

  async headers() {
    return [
      {
        // Prevent browsers from caching HTML pages across deployments.
        // This stops "Failed to find Server Action" errors caused by a
        // browser serving stale JS that references old build's action IDs.
        // Do NOT add custom Cache-Control for /_next/* — Next.js manages those.
        source: '/((?!_next).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },
    ];
  },

  // Redirect HTTP → HTTPS (Hostinger uses x-forwarded-proto header)
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
