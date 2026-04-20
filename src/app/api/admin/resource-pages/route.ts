import { NextResponse } from "next/server";
import { badRequest, isValidSlug, requirePermission, serverError } from "@/app/api/admin/_shared/auth";
import {
  createResourcePage,
  deleteResourcePage,
  getResourcePageById,
  listResourcePages,
  updateResourcePage,
} from "@/server/db/resource-pages-repository";

export async function GET() {
  const auth = await requirePermission("content.read");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const pages = await listResourcePages();
    return NextResponse.json(pages);
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
    const slug = String(body.slug || "").trim();
    const title = String(body.title || "").trim();
    const description = String(body.description || "").trim();
    const textureUrl = String(body.textureUrl || "").trim();
    const template = String(body.template || "gold").trim();

    if (!title) {
      return badRequest("Title is required");
    }

    if (slug && !isValidSlug(slug)) {
      return badRequest("Slug invalido. Usa solo minusculas, numeros y guiones");
    }

    const userId = auth.user?.id;
    if (!userId) {
      return serverError("User ID not found");
    }

    const id = await createResourcePage({
      slug,
      title,
      description: description || undefined,
      textureUrl: textureUrl || undefined,
      template: template || "gold",
      createdByUserId: Number(userId),
    });

    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (error) {
    console.error(error);
    return serverError(error instanceof Error ? error.message : "No se pudo crear la pagina");
  }
}

export async function PUT(req: Request) {
  const auth = await requirePermission("content.write");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const id = Number(body.id || 0);
    const title = String(body.title || "").trim();
    const description = String(body.description || "").trim();
    const textureUrl = String(body.textureUrl || "").trim();
    const template = String(body.template || "gold").trim();

    if (!id) {
      return badRequest("id is required");
    }

    const page = await getResourcePageById(id);
    if (!page) {
      return badRequest("Page not found");
    }

    await updateResourcePage(id, {
      title: title || page.title,
      description: description || "",
      textureUrl: textureUrl || "",
      template: template || "gold",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return serverError(error instanceof Error ? error.message : "No se pudo actualizar la pagina");
  }
}

export async function DELETE(req: Request) {
  const auth = await requirePermission("content.delete");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const url = new URL(req.url);
    const id = Number(url.searchParams.get("id") || "0");

    if (!id) {
      return badRequest("id is required");
    }

    await deleteResourcePage(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return serverError(error instanceof Error ? error.message : "No se pudo eliminar la pagina");
  }
}
