import { NextRequest, NextResponse } from "next/server";
import { requirePermission, badRequest, serverError } from "@/app/api/admin/_shared/auth";
import { listAuditEvents } from "@/server/db/audit-repository";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requirePermission("users.manage");
  if ("errorResponse" in auth) return auth.errorResponse;
  const params = req.nextUrl.searchParams;
  const rawLimit = Number(params.get("limit") || "100");
  const rawOffset = Number(params.get("offset") || "0");
  if (!Number.isInteger(rawLimit) || rawLimit < 1 || rawLimit > 200 || !Number.isInteger(rawOffset) || rawOffset < 0) {
    return badRequest("Parámetros de paginación inválidos");
  }
  try {
    return NextResponse.json(await listAuditEvents(rawLimit, rawOffset));
  } catch (error) {
    console.error("Error obteniendo auditoría:", error);
    return serverError("No se pudo obtener la bitácora");
  }
}
