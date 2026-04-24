import { NextResponse } from "next/server";
import { createAgendaAdmin, listAgendaAdmin } from "@/server/db/admin-repository";
import { badRequest, requirePermission, serverError } from "@/app/api/admin/_shared/auth";

// GET: /api/admin/agenda (Lista completa)
export async function GET() {
  const auth = await requirePermission("content.read");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const items = await listAgendaAdmin();
    return NextResponse.json(items);
  } catch (error) {
    return serverError();
  }
}

// POST: /api/admin/agenda (Crear nuevo)
export async function POST(req: Request) {
  const auth = await requirePermission("content.write");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    await createAgendaAdmin(body);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return serverError();
  }
}