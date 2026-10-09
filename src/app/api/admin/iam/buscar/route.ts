import { NextResponse } from "next/server";
import { requirePermission } from "@/server/lib/api-utils";

export const dynamic = "force-dynamic";

// Busca una dirección en OpenStreetMap y devuelve su punto, para ubicar una IAM en el mapa.
// Se consulta desde el servidor y solo para administradores: es un servicio gratuito de uso moderado.

export async function GET(request: Request) {
  const { errorResponse } = await requirePermission("users.manage");
  if (errorResponse) return errorResponse;

  const consulta = (new URL(request.url).searchParams.get("q") ?? "").trim().slice(0, 200);
  if (consulta.length < 3) return NextResponse.json({ error: "Escribí la dirección para buscarla." }, { status: 400 });

  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=ar&q=${encodeURIComponent(consulta)}`, {
      headers: { "User-Agent": "iamparana.com.ar (sitio de IAM Parana)", "Accept-Language": "es" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    const data: unknown = response.ok ? await response.json() : null;
    const primero = Array.isArray(data) ? (data[0] as { lat?: string; lon?: string; display_name?: string } | undefined) : undefined;
    const lat = Number(primero?.lat);
    const lng = Number(primero?.lon);
    if (!primero || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: "No encontramos esa dirección. Marcá el lugar tocando el mapa." }, { status: 404 });
    }
    return NextResponse.json({ lat, lng, nombre: String(primero.display_name ?? "") });
  } catch {
    return NextResponse.json({ error: "No se pudo buscar la dirección en este momento. Marcá el lugar tocando el mapa." }, { status: 502 });
  }
}
