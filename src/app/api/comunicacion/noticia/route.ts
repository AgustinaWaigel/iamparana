import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getClientIp, isSameOriginRequest } from "@/server/lib/cuenta-session";
import { sendNoticiaPropuestaEmail } from "@/server/lib/email-service";

// Propuestas de noticias: cualquiera puede contarle a Comunicación lo que pasó en su IAM.
// No se guarda nada en la base: la propuesta le llega por mail al equipo de Comunicación.

const linea = (min: number, max: number, falta: string) =>
  z.string().trim().min(min, falta).max(max, "Ese dato es demasiado largo.").regex(/^[^\r\n]*$/, "Ese dato va en una sola línea.");

const propuestaSchema = z.object({
  nombre: linea(2, 80, "Decinos tu nombre."),
  iam: linea(2, 100, "Decinos de qué IAM o comunidad sos."),
  contacto: linea(5, 120, "Dejanos un mail o un teléfono para poder escribirte."),
  titulo: linea(4, 120, "Ponele un título a la noticia."),
  texto: z.string().trim().min(30, "Contanos un poco más: qué pasó, cuándo y dónde.").max(4000, "El texto es demasiado largo."),
  fotos: z.string().trim().max(300).regex(/^(https:\/\/\S+)?$/i, "El enlace a las fotos tiene que empezar con https://").default(""),
  // Campo trampa: las personas no lo ven; si viene completo, lo llenó un programa.
  web: z.string().max(200).default(""),
});

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Pedido no permitido." }, { status: 403 });
  }
  if (!(await checkRateLimit("noticia-ip", getClientIp(request), 5, 60))) {
    return NextResponse.json({ error: "Ya recibimos varias propuestas desde acá. Probá de nuevo más tarde." }, { status: 429 });
  }

  const parsed = propuestaSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Revisá los datos." }, { status: 400 });
  }
  const { web, ...propuesta } = parsed.data;
  // A un programa se le contesta que salió bien, pero no se manda nada.
  if (web) return NextResponse.json({ ok: true });

  try {
    await sendNoticiaPropuestaEmail(propuesta);
    return NextResponse.json({ ok: true });
  } catch {
    // Sin detalles: el error no lleva datos de quien escribió.
    console.error("No se pudo enviar una propuesta de noticia.");
    return NextResponse.json({ error: "No pudimos enviar tu noticia. Probá de nuevo en un rato." }, { status: 500 });
  }
}
