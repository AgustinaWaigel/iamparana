import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { badRequest, requirePermission, serverError } from "@/app/api/admin/_shared/auth";
import { createSpiritualPrayer, deleteSpiritualPrayer, getSpiritualPrayer, listSpiritualPrayers, updateSpiritualPrayer } from "@/server/db/spiritual-prayers-repository";

function validPayload(value: unknown): value is { title: string; description?: string; content: string; thumbnailUrl?: string | null } {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;
  return typeof data.title === "string" && data.title.trim().length > 0 && typeof data.content === "string" && data.content.trim().length > 0;
}

function refresh() {
  revalidatePath("/espiritualidad");
}

export async function GET() {
  const auth = await requirePermission("content.read");
  if ("errorResponse" in auth) return auth.errorResponse;
  try {
    return NextResponse.json(await listSpiritualPrayers());
  } catch (error) {
    console.error(error);
    return serverError();
  }
}

export async function POST(req: Request) {
  const auth = await requirePermission("content.write");
  if ("errorResponse" in auth) return auth.errorResponse;
  try {
    const body = await req.json();
    if (!validPayload(body) || !auth.user?.id) return badRequest("La oración necesita título y texto");
    const id = await createSpiritualPrayer({ ...body, title: body.title.trim(), content: body.content.trim(), createdByUserId: Number(auth.user.id) });
    refresh();
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error(error);
    return serverError("No se pudo publicar la oración");
  }
}

export async function PUT(req: Request) {
  const auth = await requirePermission("content.write");
  if ("errorResponse" in auth) return auth.errorResponse;
  try {
    const body = await req.json();
    const id = Number(body.id || 0);
    if (!id || !validPayload(body) || !(await getSpiritualPrayer(id))) return badRequest("Oración inválida o inexistente");
    await updateSpiritualPrayer(id, { ...body, title: body.title.trim(), content: body.content.trim() });
    refresh();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return serverError("No se pudo actualizar la oración");
  }
}

export async function DELETE(req: Request) {
  const auth = await requirePermission("content.delete");
  if ("errorResponse" in auth) return auth.errorResponse;
  try {
    const id = Number(new URL(req.url).searchParams.get("id") || 0);
    if (!id || !(await getSpiritualPrayer(id))) return badRequest("Oración inexistente");
    await deleteSpiritualPrayer(id);
    refresh();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return serverError("No se pudo eliminar la oración");
  }
}
