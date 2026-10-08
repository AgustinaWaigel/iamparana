import { NextRequest, NextResponse } from "next/server";
import { recordAuditEvent } from "@/server/db/audit-repository";
import { adminCambiarEmail, adminCancelarInvitacion, adminDesvincularPersona, adminQuitarAcceso, buscarCuentas, getCuentaDetalle } from "@/server/db/cuentas-admin-repository";
import { INVITACION_DIAS, createInvitacion } from "@/server/db/cuentas-repository";
import { requirePermission } from "@/server/lib/api-utils";
import { isSameOriginRequest, normalizeEmail } from "@/server/lib/cuenta-session";
import { sendAdultInvitationEmail, sendEmailChangedNotice } from "@/server/lib/email-service";

export const dynamic = "force-dynamic";

// Recuperación de cuentas familiares. Solo administradores; todo queda en la auditoría.

const id = (value: unknown) => (typeof value === "string" ? value.trim().slice(0, 64) : "");
const enviarMails = () => !(process.env.NODE_ENV !== "production" && process.env.INSCRIPCIONES_EMAIL_MODE === "console");

export async function GET(request: NextRequest) {
  const { errorResponse, user } = await requirePermission("users.manage");
  if (errorResponse) return errorResponse;

  try {
    const cuentaId = id(request.nextUrl.searchParams.get("id"));
    if (cuentaId) {
      const cuenta = await getCuentaDetalle(cuentaId);
      if (!cuenta) return NextResponse.json({ error: "No encontramos esa cuenta." }, { status: 404 });
      await recordAuditEvent({ actor: user, action: "ver", entityType: "cuenta_familiar", entityId: cuentaId }).catch(() => undefined);
      return NextResponse.json({ cuenta });
    }

    const texto = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 80);
    if (texto.length < 3) return NextResponse.json({ error: "Escribí al menos 3 letras para buscar." }, { status: 400 });
    return NextResponse.json({ cuentas: await buscarCuentas(texto) });
  } catch (error) {
    console.error("admin/inscripciones/cuentas GET", error instanceof Error ? error.name : "error");
    return NextResponse.json({ error: "No se pudo buscar." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { errorResponse, user } = await requirePermission("users.manage");
  if (errorResponse) return errorResponse;
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Pedido no permitido." }, { status: 403 });

  const body = await request.json().catch(() => null);
  const cuentaId = id(body?.cuentaId);
  const accion = typeof body?.accion === "string" ? body.accion : "";
  if (!cuentaId) return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  const audit = (action: string, metadata: Record<string, unknown>) =>
    recordAuditEvent({ actor: user, action, entityType: "cuenta_familiar", entityId: cuentaId, metadata }).catch(() => undefined);

  try {
    if (accion === "email") {
      const email = normalizeEmail(body?.email);
      if (!email) return NextResponse.json({ error: "Revisá el email: no parece válido." }, { status: 400 });
      const anterior = await adminCambiarEmail(cuentaId, email);
      if (!anterior) return NextResponse.json({ error: "Ese email ya es de otra cuenta familiar. Usá «Dar acceso a otro adulto» para compartirle a los chicos." }, { status: 409 });
      await audit("cambiar_email", { anterior, nuevo: email });
      // Aviso al email anterior, por si el cambio no lo pidió su dueño.
      if (enviarMails() && !anterior.endsWith(".invalid")) await sendEmailChangedNotice(anterior).catch(() => undefined);
      return NextResponse.json({ ok: true });
    }

    if (accion === "dar_acceso") {
      const email = normalizeEmail(body?.email);
      if (!email) return NextResponse.json({ error: "Revisá el email: no parece válido." }, { status: 400 });
      const created = await createInvitacion(cuentaId, email);
      if (!created) return NextResponse.json({ error: "Esta cuenta no tiene a nadie a cargo para compartir." }, { status: 400 });
      await audit("dar_acceso", { email });
      if (enviarMails() && !email.endsWith(".invalid")) await sendAdultInvitationEmail(email, INVITACION_DIAS).catch(() => undefined);
      return NextResponse.json({ ok: true });
    }

    if (accion === "quitar_acceso") {
      const otraCuentaId = id(body?.otraCuentaId);
      if (!otraCuentaId || otraCuentaId === cuentaId) return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
      const quitadas = await adminQuitarAcceso(cuentaId, otraCuentaId);
      await audit("quitar_acceso", { otraCuentaId, personas: quitadas });
      return NextResponse.json({ ok: true });
    }

    if (accion === "cancelar_invitacion") {
      const email = normalizeEmail(body?.email);
      if (!email) return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
      await adminCancelarInvitacion(cuentaId, email);
      await audit("cancelar_invitacion", { email });
      return NextResponse.json({ ok: true });
    }

    if (accion === "desvincular") {
      const personaId = id(body?.personaId);
      if (!personaId) return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
      const done = await adminDesvincularPersona(cuentaId, personaId);
      if (!done) return NextResponse.json({ error: "No se puede sacar: es quien responde por la cuenta, o es la única cuenta que tiene a esa persona. Primero dale acceso a otro adulto." }, { status: 400 });
      await audit("desvincular_persona", { personaId });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  } catch (error) {
    console.error("admin/inscripciones/cuentas POST", error instanceof Error ? error.name : "error");
    return NextResponse.json({ error: "No se pudo completar el cambio." }, { status: 500 });
  }
}
