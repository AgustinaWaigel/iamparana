import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import Image from "next/image"

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


      <div className="flex flex-wrap gap-8 justify-center py-8 px-4">
        <div className="bg-white rounded-2xl shadow-md p-4 w-60 flex flex-col justify-between hover:scale-105 transition-transform duration-300">
          <Image
            src="/assets/multimedia/logo año jubilar.png"
            alt="Logo Año Jubilar"
            width={800}
            height={800}
          />
          <a
            href="/assets/multimedia/logo año jubilar.png"
            download
            className="mt-4 inline-flex items-center justify-center gap-2 bg-yellow-300 text-black font-bold px-6 py-2 rounded-xl shadow-md hover:bg-yellow-400 hover:-translate-y-0.5 hover:shadow-lg transition-all no-underline"
          >
            ⬇️ Descargar
          </a>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-4 w-60 flex flex-col justify-between hover:scale-105 transition-transform duration-300">
          <Image
            src="/assets/multimedia/logo-iam-arq-parana.png"
            alt="Logo IAM Paraná"
                        width={800}
            height={800}
          />
          <a
            href="/assets/multimedia/logo-iam-arq-parana.png"
            download
            className="mt-4 inline-flex items-center justify-center gap-2 bg-yellow-300 text-black font-bold px-6 py-2 rounded-xl shadow-md hover:bg-yellow-400 hover:-translate-y-0.5 hover:shadow-lg transition-all no-underline"
          >
            ⬇️ Descargar
          </a>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-4 w-60 flex flex-col justify-between hover:scale-105 transition-transform duration-300">
          <Image
            src="/assets/multimedia/logo iam nuevo redondo.png"
            alt="Logo IAM Redondo"
                        width={800}
            height={800}
          />
          <a
            href="/assets/multimedia/logo iam nuevo redondo.png"
            download
            className="mt-4 inline-flex items-center justify-center gap-2 bg-yellow-300 text-black font-bold px-6 py-2 rounded-xl shadow-md hover:bg-yellow-400 hover:-translate-y-0.5 hover:shadow-lg transition-all no-underline"
          >
            ⬇️ Descargar
          </a>
        </div>

        <div className="bg-white rounded-2xl shadow-md p-4 w-60 flex flex-col justify-between hover:scale-105 transition-transform duration-300">
          <Image
            src="/assets/multimedia/logo año diocesano.png"
            alt="Logo Año Diocesano"
                        width={800}
            height={800}
          />
          <a
            href="/assets/multimedia/logo año diocesano.png"
            download
            className="mt-4 inline-flex items-center justify-center gap-2 bg-yellow-300 text-black font-bold px-6 py-2 rounded-xl shadow-md hover:bg-yellow-400 hover:-translate-y-0.5 hover:shadow-lg transition-all no-underline"
          >
            ⬇️ Descargar
          </a>
        </div>
      </div>

      <section className="text-center text-xs text-gray-600 px-4 py-8 max-w-4xl mx-auto italic">
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
