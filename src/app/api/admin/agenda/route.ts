import { NextResponse } from "next/server";
import { AgendaInput, createAgendaAdmin, listAgendaAdmin } from "@/app/db/admin-repository";
import { badRequest, requirePermission, serverError } from "@/app/api/admin/_shared/auth";

function isValidAgendaPayload(value: unknown): value is AgendaInput {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Partial<AgendaInput>;
  return typeof v.evento === "string" && typeof v.fecha === "string";
}

export async function GET(req: Request) {
  const auth = await requirePermission("content.read");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const items = await listAgendaAdmin();
    return NextResponse.json(items);
  } catch (error) {
    console.error(error);
    return serverError();
  }
}

export async function POST(req: Request) {
  const auth = await requirePermission("content.write");
  if ("errorResponse" in auth) return auth.errorResponse;

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
    await createAgendaAdmin(body);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error(error);
    return serverError("No se pudo crear el evento");
  }
}
