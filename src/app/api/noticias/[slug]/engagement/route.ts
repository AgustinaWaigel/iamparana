import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/app/api/admin/_shared/auth";
import { createNewsComment, deleteNewsComment, getNewsEngagement, toggleNewsLike } from "@/server/db/news-engagement-repository";

type Context = { params: Promise<{ slug: string }> };

function validSlug(slug: string) {
  return /^[a-z0-9-]+$/.test(slug);
}

export async function GET(_req: NextRequest, { params }: Context) {
  const { slug } = await params;
  if (!validSlug(slug)) return NextResponse.json({ error: "Slug inválido" }, { status: 400 });

  try {
    const user = await getSessionUser();
    return NextResponse.json(await getNewsEngagement(slug, user?.id));
  } catch (error) {
    console.error("news engagement GET", error);
    return NextResponse.json({ error: "No se pudieron cargar las interacciones" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Context) {
  const { slug } = await params;
  if (!validSlug(slug)) return NextResponse.json({ error: "Slug inválido" }, { status: 400 });

  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Iniciá sesión para participar" }, { status: 401 });

  try {
    const body = await req.json();
    if (body?.type === "like") {
      const liked = await toggleNewsLike(slug, user.id);
      return NextResponse.json({ liked });
    }

    if (body?.type === "comment") {
      const content = typeof body.content === "string" ? body.content.trim() : "";
      if (!content || content.length > 1000) {
        return NextResponse.json({ error: "El comentario debe tener entre 1 y 1000 caracteres" }, { status: 400 });
      }
      await createNewsComment(slug, user.id, content);
      return NextResponse.json({ success: true }, { status: 201 });
    }

    return NextResponse.json({ error: "Tipo de interacción inválido" }, { status: 400 });
  } catch (error) {
    console.error("news engagement POST", error);
    return NextResponse.json({ error: "No se pudo guardar la interacción" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Context) {
  const { slug } = await params;
  if (!validSlug(slug)) return NextResponse.json({ error: "Slug inválido" }, { status: 400 });

  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const commentId = Number(req.nextUrl.searchParams.get("commentId"));
  if (!Number.isInteger(commentId) || commentId <= 0) {
    return NextResponse.json({ error: "Comentario inválido" }, { status: 400 });
  }

  try {
    const deleted = await deleteNewsComment(commentId, user.id, user.role === "admin");
    if (!deleted) return NextResponse.json({ error: "No podés eliminar este comentario" }, { status: 403 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("news engagement DELETE", error);
    return NextResponse.json({ error: "No se pudo eliminar el comentario" }, { status: 500 });
  }
}
