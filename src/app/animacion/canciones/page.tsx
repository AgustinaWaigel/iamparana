import { getAllCanciones } from "@/app/lib/canciones";
import CancionesLista from "@/app/components/cancioneslista";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Canciones | IAM Paraná",
  description: "Explorá el cancionero oficial de la Infancia y Adolescencia Misionera de Paraná.",
  openGraph: {
    title: "Canciones - IAM Paraná",
    description: "Buscá tus canciones favoritas de la IAM y aprendé los acordes.",
    url: "https://iamparana.com.ar/animacion/canciones",
    images: [
      {
        url: "https://iamparana.com.ar/assets/header/LOGOIAMPNA.svg", // Ruta actualizada
        alt: "Logo IAM Paraná",
        width: 800,
        height: 600,
      },
    ],
    type: "website",
  },
  icons: {
    icon: "/favicon.ico", // Ruta simplificada tras la limpieza
  },
};

export default async function CancionesPage() {
  // Obtenemos los datos directamente desde Turso a través de la lib
  const canciones = await getAllCanciones();

  return (
    <main className="seccion-areas">
      <header className="mb-6">
        <h2 className="barra-contextual color-animacion-boton">Cancionero</h2>
        <p className="subtitulo-descriptivo text-stone-600">
          Encontrá las letras y acordes de tus canciones favoritas de la IAM.
        </p>
      </header>
      
      <hr className="divisor" />
      
      {/* Pasamos las canciones al Client Component que maneja la búsqueda y el filtrado */}
      <CancionesLista canciones={canciones} />
      
      <hr className="divisor" />
    </main>
  );
}