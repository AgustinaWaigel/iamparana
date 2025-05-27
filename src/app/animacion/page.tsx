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
            <h2 className="barra-contextual color-animacion-boton">Animación</h2>

      <main className="seccion areas">
        <p className="subtitulo-descriptivo">
          Cantar, bailar, jugar. Parte de nuestro día a día en la IAM es esto, por eso venimos a ayudarte con recursos
          para tus encuentros, y con el día a día. Acá vas a poder encontrar las canciones que cantamos siempre en la IAM
          y también muchos juegos y dinámicas que te van a servir. ¡A jugar y a bailar!
        </p>
        <hr className="divisor" />
        <div className="listabotones">
          <a href="/animacion/juegos" className="botonpaginas color-animacion-boton">
            Juegos
          </a>
                    <Link href="/animacion/canciones/" className="botonpaginas color-animacion-boton">
            Canciones
            </Link>
                          <hr className="divisor" />
        </div>
      </main>

    </>
  );
}
