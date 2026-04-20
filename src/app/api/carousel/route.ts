// Ruta pública que entrega los ítems del carrusel de portada.
import { NextResponse } from "next/server";
import { listCarouselItems } from "@/server/db/content-repository";

export const revalidate = 60;

export async function GET() {
  try {
    const items = await listCarouselItems();
    return NextResponse.json(items);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error leyendo carrusel" }, { status: 500 });
  }
}
