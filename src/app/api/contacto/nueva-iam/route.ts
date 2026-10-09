import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getClientIp, isSameOriginRequest } from "@/server/lib/cuenta-session";
import { sendNuevaIamEmail } from "@/server/lib/email-service";

// "¿Querés empezar una IAM en tu parroquia?": el mensaje le llega por mail al equipo.
// No se guarda nada en la base.

const linea = (min: number, max: number, falta: string) =>
  z.string().trim().min(min, falta).max(max, "Ese dato es demasiado largo.").regex(/^[^\r\n]*$/, "Ese dato va en una sola línea.");

const consultaSchema = z.object({
  nombre: linea(2, 80, "Decinos tu nombre."),
  contacto: linea(5, 120, "Dejanos un mail o un teléfono para poder escribirte."),
  parroquia: linea(2, 120, "Decinos de qué parroquia, capilla o colegio sos."),
  ciudad: linea(2, 80, "Decinos de qué ciudad sos."),
  mensaje: z.string().trim().max(2000, "El mensaje es demasiado largo.").default(""),
  // Campo trampa: las personas no lo ven; si viene completo, lo llenó un programa.
  web: z.string().max(200).default(""),
});

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Pedido no permitido." }, { status: 403 });
  }
  if (!(await checkRateLimit("nueva-iam-ip", getClientIp(request), 5, 60))) {
    return NextResponse.json({ error: "Ya recibimos varios mensajes desde acá. Probá de nuevo más tarde." }, { status: 429 });
  }

  const parsed = consultaSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Revisá los datos." }, { status: 400 });
  }
  const { web, ...consulta } = parsed.data;
  // A un programa se le contesta que salió bien, pero no se manda nada.
  if (web) return NextResponse.json({ ok: true });

  try {
    await sendNuevaIamEmail(consulta);
    return NextResponse.json({ ok: true });
  } catch {
    // Sin detalles: el error no lleva datos de quien escribió.
    console.error("No se pudo enviar una consulta para empezar una IAM.");
    return NextResponse.json({ error: "No pudimos enviar tu mensaje. Probá de nuevo en un rato." }, { status: 500 });
  }
}
