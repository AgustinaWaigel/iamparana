import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const folder = path.join(process.cwd(), "contents", "carousel");
    const filenames = fs.readdirSync(folder);

    const items = filenames
      .map((filename) => {
        const filePath = path.join(folder, filename);
        const fileContent = fs.readFileSync(filePath, "utf8");
        const { data } = matter(fileContent);
        return data;
      })
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)); // Ordena por `order`

    return NextResponse.json(items);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error leyendo carrusel" }, { status: 500 });
  }
}
