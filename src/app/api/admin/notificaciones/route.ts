import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission, badRequest, serverError } from "@/app/api/admin/_shared/auth";
import { recordAuditEvent } from "@/server/db/audit-repository";
import { getAllPushSubscriptions, listNotificationsSent } from "@/server/db/notifications-repository";
import { listEventosConfigurados } from "@/server/lib/inscripciones-eventos";
import { sendNotificationToAll } from "@/server/lib/push-notification-service";

// Avisos especiales al celular, escritos por un administrador (por ejemplo, "abrieron las
// inscripciones"). Llegan a todos los que activaron las notificaciones del sitio.

const avisoSchema = z.object({
  titulo: z.string().trim().min(3, "Escribí un título.").max(60, "El título es muy largo."),
  mensaje: z.string().trim().min(5, "Escribí el mensaje.").max(180, "El mensaje es muy largo."),
  // Solo páginas de este sitio: así un aviso nunca lleva a otro lado.
  url: z.string().trim().max(200).regex(/^\/(?!\/)\S*$/, "El enlace tiene que ser una página del sitio, por ejemplo /inscripciones.").default("/"),
});

export async function GET() {
  const auth = await requirePermission("users.manage");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const [suscripciones, enviadas, eventos] = await Promise.all([
      getAllPushSubscriptions(),
      listNotificationsSent(15),
      listEventosConfigurados().catch(() => []),
    ]);
    return NextResponse.json({
      suscriptores: suscripciones.length,
      enviadas,
      eventos: eventos
        .filter((evento) => evento.estado === "abierta" || evento.estado === "proxima")
        .map((evento) => ({ id: evento.id, nombre: evento.evento, estado: evento.estado, abreAt: evento.config.abreAt, cierraAt: evento.config.cierraAt })),
    });
  } catch (error) {
    console.error(error);
    return serverError();
  }
}

export async function POST(req: Request) {
  const auth = await requirePermission("users.manage");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const parsed = avisoSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || "Revisá el aviso.");
    const { titulo, mensaje, url } = parsed.data;

    const id = Math.floor(Date.now() / 1000);
    const enviados = await sendNotificationToAll(
      { title: titulo, body: mensaje, icon: "/icon-192x192.png", badge: "/icon-192x192.png", tag: `aviso-${id}`, data: { url } },
      "aviso_manual",
      id,
    );
    await recordAuditEvent({ actor: auth.user, action: "create", entityType: "aviso", entityId: id, area: "administracion", metadata: { titulo, enviados } });
    return NextResponse.json({ ok: true, enviados });
  } catch (error) {
    console.error(error);
    return serverError();
  }
}
