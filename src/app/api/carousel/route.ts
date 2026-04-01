import { NextResponse } from "next/server";
import { listCarouselItems } from "@/app/db/content-repository";

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
