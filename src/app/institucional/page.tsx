import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Institucional',
  description: 'Documentos e información útil para animadores',
  openGraph: {
    title: 'Institucional',
    description: 'Documentos e información útil para animadores',
    url: 'https://iamparana.com.ar/institucional',
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
      <div id="header"></div>
      <h2 className='mt-20 py-8 px-5 text-3xl font-bold bg-gradient-to-r from-black to-gray-800 text-white text-center'>Institucional</h2>
      <main className="seccion areas" style={{ padding: '2rem' }}>
<hr className="my-4 border-gray-300" />
        <p className="subtitulo-descriptivo">
         Esta es la sección donde vas a poder encontrar protocolos y demás material que es muy importante en nuestra tarea como animadores.
        </p>
<hr className="my-4 border-gray-300" />
        <div className="seccion">
          <h2 className="subtitulo-seccion titulo-institucional">Protocolos</h2>
          <div className="listabotones">
            {[
              ['Normas arquidiocesanas de comportamiento para el trato con niños, adolescentes y personas vulnerables', '1lx8BD5uiEke50tY0Qby4C473E92F9k4j'],
              ['Protocolo arquidiocesano de actuación ante la sospecha o descubrimiento de abusos sexuales en los que sean víctimas niños, adolescentes o personas vulnerables', '1cBmbT9Htkgi9iomNodYdAuQI67f_-spn'],
            ].map(([title, id]) => (
              <a
                key={id}
                href={`https://drive.google.com/file/d/${id}/view`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-10 py-3 rounded-lg font-bold text-lg transition-all duration-300 hover:scale-105 hover:shadow-lg no-underline bg-black text-white shadow-md"
              >
                {title}
              </a>
            ))}
          </div>
        </div>
<hr className="my-4 border-gray-300" />
      </main>
      <div id="footer"></div>
    </>
  );
}
