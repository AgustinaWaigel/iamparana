// Ruta pública que lista el resumen de noticias para la portada y el módulo de noticias.
import { NextResponse } from "next/server";
import { listNoticiasPreview } from "@/server/db/content-repository";

export const revalidate = 60;

export async function GET() {
  try {
    const noticias = await listNoticiasPreview();
    return NextResponse.json(noticias);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error leyendo noticias" }, { status: 500 });
  }
}
