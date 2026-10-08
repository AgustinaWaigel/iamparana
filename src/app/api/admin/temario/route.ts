import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAreaWrite, badRequest, serverError } from "@/app/api/admin/_shared/auth";
import { recordAuditEvent } from "@/server/db/audit-repository";
import { saveTemarioAnio } from "@/server/db/temario-repository";

// Guarda el temario de un año. Solo el equipo de Formación y los administradores.

const texto = (max: number) => z.string().trim().max(max).default("");
// El material es un enlace completo (Drive, por ejemplo) o una página de este sitio.
const enlace = z
  .string()
  .trim()
  .max(500)
  .default("")
  .refine((value) => value === "" || /^https:\/\/\S+$/i.test(value) || /^\/[^/\s]\S*$/.test(value), "El enlace tiene que empezar con https:// o con /");

const itemSchema = z.object({
  tema: texto(140),
  cita: texto(400),
  detalle: texto(800),
  materialUrl: enlace,
  eje: texto(200),
  objetivo: texto(300),
  virtudes: texto(200),
  sagradaFamilia: texto(200),
  herramientas: texto(200),
  festividades: texto(500),
  eventos: texto(400),
});

const temarioSchema = z.object({
  anio: z.number().int().min(2000).max(2100),
  general: itemSchema,
  meses: z.array(itemSchema.extend({ mes: z.number().int().min(1).max(12) })).max(12),
});

export async function PUT(req: Request) {
  const auth = await requireAreaWrite("formacion");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const parsed = temarioSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message || "Revisá los datos del temario.");
    }
    const { anio, general, meses } = parsed.data;
    if (new Set(meses.map((item) => item.mes)).size !== meses.length) {
      return badRequest("Hay un mes repetido.");
    }

    await saveTemarioAnio(anio, general, meses, auth.user.id);
    await recordAuditEvent({ actor: auth.user, action: "update", entityType: "temario", entityId: anio, area: "formacion", metadata: { meses: meses.filter((item) => item.tema).length } });
    revalidatePath("/formacion");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return serverError();
  }
}
