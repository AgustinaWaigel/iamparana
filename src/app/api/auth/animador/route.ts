import { NextResponse } from "next/server";
import { listMisGrupos, retirarAnimador, solicitarAnimador } from "@/server/db/animadores-repository";
import { InscripcionError, listGrupos } from "@/server/db/inscripciones-repository";
import { getSessionUser } from "@/server/lib/api-utils";
import { checkRateLimit, isSameOriginRequest } from "@/server/lib/cuenta-session";

export const dynamic = "force-dynamic";

// Cada usuario indica en su perfil de qué IAM es animador. Es un pedido: no da acceso
// a nada hasta que un administrador lo aprueba.

const sinSesion = () => NextResponse.json({ error: "Iniciá sesión para continuar." }, { status: 401 });
const grupoDe = (body: unknown) => {
  const value = (body as { grupoId?: unknown } | null)?.grupoId;
  return typeof value === "string" ? value.trim().slice(0, 64) : "";
};

export async function GET() {
  const user = await getSessionUser();
  if (!user) return sinSesion();
  try {
    const [grupos, mios] = await Promise.all([listGrupos(true), listMisGrupos(user.id)]);
    return NextResponse.json({ grupos: grupos.map((grupo) => ({ id: grupo.id, nombre: grupo.nombre, ciudad: grupo.ciudad })), mios });
  } catch (error) {
    console.error("auth/animador GET", error instanceof Error ? error.name : "error");
    return NextResponse.json({ error: "No se pudo cargar." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Pedido no permitido." }, { status: 403 });
  const user = await getSessionUser();
  if (!user) return sinSesion();
  if (!(await checkRateLimit("animador-pedido", String(user.id), 10, 60))) {
    return NextResponse.json({ error: "Hiciste varios pedidos seguidos. Probá más tarde." }, { status: 429 });
  }

  const grupoId = grupoDe(await request.json().catch(() => null));
  if (!grupoId) return NextResponse.json({ error: "Elegí tu IAM." }, { status: 400 });

  try {
    await solicitarAnimador(user.id, grupoId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof InscripcionError) return NextResponse.json({ error: error.message }, { status: 400 });
    console.error("auth/animador POST", error instanceof Error ? error.name : "error");
    return NextResponse.json({ error: "No se pudo guardar el pedido." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Pedido no permitido." }, { status: 403 });
  const user = await getSessionUser();
  if (!user) return sinSesion();

  const grupoId = grupoDe(await request.json().catch(() => null));
  if (!grupoId) return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });

  try {
    await retirarAnimador(user.id, grupoId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("auth/animador DELETE", error instanceof Error ? error.name : "error");
    return NextResponse.json({ error: "No se pudo guardar." }, { status: 500 });
  }
}
