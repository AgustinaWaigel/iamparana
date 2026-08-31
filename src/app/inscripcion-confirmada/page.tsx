import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Check, FolderOpen, House } from 'lucide-react';

const DRIVE_URL =
  'https://drive.google.com/drive/folders/11kLMD29024YRVHAb8SkFZlPau8TRCJ0Fhttps://drive.google.com/file/d/1eXwQyyVbB5hHLEESDsmEp4J_Ly6VNRE_/view?usp=sharing
export const metadata: Metadata = {
  title: 'Inscripción confirmada',
  description: 'Confirmación de inscripción al evento de IAM Paraná.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function InscripcionConfirmadaPage() {
  return (
    <section className="relative isolate flex min-h-[calc(100vh-5rem)] items-center overflow-hidden bg-[#f7f3ed] px-4 py-14 sm:px-6 sm:py-20">
      <div
        aria-hidden="true"
        className="absolute -left-24 top-16 -z-10 h-72 w-72 rounded-full bg-amber-200/45 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -right-24 bottom-10 -z-10 h-80 w-80 rounded-full bg-orange-200/40 blur-3xl"
      />

      <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-[2rem] border border-[#622d0d]/10 bg-white shadow-[0_24px_70px_rgba(83,48,25,0.12)]">
        <div className="h-2 bg-[#622d0d]" />

        <div className="px-6 py-10 text-center sm:px-12 sm:py-14">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 ring-8 ring-emerald-50">
            <Check aria-hidden="true" className="h-10 w-10" strokeWidth={3} />
          </div>

          <p className="mt-8 text-xs font-black uppercase tracking-[0.24em] text-[#9a5b2e]">
            Formulario enviado
          </p>
          <h1 className="mt-3 font-display text-4xl font-black tracking-tight text-[#3a2a1c] sm:text-5xl">
            ¡Tu inscripción fue recibida!
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-stone-600 sm:text-lg">
            Gracias por inscribirte. Guardamos tus datos correctamente y ya sos parte de este encuentro.
          </p>

          <div className="mx-auto mt-8 max-w-lg rounded-2xl border-2 border-amber-300 bg-amber-50 p-5 text-left shadow-sm">
            <div className="flex items-start gap-4">
              <span className="mt-0.5 rounded-xl bg-white p-2.5 text-[#622d0d] shadow-sm">
                <FolderOpen aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <p className="mb-1 text-xs font-black uppercase tracking-wider text-amber-800">
                  Importante
                </p>
                <h2 className="text-lg font-extrabold text-stone-800">Carta para las familias</h2>
                <p className="mt-1 text-sm leading-relaxed text-stone-600">
                  La carta contiene información fundamental sobre el evento. Por favor, descargala,
                  leela atentamente y compartila con tus padres o responsables.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <a
              href={DRIVE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#622d0d] px-7 py-3.5 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#7a3a10] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#622d0d] focus:ring-offset-2"
            >
              Ver la carta para las familias
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </a>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-7 py-3.5 text-sm font-bold text-stone-700 transition hover:border-stone-400 hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2"
            >
              <House aria-hidden="true" className="h-4 w-4" />
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
