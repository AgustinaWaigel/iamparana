import { NextResponse } from "next/server";
import { requirePermission, badRequest, serverError } from "@/app/api/admin/_shared/auth";
import {
  saveLink,
  getLinksBySection,
  getLink,
  updateLink,
  deleteLink,
} from "@/app/db/admin-repository";

// GET /api/admin/links?section=formacion
export async function GET(req: Request) {
  const auth = await requirePermission("content.read");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const url = new URL(req.url);
    const section = url.searchParams.get("section");
    const id = url.searchParams.get("id");

    if (id) {
      const link = await getLink(parseInt(id));
      return NextResponse.json(link);
    }

    if (!section) {
      return badRequest("Section parameter required");
    }

    const links = await getLinksBySection(section);
    return NextResponse.json(links);
  } catch (error) {
    console.error(error);
    return serverError();
  }
}

// POST /api/admin/links - Create new link
export async function POST(req: Request) {
  const auth = await requirePermission("content.write");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const body = await req.json();
    const { section, title, description, url, icon } = body;

    if (!section) {
      return badRequest("Section is required");
    }

    if (!title) {
      return badRequest("Title is required");
    }

    if (!url) {
      return badRequest("URL is required");
    }

    // Validar que sea una URL válida
    try {
      new URL(url);
    } catch {
      return badRequest("Invalid URL format");
    }

    const userId = auth.user?.id;
    if (!userId) {
      return serverError("User ID not found");
    }

    const linkId = await saveLink({
      section,
      title,
      description,
      url,
      icon,
      created_by_user_id: userId,
    });

    const newLink = await getLink(Number(linkId));
    return NextResponse.json(newLink, { status: 201 });
  } catch (error) {
    console.error(error);
    return serverError();
  }
}

// PUT /api/admin/links?id=123 - Update link
export async function PUT(req: Request) {
  const auth = await requirePermission("content.write");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return badRequest("ID parameter required");
    }

    const body = await req.json();
    const { title, description, url: newUrl, icon } = body;

    if (newUrl) {
      try {
        new URL(newUrl);
      } catch {
        return badRequest("Invalid URL format");
      }
    }

    await updateLink(parseInt(id), {
      title,
      description,
      url: newUrl,
      icon,
    });

    const updated = await getLink(parseInt(id));
    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return serverError();
  }
}

// DELETE /api/admin/links?id=123 - Delete link
export async function DELETE(req: Request) {
  const auth = await requirePermission("content.delete");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return badRequest("ID parameter required");
    }

    await deleteLink(parseInt(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return serverError();
  }
}
