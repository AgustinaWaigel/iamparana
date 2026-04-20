// Galería de una noticia: lista y administra imágenes asociadas a ese artículo.
import { NextResponse } from "next/server";
import { getTursoClient } from "@/server/db/turso";
import { isTursoReadEnabled } from "@/app/lib/feature-flags";

type GaleriaRow = {
  id: number;
  noticia_slug: string;
  image_url: string;
  alt_text: string | null;
  caption: string | null;
  order: number;
};

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" ? value : fallback;
}

export async function GET(_req: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const client = getTursoClient();

  if (!client || !isTursoReadEnabled) {
    return NextResponse.json([]);
  }

  try {
    const result = await client.execute({
      sql: 'SELECT id, noticia_slug, image_url, alt_text, caption, "order" FROM noticias_galeria WHERE noticia_slug = ? ORDER BY "order" ASC, id ASC',
      args: [slug],
    });

    return NextResponse.json(
      result.rows.map((row) => {
        const typedRow = row as Partial<GaleriaRow>;
        return {
          id: asNumber(typedRow.id),
          noticia_slug: asString(typedRow.noticia_slug),
          image_url: asString(typedRow.image_url),
          alt_text: typeof typedRow.alt_text === "string" ? typedRow.alt_text : null,
          caption: typeof typedRow.caption === "string" ? typedRow.caption : null,
          order: asNumber(typedRow.order, 999),
        };
      })
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error leyendo galería" }, { status: 500 });
  }
}