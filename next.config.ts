/** @type {import('next').NextConfig} */
const nextConfig = {
  // BORRÁ 'output: export' y 'basePath'
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'drive.google.com' },
      { protocol: 'https', hostname: '*.googleusercontent.com' },
    ],
  },
};

export default nextConfig;