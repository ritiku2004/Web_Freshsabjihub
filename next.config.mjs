/** @type {import('next').NextConfig} */
const nextConfig = {
  // REQUIRED: Hostinger output directory is set to .next/standalone
  // Without this, next build never creates that directory → 503 on every deploy
  output: 'standalone',

  // Limit CPU usage on shared Hostinger hosting
  experimental: {
    cpus: 1,
    workerThreads: false,
  },

  async headers() {
    return [
      {
        // Prevent browsers caching HTML across deployments.
        // Stops "Failed to find Server Action" errors from stale client bundles.
        // Excludes /_next/ — Next.js manages those with content-hashed filenames.
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

  // Redirect HTTP → HTTPS (Hostinger sets x-forwarded-proto)
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
