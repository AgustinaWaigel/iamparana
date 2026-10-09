import { NextResponse } from "next/server";
import { checkAndSendEventNotifications, checkAndSendInscripcionNotifications } from "@/server/lib/notification-scheduler";

// Tarea diaria: manda los avisos de los eventos de la agenda que tienen las notificaciones
// activadas, y los de las inscripciones (cuando abren y cuando están por cerrar). La dispara el programador de tareas del hosting (ver vercel.json), que se
// identifica con CRON_SECRET. Sin esa clave configurada, la ruta no hace nada.

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const eventos = await checkAndSendEventNotifications();
  const inscripciones = await checkAndSendInscripcionNotifications();
  return NextResponse.json({ ok: true, enviados: eventos.sent + inscripciones.sent, eventos: eventos.events.length, inscripciones: inscripciones.events.length });
}
