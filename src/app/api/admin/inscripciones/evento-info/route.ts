import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { recordAuditEvent } from "@/server/db/audit-repository";
import { getEventoInfo, saveEventoInfo } from "@/server/db/evento-info-repository";
import { requirePermission } from "@/server/lib/api-utils";
import { isSameOriginRequest } from "@/server/lib/cuenta-session";

export const dynamic = "force-dynamic";

// Información práctica de un evento (lugar, horarios, qué llevar, cómo pagar). Solo administradores.

const texto = (max: number) => z.string().trim().max(max).default("");

const infoSchema = z.object({
  eventoId: z.string().trim().min(1).max(200),
  lugar: texto(120),
  direccion: texto(200),
  mapaUrl: z.string().trim().max(500).regex(/^(https:\/\/\S+)?$/i, "El enlace del mapa tiene que empezar con https://").default(""),
  llegada: texto(120),
  salida: texto(120),
  queLlevar: z.array(z.string().trim().min(1).max(120)).max(60).default([]),
  pago: z
    .object({ alias: texto(60), cbu: texto(40), titular: texto(120), comprobante: texto(160), nota: texto(400) })
    .default({ alias: "", cbu: "", titular: "", comprobante: "", nota: "" }),
});

export async function GET(request: NextRequest) {
  const { errorResponse } = await requirePermission("users.manage");
  if (errorResponse) return errorResponse;

  const eventoId = request.nextUrl.searchParams.get("eventoId")?.trim();
  if (!eventoId) return NextResponse.json({ error: "Falta el evento." }, { status: 400 });
  try {
    return NextResponse.json({ info: await getEventoInfo(eventoId) });
  } catch (error) {
    console.error("admin/inscripciones/evento-info GET", error instanceof Error ? error.message : "error");
    return NextResponse.json({ error: "No se pudo cargar la información." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const { errorResponse, user } = await requirePermission("users.manage");
  if (errorResponse) return errorResponse;
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Pedido no permitido." }, { status: 403 });

  const parsed = infoSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Revisá los datos." }, { status: 400 });

  try {
    const { eventoId, ...info } = parsed.data;
    await saveEventoInfo(eventoId, info);
    await recordAuditEvent({ actor: user, action: "update", entityType: "evento_info", area: "administracion", metadata: { eventoId } });
    revalidatePath(`/inscripciones/${encodeURIComponent(eventoId)}`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("admin/inscripciones/evento-info PUT", error instanceof Error ? error.message : "error");
    return NextResponse.json({ error: "No se pudo guardar la información." }, { status: 500 });
  }
}
