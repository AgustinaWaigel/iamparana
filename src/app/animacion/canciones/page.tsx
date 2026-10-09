import { getAllCanciones } from "@/server/content/canciones";
import CancionesLista from "@/app/components/common/cancioneslista";
import { AreaHero, AreaPage } from "@/app/components/common/area-hero";
import { Metadata } from "next";

export const revalidate = 60;

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
    <AreaPage
      hero={
        <AreaHero
          area="animacion"
          title="Canciones"
          description="Explorá letras con acordes, buscá por título o artista y armá tu repertorio para animar encuentros."
          crumbs={[]}
        />
      }
    >
      <CancionesLista canciones={canciones} />
    </AreaPage>
  );
}
