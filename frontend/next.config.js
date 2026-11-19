/** @type {import('next').NextConfig} */
const nextConfig = {
  // @react-pdf/renderer v4 es ESM-only; Next 14 no puede hacer require() de él en SSR
  transpilePackages: ['@react-pdf/renderer'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.mototransformerempirekeeway.com',
        port: '',
        pathname: '/wp-content/uploads/2021/09/**',
      },
    ],
  },
};

module.exports = nextConfig;
