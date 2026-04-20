import AgendaClient from "./agenda-client";
import AgendaAdmin from "./agenda-admin";
import { fetchAPI } from "@/app/lib/api-client";

interface Evento {
  id?: string | number;
  fecha: string;
  fecha_fin?: string;
  evento: string;
  color?: string;
  descripcion?: string;
}

const parseLocalDate = (dateStr: string) => {
  // Maneja tanto "YYYY-MM-DD" como ISO strings que vienen de APIs
  const datePart = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  const [year, month, day] = datePart.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export default async function Agenda() {
  let data: Evento[] = [];
  try {
    // Asumimos que fetchAPI devuelve un array de Eventos
    data = (await fetchAPI<Evento>("/api/agenda")) || [];
  } catch (error) {
    console.error("Error fetching agenda:", error);
  }

  // 1. Definimos "Hoy" a las 00:00 para comparar solo fechas
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // 2. Definimos el límite de los próximos 2 meses
  const limite = new Date();
  limite.setMonth(hoy.getMonth() + 2);

  // 3. Filtramos primero para sacar los eventos viejos (antes de hoy)
  // y ordenamos los que quedan de más cerca a más lejos.
  const eventosFuturosYHoy = data
    .filter((e) => parseLocalDate(e.fecha) >= hoy) // <--- CRUCIAL: Solo de hoy en adelante
    .sort((a, b) => parseLocalDate(a.fecha).getTime() - parseLocalDate(b.fecha).getTime());

  // 4. Segmentamos entre lo que se ve primero y lo que queda bajo el botón "Ver más"
  const eventosVisibles = eventosFuturosYHoy.filter((e) => {
    const fechaEvento = parseLocalDate(e.fecha);
    return fechaEvento <= limite;
  });

  const eventosFuturos = eventosFuturosYHoy.filter((e) => {
    const fechaEvento = parseLocalDate(e.fecha);
    return fechaEvento > limite;
  });

  return (
    <section className="animate-in fade-in duration-700">
      <div className="mx-auto flex w-full max-w-4xl">
        {/* Panel de administración */}
        <AgendaAdmin
          eventosVisibles={eventosVisibles}
          eventosFuturos={eventosFuturos}
        />

        {/* Si no hay eventos futuros, mostramos un mensaje amigable */}
        {eventosFuturosYHoy.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-amber-200 bg-gradient-to-b from-amber-50/60 to-white px-6 py-12 text-center shadow-sm">
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