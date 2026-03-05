/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for @react-pdf/renderer server-side rendering
  experimental: {
    serverComponentsExternalPackages: ['@react-pdf/renderer'],
  },
};

export default nextConfig;
