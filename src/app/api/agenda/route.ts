import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const folder = path.join(process.cwd(), "contents", "agenda");
    const filenames = fs.readdirSync(folder);

    const eventos = filenames.map((filename) => {
      const filePath = path.join(folder, filename);
      const fileContent = fs.readFileSync(filePath, "utf8");
      const { data } = matter(fileContent);
      return data;
    });

    return NextResponse.json(eventos);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error leyendo agenda" }, { status: 500 });
  }
}
