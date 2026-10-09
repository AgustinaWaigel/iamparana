import { CalendarPlus } from "lucide-react";
import CalendarioEventosView from "@/app/components/common/calendario-eventos-view";

// Calendario completo: el mes, lo que pasa en él y un acceso para sumar el calendario oficial al propio.

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
      url: "https://iamparana.com.ar/calendario",
      siteName: "IAM Paraná",
      locale: "es_AR",
      type: "website",
    },
  };
}

export default function CalendarioPage() {
  return (
    <div className="min-h-screen w-full bg-brand-paper px-4 pb-20 pt-16 sm:px-6 sm:pt-20 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
        <div>
          <h1 className="m-0 text-left font-display text-[clamp(2.5rem,9vw,5rem)] font-extrabold leading-[0.95] tracking-[-0.03em] text-brand-ink">
            Calendario
          </h1>
          <p className="m-0 mt-4 max-w-xl text-left text-base leading-relaxed text-brand-ink/80 sm:text-lg">
            Encuentros, reuniones de animadores, campamentos y fiestas de la IAM de Paraná. Tocá un día para ver el detalle.
          </p>
        </div>
        <a
          href={GOOGLE_CALENDAR_ADD_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-brand-deep px-5 py-3 text-sm font-extrabold text-white no-underline transition-colors hover:bg-brand-brown focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-brown sm:self-auto"
        >
          <CalendarPlus size={18} aria-hidden />
          Sumarlo a mi Google Calendar
        </a>
      </div>

      <CalendarioEventosView />
    </div>
  );
}
