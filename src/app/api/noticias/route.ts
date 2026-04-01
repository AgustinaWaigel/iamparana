import { NextResponse } from "next/server";
import { listNoticiasPreview } from "@/app/db/content-repository";

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
