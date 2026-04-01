import { NextResponse } from "next/server";
import {
  CancionInput,
  createCancionAdmin,
  listCancionesAdmin,
} from "@/app/db/admin-repository";
import { badRequest, requirePermission, isValidSlug, serverError } from "@/app/api/admin/_shared/auth";

function isValidCancionPayload(value: unknown): value is CancionInput {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Partial<CancionInput>;
  return (
    isValidSlug(v.slug) &&
    typeof v.title === "string" &&
    typeof v.artist === "string" &&
    typeof v.content === "string"
  );
}

export async function GET(req: Request) {
  const auth = await requirePermission("content.read");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const items = await listCancionesAdmin();
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

  if (!isValidCancionPayload(body)) {
    return badRequest("Payload de cancion invalido");
  }

  try {
    await createCancionAdmin(body);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error(error);
    return serverError("No se pudo crear la cancion");
  }
}
