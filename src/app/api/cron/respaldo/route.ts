import { NextResponse } from "next/server";
import { crearRespaldo } from "@/server/lib/respaldo";

// Tarea semanal: copia de seguridad cifrada de la base, guardada en Drive. La dispara el
// programador de tareas del hosting (ver vercel.json), que se identifica con CRON_SECRET.

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    const respaldo = await crearRespaldo();
    return NextResponse.json({ ok: true, tablas: respaldo.tablas, filas: respaldo.filas });
  } catch (error) {
    console.error("cron/respaldo", error instanceof Error ? error.message : "error");
    return NextResponse.json({ error: "No se pudo hacer el respaldo." }, { status: 500 });
  }
}
