import { NextResponse } from "next/server";
import { AgendaInput, deleteAgendaAdmin, getAgendaAdmin, updateAgendaAdmin } from "@/db/admin-repository";
import { badRequest, requirePermission, parseId, serverError } from "@/api/admin/_shared/auth";

function isValidAgendaPayload(value: unknown): value is AgendaInput {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Partial<AgendaInput>;
  return typeof v.evento === "string" && typeof v.fecha === "string";
}

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission("content.read");
  if ("errorResponse" in auth) return auth.errorResponse;

  const params = await context.params;
  const id = parseId(params.id);
  if (!id) {
    return badRequest("Id invalido");
  }

  try {
    const item = await getAgendaAdmin(id);
    if (!item) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    return NextResponse.json(item);
  } catch (error) {
    console.error(error);
    return serverError();
  }
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission("content.write");
  if ("errorResponse" in auth) return auth.errorResponse;

  const params = await context.params;
  const id = parseId(params.id);
  if (!id) {
    return badRequest("Id invalido");
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Body invalido");
  }

  if (!isValidAgendaPayload(body)) {
    return badRequest("Payload de agenda invalido");
  }

  try {
    await updateAgendaAdmin(id, body);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return serverError("No se pudo actualizar el evento");
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission("content.delete");
  if ("errorResponse" in auth) return auth.errorResponse;

  const params = await context.params;
  const id = parseId(params.id);
  if (!id) {
    return badRequest("Id invalido");
  }

  try {
    await deleteAgendaAdmin(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return serverError("No se pudo borrar el evento");
  }
}
