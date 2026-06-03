import {
  isGoogleCalendarConfigured,
  listCalendarAgendaEvents,
} from "@/server/lib/google-calendar-service";
import { listAgendaEventos } from "@/server/db/content-repository";
import AgendaHomeDarkClient, { type EventoCard } from "./agenda-home-dark-client";

export const dynamic = "force-dynamic";

function parseLocalDate(dateStr: string) {
  const datePart = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  const [year, month, day] = datePart.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export default async function AgendaHomeDark() {
  let data: EventoCard[] = [];
  try {
    if (isGoogleCalendarConfigured()) {
      try {
        data = (await listCalendarAgendaEvents()) || [];
      } catch {
        data = (await listAgendaEventos()) || [];
      }
    } else {
      data = (await listAgendaEventos()) || [];
    }
  } catch {
    // silencioso
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const eventos = data
    .filter((e) => parseLocalDate(e.fecha) >= hoy)
    .sort((a, b) => parseLocalDate(a.fecha).getTime() - parseLocalDate(b.fecha).getTime())
    .slice(0, 4);

  return <AgendaHomeDarkClient eventos={eventos} />;
}
