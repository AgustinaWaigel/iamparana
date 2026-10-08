import { NextResponse } from "next/server";
import { deleteCuentaSession } from "@/server/db/cuentas-repository";
import { clearCuentaCookie, getCuentaTokenHash, isSameOriginRequest } from "@/server/lib/cuenta-session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "Pedido no permitido." }, { status: 403 });
  }

  try {
    const tokenHash = await getCuentaTokenHash();
    if (tokenHash) await deleteCuentaSession(tokenHash);
  } catch (error) {
    console.error("inscripciones/acceso/salir", error instanceof Error ? error.message : "error");
  }

  // La cookie se borra aunque la base falle: en este navegador la sesión termina igual.
  await clearCuentaCookie();
  return NextResponse.json({ ok: true });
}
