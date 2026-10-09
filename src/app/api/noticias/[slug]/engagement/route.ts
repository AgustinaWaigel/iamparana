import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/app/api/admin/_shared/auth";
import {
  approveGuestComment, canCreateNewsComment, createGuestComment, createNewsComment, deleteGuestComment,
  deleteNewsComment, getNewsEngagement, toggleNewsLike,
} from "@/server/db/news-engagement-repository";
import { moderateComment } from "@/server/lib/comment-moderation";
import { checkRateLimit, getClientIp } from "@/server/lib/cuenta-session";

type Context = { params: Promise<{ slug: string }> };

function validSlug(slug: string) {
  return /^[a-z0-9-]+$/.test(slug);
}

function commentId(req: NextRequest) {
  const id = Number(req.nextUrl.searchParams.get("commentId"));
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(_req: NextRequest, { params }: Context) {
  const { slug } = await params;
  if (!validSlug(slug)) return NextResponse.json({ error: "Slug inválido" }, { status: 400 });

  try {
    const user = await getSessionUser();
    // Los comentarios de invitados que esperan aprobación solo los ve un administrador.
    return NextResponse.json(await getNewsEngagement(slug, user?.id, user?.role === "admin"));
  } catch (error) {
    console.error("news engagement GET", error);
    return NextResponse.json({ error: "No se pudieron cargar las interacciones" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Context) {
  const { slug } = await params;
  if (!validSlug(slug)) return NextResponse.json({ error: "Slug inválido" }, { status: 400 });

  const user = await getSessionUser();

  try {
    const body = await req.json();
    if (body?.type === "like") {
      if (!user) return NextResponse.json({ error: "Iniciá sesión para dar Me gusta" }, { status: 401 });
      const liked = await toggleNewsLike(slug, user.id);
      return NextResponse.json({ liked });
    }

    if (body?.type === "comment") {
      const content = typeof body.content === "string" ? body.content.trim() : "";
      if (!content || content.length > 1000) {
        return NextResponse.json({ error: "El comentario debe tener entre 1 y 1000 caracteres" }, { status: 400 });
      }

      const moderation = moderateComment(content);
      if (!moderation.allowed) {
        return NextResponse.json({ error: moderation.message }, { status: 422 });
      }

      // Sin cuenta: nombre y comentario, que quedan esperando a que un administrador los apruebe.
      if (!user) {
        // Campo trampa: las personas no lo ven; si viene completo, es un robot y no se guarda nada.
        if (typeof body.web === "string" && body.web.trim()) return NextResponse.json({ success: true, pending: true }, { status: 201 });

        const name = typeof body.name === "string" ? body.name.trim().replace(/\s+/g, " ") : "";
        if (name.length < 2 || name.length > 60) {
          return NextResponse.json({ error: "Escribí tu nombre (entre 2 y 60 letras)." }, { status: 400 });
        }
        if (/https?:\/\/|www\./i.test(name) || !moderateComment(name).allowed) {
          return NextResponse.json({ error: "Ese nombre no se puede usar. Probá con otro." }, { status: 422 });
        }
        if (!(await checkRateLimit("comentario-invitado", getClientIp(req), 3, 10))) {
          return NextResponse.json({ error: "Mandaste varios comentarios seguidos. Esperá unos minutos y probá de nuevo." }, { status: 429 });
        }
        const creado = await createGuestComment(slug, name, content);
        if (!creado) return NextResponse.json({ error: "Ese comentario ya fue enviado." }, { status: 409 });
        return NextResponse.json({ success: true, pending: true }, { status: 201 });
      }

      const commentGuard = await canCreateNewsComment(slug, user.id, content);
      if (commentGuard.tooFast) {
        return NextResponse.json({ error: "Esperá unos segundos antes de publicar otro comentario." }, { status: 429 });
      }
      if (commentGuard.duplicate) {
        return NextResponse.json({ error: "Ese comentario ya fue publicado." }, { status: 409 });
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

/** Aprueba el comentario de un invitado. Solo administradores. */
export async function PATCH(req: NextRequest, { params }: Context) {
  const { slug } = await params;
  if (!validSlug(slug)) return NextResponse.json({ error: "Slug inválido" }, { status: 400 });

  const user = await getSessionUser();
  if (user?.role !== "admin") return NextResponse.json({ error: "No autorizado" }, { status: user ? 403 : 401 });

  const id = commentId(req);
  if (!id) return NextResponse.json({ error: "Comentario inválido" }, { status: 400 });

  try {
    if (!(await approveGuestComment(id))) return NextResponse.json({ error: "No encontramos ese comentario" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("news engagement PATCH", error);
    return NextResponse.json({ error: "No se pudo aprobar el comentario" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Context) {
  const { slug } = await params;
  if (!validSlug(slug)) return NextResponse.json({ error: "Slug inválido" }, { status: 400 });

  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const id = commentId(req);
  if (!id) return NextResponse.json({ error: "Comentario inválido" }, { status: 400 });

  try {
    // Los comentarios de invitados no tienen dueño: solo los borra un administrador.
    const deleted = req.nextUrl.searchParams.get("guest") === "1"
      ? user.role === "admin" && (await deleteGuestComment(id))
      : await deleteNewsComment(id, user.id, user.role === "admin");
    if (!deleted) return NextResponse.json({ error: "No podés eliminar este comentario" }, { status: 403 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("news engagement DELETE", error);
    return NextResponse.json({ error: "No se pudo eliminar el comentario" }, { status: 500 });
  }
}
