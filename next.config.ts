// next.config.mjs o next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'drive.google.com',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com', // Clave para las imágenes renderizadas
      },
    ],
  },
};

export default nextConfig;
