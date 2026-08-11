import { getAllCanciones } from "@/server/content/canciones";
import CancionesLista from "@/app/components/common/cancioneslista";
import { HeroSection } from "@/app/components/common/hero-section";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Canciones | IAM Paraná",
  description: "Explorá el cancionero oficial de la Infancia y Adolescencia Misionera de Paraná.",
  openGraph: {
    title: "Canciones - IAM Paraná",
    description: "Buscá tus canciones favoritas de la IAM y aprendé los acordes.",
    url: "https://iamparana.com.ar/animacion/canciones",
    images: [
      {
        url: "https://iamparana.com.ar/assets/header/LOGOIAMPNA.svg",
        alt: "Logo IAM Paraná",
        width: 800,
        height: 600,
      },
    ],
    type: "website",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default async function CancionesPage() {
  const canciones = await getAllCanciones();

  return (
    <>
      <section>
        <HeroSection
          title="Canciones"
          textureUrl="/assets/textures/areasg.webp"
          overlayColor="rgba(20, 83, 45, 0.65), rgba(22, 163, 74, 0.8)"
          gradientClass="from-green-900 via-green-800 to-emerald-700"
          description="Explorá letras con acordes, buscá por título o artista y armá tu repertorio para animar encuentros."
          textColor="text-white"
        />
      </section>

      <main className="max-w-7xl mx-auto px-4 pb-8 md:pb-10">
        <CancionesLista canciones={canciones} />
      </main>
    </>
  );
}
