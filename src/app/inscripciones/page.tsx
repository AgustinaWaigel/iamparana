import type { Metadata } from "next";
import InscripcionesClient from "./inscripciones-client";

export const metadata: Metadata = {
  title: "Inscripciones | IAM Paraná",
  description: "Inscribite a los próximos encuentros y actividades de IAM Paraná.",
};

export default function InscripcionesPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50/70 to-slate-50 px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-deep via-brand-brown to-amber-900 px-6 py-10 text-white shadow-xl sm:px-10">
          <span className="inline-flex rounded-full border border-brand-gold/40 bg-brand-gold/15 px-4 py-1 text-xs font-bold uppercase tracking-[0.2em] text-brand-goldsoft">Sumate</span>
          <h1 className="mt-4 font-display text-3xl font-extrabold sm:text-4xl">Inscripciones a eventos</h1>
          <p className="mt-3 max-w-2xl leading-relaxed text-amber-50/85">Encontrá la próxima actividad de IAM Paraná y completá tu inscripción de manera sencilla y segura.</p>
        </header>

        <InscripcionesClient />
      </div>
    </main>
  );
}
