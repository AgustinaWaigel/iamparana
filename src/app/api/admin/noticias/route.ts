import { NextResponse } from "next/server";
import {
  createNoticiaAdmin,
  listNoticiasAdmin,
  NoticiaInput,
} from "@/db/admin-repository";
import { badRequest, requirePermission, isValidSlug, serverError } from "@/api/admin/_shared/auth";

function isValidNoticiaPayload(value: unknown): value is NoticiaInput {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Partial<NoticiaInput>;
  return (
    isValidSlug(v.slug) &&
    typeof v.title === "string" &&
    typeof v.date === "string" &&
    typeof v.description === "string" &&
    typeof v.image === "string" &&
    typeof v.content === "string"
  );
}

export async function GET(req: Request) {
  const auth = await requirePermission(req, "content.read");
  if ("response" in auth) return auth.response;

  try {
    const items = await listNoticiasAdmin();
    return NextResponse.json(items);
  } catch (error) {
    console.error(error);
    return serverError();
  }
}

export async function POST(req: Request) {
  const auth = await requirePermission(req, "content.write");
  if ("response" in auth) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Body invalido");
  }

  if (!isValidNoticiaPayload(body)) {
    return badRequest("Payload de noticia invalido");
  }

  try {
    await createNoticiaAdmin(body);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error(error);
    return serverError("No se pudo crear la noticia");
  }
}
