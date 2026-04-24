import AgendaClient from "./agenda-client";
import AgendaAdmin from "./agenda-admin";
import { listAgendaEventos } from "@/server/db/content-repository";
import {
  isGoogleCalendarConfigured,
  listCalendarAgendaEvents,
} from "@/server/lib/google-calendar-service";
export const dynamic = "force-dynamic";

interface Evento {
  id?: string | number;
  fecha: string;
  fecha_fin?: string;
  evento: string;
  color?: string;
  descripcion?: string;
}

const parseLocalDate = (dateStr: string) => {
  // Convierte fechas de la agenda a una fecha local para poder filtrar y ordenar.
  const datePart = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  const [year, month, day] = datePart.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export default async function Agenda() {
  let data: Evento[] = [];
  try {
    // La agenda intenta leer primero desde Google Calendar y, si falla, usa la base local.
    if (isGoogleCalendarConfigured()) {
      try {
        data = (await listCalendarAgendaEvents()) || [];
      } catch (calendarError) {
        console.error("Error al leer Google Calendar, se usa agenda local:", calendarError);
        data = (await listAgendaEventos()) || [];
      }
    } else {
      data = (await listAgendaEventos()) || [];
    }
  } catch (error) {
    console.error("Error al obtener la agenda:", error);
  }

  // Se toma la fecha de hoy a medianoche para comparar solo el día y no la hora.
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // Se muestran solo eventos de hoy en adelante, ordenados del más próximo al más lejano.
  const eventosFuturosYHoy = data
    .filter((e) => parseLocalDate(e.fecha) >= hoy)
    .sort((a, b) => parseLocalDate(a.fecha).getTime() - parseLocalDate(b.fecha).getTime());

  // La vista pública usa la misma lista para mostrar agenda y administración.
  const eventosVisibles = eventosFuturosYHoy;
  const eventosFuturos: Evento[] = [];

 return (
    <section className="animate-in fade-in duration-700">
      <div className="mx-auto flex w-full max-w-4xl">
      <AgendaAdmin eventosVisibles={eventosVisibles} eventosFuturos={eventosFuturos} />

        {eventosFuturosYHoy.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-amber-200 bg-gradient-to-b from-amber-50/60 to-white px-6 py-12 text-center shadow-sm w-full">
            <span className="mb-3 block text-3xl">📆</span>
            <p className="text-brand-brown font-semibold italic">
              No hay actividades programadas por el momento.
            </p>
            <p className="mt-1 text-sm text-amber-900/60">Pronto compartiremos nuevas fechas.</p>
          </div>
        ) : (
          <AgendaClient
            eventosVisibles={eventosVisibles}
            eventosFuturos={eventosFuturos}
          />
        )}
      </div>
    </section>
  );
}