import { getAllCanciones } from '@/lib/canciones';
import CancionesLista from '@/components/cancioneslista';
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Canciones",
  description: "Canciones de la IAM",
  openGraph: {
    title: "Canciones",
    description: "Cancionero de la IAM",
    url: "https://iamparana.com.ar/animacion/canciones",
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
};

export default async function CancionesPage() {
  const canciones = await getAllCanciones();

  return (
    <div className="seccion-areas">
      <h2 className="barra-contextual color-animacion-boton">Cancionero</h2>
      <p className= "subtitulo-descriptivo">Buscá acá tus canciones favoritas de la IAM</p>
                      <hr className="divisor" />
      <CancionesLista canciones={canciones} />
                      <hr className="divisor" />
    </div>
  );
}
