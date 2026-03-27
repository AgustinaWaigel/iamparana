import { NextResponse } from "next/server";
import {
  CarouselInput,
  createCarouselAdmin,
  listCarouselAdmin,
} from "@/db/admin-repository";
import { badRequest, requirePermission, isValidSlug, serverError } from "@/api/admin/_shared/auth";

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

export async function GET(req: Request) {
  const auth = await requirePermission(req, "content.read");
  if ("response" in auth) return auth.response;

  try {
    const items = await listCarouselAdmin();
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

  if (!isValidCarouselPayload(body)) {
    return badRequest("Payload de carousel invalido");
  }

  try {
    await createCarouselAdmin(body);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error(error);
    return serverError("No se pudo crear el item del carousel");
  }
}
