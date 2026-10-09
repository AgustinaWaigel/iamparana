import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAreaWrite, badRequest, serverError } from "@/app/api/admin/_shared/auth";
import { recordAuditEvent } from "@/server/db/audit-repository";
import { deleteRendicion, saveRendicion } from "@/server/db/rendiciones-repository";

// Cuentas claras: guarda o borra la rendición de un evento. Solo el equipo de Logística y los administradores.

const rendicionSchema = z.object({
  id: z.string().trim().regex(/^[0-9a-f]{24}$/).optional(),
  evento: z.string().trim().min(2, "Poné el nombre del evento.").max(120),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Elegí la fecha del evento."),
  nota: z.string().trim().max(600).default(""),
  movimientos: z
    .array(
      z.object({
        tipo: z.enum(["ingreso", "egreso"]),
        concepto: z.string().trim().min(1, "A un movimiento le falta el concepto.").max(80),
        monto: z.number({ message: "A un movimiento le falta el monto." }).int("Los montos van sin centavos.").min(1, "Los montos tienen que ser mayores que cero.").max(1_000_000_000),
      }),
    )
    .min(1, "Cargá al menos un movimiento.")
    .max(80),
});

export async function PUT(req: Request) {
  const auth = await requireAreaWrite("logistica");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const parsed = rendicionSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || "Revisá los datos.");

    const id = await saveRendicion(parsed.data, auth.user.id);
    await recordAuditEvent({ actor: auth.user, action: parsed.data.id ? "update" : "create", entityType: "rendicion", area: "logistica", metadata: { evento: parsed.data.evento, movimientos: parsed.data.movimientos.length } });
    revalidatePath("/logistica");
    return NextResponse.json({ ok: true, id });
  } catch (error) {
    console.error(error);
    return serverError();
  }
}

export async function DELETE(req: Request) {
  const auth = await requireAreaWrite("logistica");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const body = await req.json().catch(() => null);
    const id = typeof body?.id === "string" && /^[0-9a-f]{24}$/.test(body.id) ? body.id : null;
    if (!id) return badRequest("Falta la rendición.");
    await deleteRendicion(id);
    await recordAuditEvent({ actor: auth.user, action: "delete", entityType: "rendicion", area: "logistica", metadata: { id } });
    revalidatePath("/logistica");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return serverError();
  }
}
