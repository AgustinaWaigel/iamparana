import { NextResponse } from "next/server";
import { checkAndSendEventNotifications } from "@/server/lib/notification-scheduler";

// Tarea diaria: manda los avisos de los eventos de la agenda que tienen las notificaciones
// activadas. La dispara el programador de tareas del hosting (ver vercel.json), que se
// identifica con CRON_SECRET. Sin esa clave configurada, la ruta no hace nada.

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const result = await checkAndSendEventNotifications();
  return NextResponse.json({ ok: true, enviados: result.sent, eventos: result.events.length });
}
