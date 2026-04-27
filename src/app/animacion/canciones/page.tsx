import { getAllCanciones } from "@/server/content/canciones";
import CancionesLista from "@/app/components/common/cancioneslista";
import { Metadata } from "next";
import Link from "next/link";
import { Music2, BookOpenText } from "lucide-react";

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
  const canciones = await getAllCanciones();

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 md:py-10">
      <section className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-900 via-green-800 to-emerald-700 p-6 md:p-8 text-white shadow-xl mb-8">
        <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -left-8 -bottom-10 h-32 w-32 rounded-full bg-lime-300/20 blur-xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-widest mb-3">
              <Music2 size={14} /> Cancionero IAM
            </div>
            <h1 className="text-3xl md:text-4xl font-black leading-tight">Canciones para tus encuentros</h1>
            <p className="text-emerald-100 mt-3 max-w-2xl">
              Explorá letras con acordes, buscá por título o artista y armá tu repertorio para animar celebraciones y reuniones.
            </p>
          </div>
        </div>
      </section>

      <CancionesLista canciones={canciones} />
    </main>
  );
}