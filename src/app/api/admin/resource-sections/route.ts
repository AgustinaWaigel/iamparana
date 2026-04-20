import { NextResponse } from "next/server";
import { badRequest, isValidSlug, requirePermission, serverError } from "@/app/api/admin/_shared/auth";
import {
  createResourceSection,
  deleteResourceSection,
  getResourcePageById,
  getResourceSectionById,
  listResourceSections,
  moveResourceSection,
  updateResourceSection,
} from "@/app/db/resource-pages-repository";

export async function GET(req: Request) {
  const auth = await requirePermission("content.read");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const url = new URL(req.url);
    const pageId = Number(url.searchParams.get("pageId") || "0");

    if (!pageId) {
      return badRequest("pageId is required");
    }

    const sections = await listResourceSections(pageId);
    return NextResponse.json(sections);
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
    const pageId = Number(body.pageId || 0);
    const slug = String(body.slug || "").trim();
    const title = String(body.title || "").trim();

    if (!pageId) {
      return badRequest("pageId is required");
    }

    if (!title) {
      return badRequest("title is required");
    }

    if (slug && !isValidSlug(slug)) {
      return badRequest("Slug invalido. Usa solo minusculas, numeros y guiones");
    }

    const page = await getResourcePageById(pageId);
    if (!page) {
      return badRequest("Page not found");
    }

    const id = await createResourceSection({
      pageId,
      pageSlug: page.slug,
      slug,
      title,
    });

    return NextResponse.json({ success: true, id }, { status: 201 });
  } catch (error) {
    console.error(error);
    return serverError(error instanceof Error ? error.message : "No se pudo crear la seccion");
  }
}

export async function PUT(req: Request) {
  const auth = await requirePermission("content.write");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const id = Number(body.id || 0);
    const title = String(body.title || "").trim();
    const action = String(body.action || "").trim();
    const direction = body.direction === "up" ? "up" : body.direction === "down" ? "down" : null;

    if (!id) {
      return badRequest("id is required");
    }

    const section = await getResourceSectionById(id);
    if (!section) {
      return badRequest("Section not found");
    }

    if (action === "move" && direction) {
      await moveResourceSection(id, direction);
      return NextResponse.json({ success: true });
    }

    if (!title) {
      return badRequest("title is required");
    }

    await updateResourceSection(id, { title });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return serverError(error instanceof Error ? error.message : "No se pudo actualizar la seccion");
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

    await deleteResourceSection(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return serverError(error instanceof Error ? error.message : "No se pudo eliminar la seccion");
  }
}
