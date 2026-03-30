import AgendaClient from "./agenda-client";
import { fetchAPI } from "@/lib/api-client";

interface Evento {
  fecha: string;
  fecha_fin?: string;
  evento: string;
}

export default async function Agenda() {
  const data = await fetchAPI<Evento>("/api/agenda");
  
  const hoy = new Date();
  const limite = new Date();
  limite.setMonth(hoy.getMonth() + 2);

  const eventosVisibles = data.filter((e) => new Date(e.fecha) <= limite);
  const eventosFuturos = data.filter((e) => new Date(e.fecha) > limite);

  return <AgendaClient eventosVisibles={eventosVisibles} eventosFuturos={eventosFuturos} />;
}
