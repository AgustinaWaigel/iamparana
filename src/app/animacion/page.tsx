import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { AnimacionClientContent } from '@/app/components/common/animacion-client-content';
import { HeroSection } from '@/app/components/common/hero-section';

export const metadata: Metadata = {
  title: 'Animación | IAM Paraná',
  description: 'Página del equipo de Animación',
  openGraph: {
    title: 'Animación',
    description: 'Página del equipo de animación',
    url: 'https://iamparana.com.ar/animacion.html',
    images: [
      {
        url: 'https://iamparana.com.ar/logoiam.jpg',
        alt: 'Logo IAM Paraná',
      },
    ],
    type: 'website',
  },
  icons: {
    icon: '/assets/resources/favicon.ico',
  },
};

export default function AnimacionPage() {
  return (
    <>
      {/* Sección principal de Animación: concentra juegos, canciones y recursos para encuentros. */}
      {/* Encabezado visual del área de Animación. */}
      <HeroSection
        title="Animación"
        textureUrl="/assets/textures/areasg.webp"
        overlayColor="rgba(20, 118, 60, 0.7), rgba(22, 163, 74, 0.75)"
        gradientClass="from-green-800 to-green-600"
        description="Juegos, dinámicas, canciones y muchos más recursos para tus encuentros con los niños y adolescentes."
        textColor="text-white"
      />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Contenido destacado y accesos rápidos a los submódulos. */}
        <AnimacionClientContent />
        
        <hr className="my-4 border-gray-300" />
        {/* Botones de entrada a las secciones hijas de la página. */}
        <div className="flex flex-wrap gap-5 justify-center">
          <Link 
            href="/animacion/juegos" 
            className="px-10 py-3 bg-green-800 text-white rounded-lg font-bold text-lg transition-all duration-300 hover:scale-105 hover:shadow-lg no-underline shadow-md"
          >
            Juegos
          </Link>
          <Link 
            href="/animacion/canciones/" 
            className="px-10 py-3 bg-green-800 text-white rounded-lg font-bold text-lg transition-all duration-300 hover:scale-105 hover:shadow-lg no-underline shadow-md"
          >
            Canciones
          </Link>
        </div>
        <hr className="my-4 border-gray-300" />
      </main>
      <div id="footer"></div>
    </>
  );
}
