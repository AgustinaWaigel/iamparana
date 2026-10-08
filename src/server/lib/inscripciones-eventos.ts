import "server-only";

import { listAgendaEventos } from "@/server/db/content-repository";
import { getEventoConfig, listEventoConfigs, type EventoConfig } from "@/server/db/inscripciones-repository";
import { isGoogleCalendarConfigured, listCalendarAgendaEvents } from "@/server/lib/google-calendar-service";
import { todayYmd, toYmd } from "@/server/lib/inscripciones-validation";

// Une la agenda (Google Calendar o base local, igual que /api/agenda) con la
// configuración de inscripción de cada evento.

export interface EventoAgenda {
  id: string;
  evento: string;
  fecha: string;
  fechaFin: string | null;
  descripcion: string | null;
}

export interface EventoConInscripcion extends EventoAgenda {
  config: EventoConfig;
}

async function listAgenda(): Promise<EventoAgenda[]> {
  let rows: Array<Record<string, unknown>> = [];
  if (isGoogleCalendarConfigured()) {
    try {
      rows = (await listCalendarAgendaEvents()) as unknown as Array<Record<string, unknown>>;
    } catch {
      rows = (await listAgendaEventos()) as unknown as Array<Record<string, unknown>>;
    }
  } else {
    rows = (await listAgendaEventos()) as unknown as Array<Record<string, unknown>>;
  }

  return rows
    .filter((row) => row.id !== undefined && row.id !== null && typeof row.fecha === "string")
    .map((row) => ({
      id: String(row.id),
      evento: String(row.evento || ""),
      fecha: toYmd(String(row.fecha)),
      fechaFin: row.fecha_fin ? toYmd(String(row.fecha_fin)) : null,
      descripcion: row.descripcion ? String(row.descripcion) : null,
    }));
}

export type EstadoInscripcion = "apagada" | "finalizado" | "proxima" | "cerrada" | "abierta";

/**
 * En qué momento está la inscripción hoy. Abre el día `abreAt` y cierra al terminar
 * el día `cierraAt` (los dos inclusive); sin fechas, está abierta hasta que termina el evento.
 */
export function estadoInscripcion(evento: EventoAgenda, config: EventoConfig, today = todayYmd()): EstadoInscripcion {
  if (!config.habilitada) return "apagada";
  if ((evento.fechaFin || evento.fecha) < today) return "finalizado";
  if (config.abreAt && today < config.abreAt) return "proxima";
  if (config.cierraAt && today > config.cierraAt) return "cerrada";
  return "abierta";
}

/** ¿Se puede inscribir hoy? Habilitada, dentro de las fechas y con el evento sin terminar. */
export function isInscripcionAbierta(evento: EventoAgenda, config: EventoConfig, today = todayYmd()): boolean {
  return estadoInscripcion(evento, config, today) === "abierta";
}

/** Eventos con inscripción abierta hoy y los que todavía no abrieron, del más próximo al más lejano. */
export async function listEventosConInscripcion(): Promise<{ abiertos: EventoConInscripcion[]; proximos: EventoConInscripcion[] }> {
  const [agenda, configs] = await Promise.all([listAgenda(), listEventoConfigs()]);
  const configById = new Map(configs.map((config) => [config.eventoId, config]));
  const today = todayYmd();

  const abiertos: EventoConInscripcion[] = [];
  const proximos: EventoConInscripcion[] = [];
  for (const evento of [...agenda].sort((a, b) => a.fecha.localeCompare(b.fecha))) {
    const config = configById.get(evento.id);
    if (!config) continue;
    const estado = estadoInscripcion(evento, config, today);
    if (estado === "abierta") abiertos.push({ ...evento, config });
    else if (estado === "proxima") proximos.push({ ...evento, config });
  }
  return { abiertos, proximos };
}

/** Un evento con su configuración, esté abierto o no. null si no existe o no tiene inscripción. */
export async function getEventoConInscripcion(eventoId: string): Promise<EventoConInscripcion | null> {
  const [agenda, config] = await Promise.all([listAgenda(), getEventoConfig(eventoId)]);
  const evento = agenda.find((item) => item.id === eventoId);
  return evento && config ? { ...evento, config } : null;
}

/** Eventos de la agenda por id, para mostrar su nombre y fecha. Los que ya no están en la agenda no aparecen. */
export async function getEventosPorId(ids: string[]): Promise<Map<string, EventoAgenda>> {
  if (ids.length === 0) return new Map();
  const wanted = new Set(ids);
  return new Map((await listAgenda()).filter((evento) => wanted.has(evento.id)).map((evento) => [evento.id, evento]));
}

/** Todos los eventos de la agenda que tienen inscripción configurada, con su estado de hoy. Para el admin. */
export async function listEventosConfigurados(): Promise<Array<EventoConInscripcion & { estado: EstadoInscripcion }>> {
  const [agenda, configs] = await Promise.all([listAgenda(), listEventoConfigs()]);
  const configById = new Map(configs.map((config) => [config.eventoId, config]));
  const today = todayYmd();
  return agenda
    .flatMap((evento) => {
      const config = configById.get(evento.id);
      return config ? [{ ...evento, config, estado: estadoInscripcion(evento, config, today) }] : [];
    })
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}
