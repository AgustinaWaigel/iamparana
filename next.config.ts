/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  // BORRÁ 'output: export' y 'basePath'
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
    localPatterns: [
      { pathname: '/api/drive-image' },
      { pathname: '/assets/**' },
      { pathname: '/uploads/**' },
    ],
    remotePatterns: [
      { protocol: 'https', hostname: 'drive.google.com' },
      { protocol: 'https', hostname: '*.googleusercontent.com' },
    ],
  },
};

export default nextConfig;
