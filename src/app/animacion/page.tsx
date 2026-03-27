import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';

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
      <div id="header"></div>
      <h2 className="mt-20 py-8 px-5 bg-gradient-to-r from-green-800 to-green-700 text-white text-3xl font-bold text-center">Animación</h2>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <p className="text-lg text-gray-700 mb-6">
          Cantar, bailar, jugar. Parte de nuestro día a día en la IAM es esto, por eso venimos a ayudarte con recursos
          para tus encuentros, y con el día a día. Acá vas a poder encontrar las canciones que cantamos siempre en la IAM
          y también muchos juegos y dinámicas que te van a servir. ¡A jugar y a bailar!
        </p>
        <hr className="my-4 border-gray-300" />
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
