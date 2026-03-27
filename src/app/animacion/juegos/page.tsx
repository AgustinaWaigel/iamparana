import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Juegos',
  description: 'Juegos para tus encuentros',
  openGraph: {
    title: 'Juegos',
    description: 'Descripcion',
    url: 'https://iamparana.com.ar/animacion/juegos',
    images: [
      {
        url: 'https://iamparana.com.ar/logoiam.jpg',
        alt: 'Logo IAM Paraná',
        width: 800,
        height: 600,
      },
    ],
    type: 'website',
  },
  icons: {
    icon: '/assets/resources/favicon.ico',
  },

};

export default function juegosPage() {
  return (
    <>
<h2 className='py-4 px-5 text-2xl font-bold bg-green-800/70 text-white'>Juegos</h2>

      <main className="seccion areas" style={{ padding: '2rem' }}>
        <p className="subtitulo-descriptivo">
         Acá vas a poder encontrar juegos de distintos tipos para realizar en tus encuentros, junto con libros con dinámicas y demás.
        </p>
<hr className="my-4 border-gray-300" />
        <div className="seccion">
          <h2 className="subtitulo-seccion titulo-animacion  ">Videos de Juegos</h2>
          <div className="listabotones color ">
            {[
              ['Juegos cooperativos', 'm_NqiguBr-c'],
              ['Juegos cooperativos 2', 'YvM9UQzJbJw'],
              ['Juegos en ronda', 'sQUI04ClZ0M'],
              ['Juegos en ronda 2', 'yJY19gO9JOo'],
              ['Juegos competitivos', '6FEI4rLyhxU'],
            ].map(([title, id]) => (
              <a
                key={id}
                href={`https://www.youtube.com/watch?v=${id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 hover:scale-105 hover:shadow-lg no-underline bg-green-800/70 text-white"
              >
                {title}
              </a>
            ))}
          </div>
        </div>
<hr className="my-4 border-gray-300" />
        <div className="seccion">
          <h2 className="subtitulo-seccion titulo-animacion">Libros con juegos y dinámicas</h2>
          <div className="listabotones">
            {[
              ['700 dinámicas grupales', '1gsCxSr22fyU-71TrGtsb3y7_wTYzyp-X'],
              ['Fichero de Juegos', '1h46jXEvx0zhryjhoAypyTyjB51HNaZ1U'],
            ].map(([title, id]) => (
              <a
                key={id}
                href={`https://drive.google.com/file/d/${id}/view?usp=sharing`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 hover:scale-105 hover:shadow-lg no-underline bg-green-800/70 text-white"
              >
                {title}
              </a>
            ))}
          </div>
          <hr className="my-4 border-gray-300" />
        </div>
      </main>
    </>
  );
}
