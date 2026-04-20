// Ruta pública para leer documentos agrupados por sección.
import { NextResponse } from "next/server";
import { badRequest, serverError } from "@/app/api/admin/_shared/auth";
import { getDocumentsBySection, getDocumentsBySections } from "@/server/db/admin-repository";

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

      const documents = await getDocumentsBySections(sections);
      return NextResponse.json(documents);
    }

    if (!section) {
      return badRequest("Section or sections parameter required");
    }

    const documents = await getDocumentsBySection(section);
    return NextResponse.json(documents);
  } catch (error) {
    console.error(error);
    return serverError();
  }
}
