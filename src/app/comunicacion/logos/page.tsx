import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Logos',
  description: 'Logos para tus encuentros',
  openGraph: {
    title: 'Logos',
    description: 'Logos para tus encuentros',
    url: 'https://iamparana.com.ar/comunicacion/logos',
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
  themeColor: '#622d0d',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Logos',
  },
};

export default function LogosPage() {
  return (
    <main>
      <div className="barra-contextual color-comunicacion fondo-comunicacion">
        <p>
          <span className="texto-encima"></span>
          <br />
          <strong>Logos</strong>
        </p>
      </div>


      <div className="galeria-logos">
        <div className="logo-item">
          <img
            src="/assets/multimedia/logo año jubilar.png"
            alt="Logo Año Jubilar"
          />
          <a
            href="/assets/multimedia/logo año jubilar.png"
            download
            className="boton-descarga"
          >
            ⬇️ Descargar
          </a>
        </div>

        <div className="logo-item">
          <img
            src="/assets/multimedia/logo-iam-arq-parana.png"
            alt="Logo IAM Paraná"
          />
          <a
            href="/assets/multimedia/logo-iam-arq-parana.png"
            download
            className="boton-descarga"
          >
            ⬇️ Descargar
          </a>
        </div>

        <div className="logo-item">
          <img
            src="/assets/multimedia/logo iam nuevo redondo.png"
            alt="Logo IAM Redondo"
          />
          <a
            href="/assets/multimedia/logo iam nuevo redondo.png"
            download
            className="boton-descarga"
          >
            ⬇️ Descargar
          </a>
        </div>

        <div className="logo-item">
          <img
            src="/assets/multimedia/logo año diocesano.png"
            alt="Logo Año Diocesano"
          />
          <a
            href="/assets/multimedia/logo año diocesano.png"
            download
            className="boton-descarga"
          >
            ⬇️ Descargar
          </a>
        </div>
      </div>

      <section className="copyright-aviso">
        <p>
          © IAM Paraná. Todos los derechos reservados. Las imágenes, logotipos y
          dibujos expuestos en esta página son propiedad intelectual de sus
          respectivos autores. Como animadores podemos utilizarlos para realizar
          actividades en los encuentros, invitaciones o subirlos a redes
          sociales, pero no sería bueno que los utilicemos de manera comercial,
          o con fines de lucro. A Diosito no le gusta que robes.
        </p>
      </section>
              <div style={{ textAlign: "center", margin: "2rem 0" }}>
          <Link href="/comunicacion" className="boton-pagina color-comunicacion">
            ⬅ Volver a Comunicación
          </Link>
        </div>
    </main>
  );
}
