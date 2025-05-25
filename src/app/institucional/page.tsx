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
      <main className="seccion areas" style={{ padding: '2rem' }}>
<hr className="divisor" />
        <p className="subtitulo-descriptivo">
         Esta es la sección donde vas a poder encontrar protocolos y demás material que es muy importante en nuestra tarea como animadores.
        </p>
<hr className="divisor" />
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
                className="botonpaginas2 color-institucional"
              >
                {title}
              </a>
            ))}
          </div>
        </div>
<hr className="divisor" />
      </main>
    </>
  );
}
