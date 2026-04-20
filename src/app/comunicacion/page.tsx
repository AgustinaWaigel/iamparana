import React from "react";
import Link from "next/link";
import { Metadata, Viewport } from "next";
import { HeroSection } from "@/app/components/common/hero-section";

export const viewport: Viewport = {
  themeColor: "#622d0d",
};

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
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Comunicación",
  },
};

export default function Comunicacion() {
  return (
    <>
      {/* Área de comunicación: concentra material gráfico reutilizable por los equipos. */}
      <div id="header"></div>

      {/* Encabezado visual de la sección. */}
      <HeroSection
        title="Comunicación"
        textureUrl="/assets/textures/areasg.webp"
        overlayColor="rgba(59, 130, 246, 0.7), rgba(96, 165, 250, 0.75)"
        gradientClass="from-blue-500 to-blue-400"
        description="Aquí vas a poder encontrar recursos gráficos para ser utilizados en tus encuentros: logos, imágenes de la IAM y dibujos de artistas conocidos."
        textColor="text-white"
      />

      <main className="seccion areas">
        {/* Navegación hacia los recursos gráficos disponibles. */}
        <div className="listabotones">
          <Link href="/comunicacion/logos" className="px-10 py-3 rounded-lg font-bold text-lg transition-all duration-300 hover:scale-105 hover:shadow-lg no-underline bg-blue-400 text-white shadow-md">
            Logos
          </Link>
          <Link href="/comunicacion/dibujos" className="px-10 py-3 rounded-lg font-bold text-lg transition-all duration-300 hover:scale-105 hover:shadow-lg no-underline bg-blue-400 text-white shadow-md">
            Dibujos
          </Link>
        </div>
        <hr className="my-4 border-gray-300" />
        {/* Aviso legal y de uso responsable de los recursos publicados. */}
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
