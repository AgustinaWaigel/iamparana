import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const folder = path.join(process.cwd(), "contents", "noticias");
    const filenames = fs.readdirSync(folder);

    const noticias = filenames.map((filename) => {
      const filePath = path.join(folder, filename);
      const fileContent = fs.readFileSync(filePath, "utf8");
      const { data } = matter(fileContent);
      return {
        slug: filename.replace(/\.md$/, ""),
        title: data.title,
        date: data.date,
        description: data.description,
        image: data.image,
      };
    });

    noticias.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json(noticias);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error leyendo noticias" }, { status: 500 });
  }
}
