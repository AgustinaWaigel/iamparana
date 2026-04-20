import { NextResponse } from "next/server";
import {
  CarouselInput,
  deleteCarouselAdmin,
  getCarouselAdmin,
  updateCarouselAdmin,
} from "@/server/db/admin-repository";
import { badRequest, requirePermission, isValidSlug, parseId, serverError } from "@/app/api/admin/_shared/auth";

function isValidCarouselPayload(value: unknown): value is CarouselInput {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Partial<CarouselInput>;

  const slugOk = typeof v.slug === "undefined" || v.slug === null || isValidSlug(v.slug);
  const orderOk = typeof v.order === "undefined" || Number.isInteger(v.order);

  return (
    slugOk &&
    orderOk &&
    typeof v.imageDesktop === "string" &&
    typeof v.imageMobile === "string" &&
    typeof v.alt === "string"
  );
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
    const item = await getCarouselAdmin(id);
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

  if (!isValidCarouselPayload(body)) {
    return badRequest("Payload de carousel invalido");
  }

  try {
    await updateCarouselAdmin(id, body);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return serverError("No se pudo actualizar el item del carousel");
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
    await deleteCarouselAdmin(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return serverError("No se pudo borrar el item del carousel");
  }
}
