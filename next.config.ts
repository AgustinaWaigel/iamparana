/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',           // Genera la carpeta /out para GitHub Pages
  basePath: '/iamparana',     // Prefijo para la URL del repositorio
  images: {
    unoptimized: true,        // GitHub Pages no soporta optimización dinámica
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'drive.google.com',
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
    ],
  },
};

export default nextConfig;