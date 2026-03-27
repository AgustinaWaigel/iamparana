import React from "react";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Comunicación",
  description: "Página del equipo de comunicación",
  openGraph: {
    title: "Comunicación",
    description: "Página del equipo de comunicación",
    url: "https://iamparana.com.ar/comunicacion",
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
  themeColor: "#622d0d",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Comunicación",
  },
};

export default function Comunicacion() {
  return (
    <>
      <div id="header"></div>

      <h2 className="mt-20 py-8 px-5 text-3xl font-bold bg-gradient-to-r from-blue-400 to-blue-500 text-white text-center">Comunicación</h2>
      <main className="seccion areas">
        <p className="subtitulo-descriptivo">
          Aca vas a poder encontrar
          recursos gráficos para ser utilizados en tus encuentros, tanto de logos
          e imágenes de la iam, como además de dibujos de artistas conocidos.
        </p>

        <div className="listabotones">
          <Link href="/comunicacion/logos" className="px-10 py-3 rounded-lg font-bold text-lg transition-all duration-300 hover:scale-105 hover:shadow-lg no-underline bg-blue-400 text-white shadow-md">
            Logos
          </Link>
          <Link href="/comunicacion/dibujos" className="px-10 py-3 rounded-lg font-bold text-lg transition-all duration-300 hover:scale-105 hover:shadow-lg no-underline bg-blue-400 text-white shadow-md">
            Dibujos
          </Link>
        </div>
        <hr className="my-4 border-gray-300" />
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
                <hr className="divisor" />
      </main>

      <div id="footer"></div>
    </>
  );
}
