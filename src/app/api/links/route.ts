// Ruta pública para leer enlaces agrupados por sección.
import { NextResponse } from "next/server";
import { badRequest, serverError } from "@/app/api/admin/_shared/auth";
import { getLinksBySection, getLinksBySections } from "@/server/db/admin-repository";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const section = url.searchParams.get("section")?.trim();
    const sectionsParam = url.searchParams.get("sections")?.trim();

    if (sectionsParam) {
      const sections = sectionsParam
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      if (sections.length === 0) {
        return badRequest("Sections parameter required");
      }

      const links = await getLinksBySections(sections);
      return NextResponse.json(links);
    }

    if (!section) {
      return badRequest("Section or sections parameter required");
    }

    const links = await getLinksBySection(section);
    return NextResponse.json(links);
  } catch (error) {
    console.error(error);
    return serverError();
  }
}
