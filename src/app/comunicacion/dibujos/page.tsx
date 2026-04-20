import React from "react";
import { Metadata, Viewport } from "next";
import Link from "next/link";
import Image from "next/image";

export const viewport: Viewport = {
  themeColor: "#622d0d",
};

export const metadata: Metadata = {
  title: "Dibujos",
  description: "Dibujos para tus encuentros",
  openGraph: {
    title: "Dibujos",
    description: "Dibujos para tus encuentros",
    url: "https://iamparana.com.ar/comunicacion/dibujos.html",
    images: [
      {
        url: "https://iamparana.com.ar/logoiam.jpg",
        alt: "Logo IAM Paraná",
        width: 800,
        height: 600,
      },
    ],
    type: "website",
  },
  icons: {
    icon: "/assets/resources/favicon.ico",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Dibujos",
  },
};

export default function DibujosPage() {
  return (
    <>
      <div id="header"></div>

      <main>
        <div className="barra-contextual color-comunicacion fondo-comunicacion">
          <p>
            <span className="texto-encima"></span>
            <br />
            <strong>Dibujos</strong>
          </p>
        </div>

        <div className="flex flex-wrap gap-8 justify-center py-8 px-4">
          <div className="bg-white rounded-2xl shadow-md p-4 w-60 flex flex-col justify-between hover:scale-105 transition-transform duration-300">
            <Image
              src="/assets/multimedia/Cris-camargo.webp"
              alt="Cris Camargo"
              width={800}
              height={800}
            />
            <a
              href="https://drive.google.com/drive/folders/1yzOjbr51Xu--V3C3Vfj2F10n_8Y8mAu-"
              target="_blank"
              className="mt-4 inline-flex items-center justify-center gap-2 bg-yellow-300 text-black font-bold px-6 py-2 rounded-xl shadow-md hover:bg-yellow-400 hover:-translate-y-0.5 hover:shadow-lg transition-all no-underline"
              rel="noopener noreferrer"
            >
              🔗 Ver Cris
            </a>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-4 w-60 flex flex-col justify-between hover:scale-105 transition-transform duration-300">
            <Image src="/assets/multimedia/fano.webp" 
            alt="Fano"
            width={800}
            height={800}/>
            <a
              href="https://drive.google.com/drive/folders/1u-0qXHkreinOLw63rgi4jVaqeGGZ4mA2"
              target="_blank"
              className="mt-4 inline-flex items-center justify-center gap-2 bg-yellow-300 text-black font-bold px-6 py-2 rounded-xl shadow-md hover:bg-yellow-400 hover:-translate-y-0.5 hover:shadow-lg transition-all no-underline"
              rel="noopener noreferrer"
            >
              🔗 Ver Fano
            </a>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-4 w-60 flex flex-col justify-between hover:scale-105 transition-transform duration-300">
            <Image
              src="/assets/multimedia/para colorear.webp"
              alt="Para colorear"
              width={800}
              height={800}
            />
            <a
              href="https://drive.google.com/drive/folders/1p2etdR43EDnZqm_jkLefMc60jbANlgSG"
              target="_blank"
              className="mt-4 inline-flex items-center justify-center gap-2 bg-yellow-300 text-black font-bold px-6 py-2 rounded-xl shadow-md hover:bg-yellow-400 hover:-translate-y-0.5 hover:shadow-lg transition-all no-underline"
              rel="noopener noreferrer"
            >
              🔗 Ver para colorear
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

        <div className="text-center py-8">
          <Link href="/comunicacion" className="inline-block px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 hover:scale-105 hover:shadow-lg no-underline bg-blue-400 text-white">
            ⬅ Volver a Comunicación
          </Link>
        </div>
      </main>

      <div id="footer"></div>
    </>
  );
}
