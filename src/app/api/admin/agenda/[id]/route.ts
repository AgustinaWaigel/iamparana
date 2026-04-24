import { NextResponse } from "next/server";
import { AgendaInput, deleteAgendaAdmin, getAgendaAdmin, updateAgendaAdmin } from "@/server/db/admin-repository";
import { badRequest, requirePermission, parseId, serverError } from "@/app/api/admin/_shared/auth";

function isValidAgendaPayload(value: unknown): value is AgendaInput {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Partial<AgendaInput>;
  return (
    typeof v.evento === "string" && v.evento.trim().length > 0 &&
    typeof v.fecha === "string" && v.fecha.length >= 10
  );
}

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission("content.read");
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  
  if (!id) return badRequest("ID de evento inválido");

  try {
    const item = await getAgendaAdmin(id);
    if (!item) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json(item);
  } catch (error) {
    console.error(error);
    return serverError();
  }
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission("content.write");
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  if (!id) return badRequest("ID inválido");

  let body: unknown;
  try { body = await req.json(); } catch { return badRequest("JSON malformado"); }

  if (!isValidAgendaPayload(body)) return badRequest("Payload inválido");

  try {
    // 1. Primero verificamos si existe
    const existing = await getAgendaAdmin(id);
    if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    // 2. Ejecutamos el update (sin testear la veracidad del void)
    await updateAgendaAdmin(id, {
      ...body,
      evento: body.evento.trim()
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return serverError("No se pudo actualizar");
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission("content.delete");
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  if (!id) return badRequest("ID inválido");

  try {
    // 1. Verificamos existencia antes de borrar para poder dar un 404 real
    const existing = await getAgendaAdmin(id);
    if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    // 2. Ejecutamos el delete
    await deleteAgendaAdmin(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return serverError("No se pudo borrar");
  }
}