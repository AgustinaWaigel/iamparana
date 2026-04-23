import Link from "next/link";
import CalendarioEventosView from "@/app/components/common/calendario-eventos-view";

const GOOGLE_CALENDAR_ID = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ID?.trim();
const GOOGLE_CALENDAR_ADD_URL = GOOGLE_CALENDAR_ID
  ? `https://calendar.google.com/calendar/u/0/r?cid=${encodeURIComponent(
    GOOGLE_CALENDAR_ID
  )}`
  : "https://calendar.google.com/calendar/u/0/r";

export async function generateMetadata() {
  return {
    title: "Calendario | IAM Paraná",
    description: "Actividades, reuniones y campamentos de la Infancia y Adolescencia Misionera de Paraná.",
    openGraph: {
      title: "Calendario - IAM Paraná",
      description: "Consultá las fechas de nuestras próximas actividades y encuentros.",
      // Esta página es la vista pública del calendario completo.
      // Además de mostrar los eventos, ofrece un acceso directo al Google Calendar oficial.
      url: "https://iamparana.com.ar/calendario",
      siteName: "IAM Paraná",
      locale: "es_AR",
      type: "website",
    },
  };
}

export default function CalendarioPage() {
  return (
    <>
    <main className="min-h-screen w-full bg-slate-50/50 px-4 pb-16 pt-4 sm:px-6 lg:px-8">
      {/* Header Card */}
      {/* Header Card */}
      
    <section className="mx-auto max-w-6xl overflow-hidden rounded-3xl border border-brand-gold/30 bg-gradient-to-br from-brand-brown via-brand-brown to-amber-900 p-8 text-white shadow-2xl sm:p-12">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
    
    {/* Columna Izquierda: Descripción */}
      <div className="space-y-4">
        <div className="inline-block rounded-full bg-brand-gold/20 px-4 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gold border border-brand-gold/30">
          Información Oficial
        </div>
        <p className="text-lg font-medium text-amber-50/90 leading-relaxed italic border-l-2 border-brand-gold/50 pl-4">
          Mantenete al tanto de todas las actividades, reuniones de guías y campamentos.
        </p>
      </div>

    {/* Columna Derecha: Título y Acción */}
      <div className="flex flex-col lg:items-end gap-6">
        <div className="lg:text-right">
            {/* Columna izquierda: contexto y descripción para el visitante. */}
          <h1 className="text-2xl font-bold text-white">
            Calendario <span className="text-brand-gold">IAM</span>
          </h1>
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.3em] text-amber-50/40">
          Arquidiócesis de Paraná
          </p>
      </div>


      <Link
        href={GOOGLE_CALENDAR_ADD_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex w-fit items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-bold text-white transition-all hover:scale-105 hover:bg-white/20 active:scale-95"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 3h-1V1h-2v2H8V1H6v2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm0 16H5V10h14v9zm0-11H5V5h14v3zm-6 7h3v2h-3v3h-2v-3H8v-2h3v-3h2v3z"/>
        </svg>
        Agregar a mi Google Calendar
      </Link>
    </div>
              {/* Botón para abrir o suscribirse al calendario oficial en Google. */}

    </div>
    </section>

      <CalendarioEventosView />

      <footer className="mt-8 text-center">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">
          Infancia y Adolescencia Misionera • Arquidiócesis de Paraná
        </p>
      </footer>
    </main>
   </>
  );
}