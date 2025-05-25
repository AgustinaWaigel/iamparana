import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Formación',
  description: 'Página del área de formación',
  openGraph: {
    title: 'Formación',
    description: 'Página del área de formación',
    url: 'https://iamparana.com.ar/formacion',
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

export default function FormacionPage() {
  return (
    <>
             <h2 className="barra-contextual color-formacion-boton">Formación</h2>
      <main className="seccion areas">
        <p className="subtitulo-descriptivo">
          Aquí podrás acceder a todos los recursos de formación: presentaciones de talleres, temario del año, la carta del Papa y mucho más.
          Es muy importante que podamos seguir actualizándonos y formándonos como animadores.
          Misioneros... ¡A estudiar!
        </p>
        <div className="listabotones" style={{ marginTop: '2rem' }}>
          <a
            href="https://drive.google.com/file/d/1FGd15NAkaXvkfaeyuwLZUgljkntrPJqs/view?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            className="botonpaginas color-formacion-boton"
          >
            📘 Temario 2025
          </a>

          <a
            href="https://www.vatican.va/content/francesco/es/messages/missions/documents/20250125-giornata-missionaria.html"
            target="_blank"
            rel="noopener noreferrer"
            className="botonpaginas color-formacion-boton"
          >
            ✉️ Carta del Papa
          </a>

          <Link href="/formacion/presentaciones" className="botonpaginas color-formacion-boton">
            🎓 Formación de Animadores
          </Link>
        </div>
<hr className="divisor" />
        <blockquote style={{ marginTop: '2rem', fontStyle: 'italic' }}>
          “Mi caminito es el camino de una infancia espiritual, el camino de la
          confianza y de la entrega absoluta.”<br />– Santa Teresita
        </blockquote>
      </main>
 </>
  );
}
