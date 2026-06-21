/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    cpus: 1,
    workerThreads: false
  }
};

export default nextConfig;
