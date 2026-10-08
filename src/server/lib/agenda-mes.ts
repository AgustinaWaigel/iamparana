import "server-only";
import { listAgendaEventos } from "@/server/db/content-repository";
import { isGoogleCalendarConfigured, listCalendarAgendaEvents } from "@/server/lib/google-calendar-service";

// Lo que hay en la agenda (el calendario del sitio) durante un mes: fiestas y eventos.

export interface FechaDelMes {
  nombre: string;
  /** Día del mes en que empieza, o null si dura todo el mes (por ejemplo "Mes de las Misiones"). */
  dia: number | null;
  /** Último día, cuando dura más de uno. */
  hasta: number | null;
  evento: boolean;
}

// La agenda no distingue fiestas de actividades: se reconocen por el nombre o por el color
// con el que el equipo marca los eventos de la IAM en el calendario.
const PALABRAS_DE_EVENTO = /campamento|reuni[oó]n|formaci[oó]n|jornada|convivencia|elmi|elma|volanteada|pascua joven|encuentro|taller|retiro|asamblea/i;
const COLORES_DE_EVENTO = new Set(["5", "11"]);

async function listAgenda() {
  if (isGoogleCalendarConfigured()) {
    try {
      return await listCalendarAgendaEvents();
    } catch (error) {
      console.error("No se pudo leer Google Calendar; se usa la agenda local:", error);
    }
  }
  return await listAgendaEventos();
}

/** Fechas de la agenda que caen en ese mes: primero lo que dura todo el mes, después por día. */
export async function listFechasDelMes(anio: number, mes: number): Promise<FechaDelMes[]> {
  const prefijo = `${anio}-${String(mes).padStart(2, "0")}`;
  const primero = `${prefijo}-01`;
  const ultimoDia = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  const ultimo = `${prefijo}-${String(ultimoDia).padStart(2, "0")}`;

  const fechas: FechaDelMes[] = [];
  for (const item of await listAgenda()) {
    const inicio = String(item.fecha).slice(0, 10);
    const fin = String(item.fecha_fin || item.fecha).slice(0, 10);
    if (fin < primero || inicio > ultimo) continue;

    const evento = PALABRAS_DE_EVENTO.test(item.evento) || COLORES_DE_EVENTO.has(String(item.color ?? ""));
    const dia = inicio < primero ? 1 : Number(inicio.slice(8, 10));
    const hasta = fin > ultimo ? ultimoDia : Number(fin.slice(8, 10));
    const todoElMes = dia === 1 && hasta === ultimoDia;
    fechas.push({ nombre: item.evento, dia: todoElMes ? null : dia, hasta: todoElMes || hasta === dia ? null : hasta, evento });
  }
  return fechas.sort((a, b) => (a.dia ?? 0) - (b.dia ?? 0));
}
