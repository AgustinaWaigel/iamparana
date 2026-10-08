import { NextRequest, NextResponse } from "next/server";
import { AREA_LABEL, ESTADO_LABEL, ROL_LABEL } from "@/app/inscripciones/ui";
import { recordAuditEvent } from "@/server/db/audit-repository";
import { listInscriptosEvento } from "@/server/db/inscripciones-admin-repository";
import { requirePermission } from "@/server/lib/api-utils";
import { getEventoConInscripcion } from "@/server/lib/inscripciones-eventos";
import { edadEnEvento } from "@/server/lib/inscripciones-resumen";

export const dynamic = "force-dynamic";

// Lista de inscriptos de un evento en un archivo que abre Excel (CSV).
// Lleva lo mismo que la vista de logística: sin CUIL, contactos ni medicación.

const SEXO: Record<string, string> = { F: "Femenino", M: "Masculino", X: "X" };

function cell(value: unknown): string {
  let text = value === null || value === undefined ? "" : String(value);
  // Un texto que empieza con estos caracteres Excel lo toma como fórmula.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  const { errorResponse, user } = await requirePermission("users.manage");
  if (errorResponse) return errorResponse;

  const eventoId = request.nextUrl.searchParams.get("eventoId")?.trim();
  if (!eventoId) return NextResponse.json({ error: "Falta el evento." }, { status: 400 });

  try {
    const evento = await getEventoConInscripcion(eventoId);
    if (!evento) return NextResponse.json({ error: "No encontramos ese evento." }, { status: 404 });
    const inscriptos = await listInscriptosEvento(eventoId);

    const preguntas = evento.config.preguntas;
    const header = [
      "Apellido", "Nombre", "Edad en el evento", "Sexo", "Participa como", "Área", "IAM", "Ciudad", "Grado", "Estado",
      "Autorización", "Uso de imagen", "Monto", "Dieta especial", "Alergias", "Lleva su comida", "Enfermedad o condición",
      ...preguntas.map((pregunta) => pregunta.texto),
    ];
    const rows = inscriptos.map((row) => [
      row.apellido,
      row.nombre,
      edadEnEvento(row, evento.fecha) ?? "",
      row.sexo ? SEXO[row.sexo] ?? row.sexo : "",
      ROL_LABEL[row.rol] ?? row.rol,
      row.area ? AREA_LABEL[row.area] ?? row.area : "",
      row.grupoNombre ?? "",
      row.ciudad ?? "",
      row.grado ?? "",
      ESTADO_LABEL[row.estado] ?? row.estado,
      row.firmaEventoId ? "Firmada" : "Sin firmar",
      row.imagen === null ? "Falta responder" : row.imagen ? "Autorizado" : "No autorizado",
      row.monto ?? "",
      row.salud?.dieta?.tiene ? row.salud.dieta.detalle : "",
      row.salud?.alergias?.tiene ? row.salud.alergias.detalle : "",
      row.respuestas.lleva_comida === "si" ? "Sí" : "",
      row.salud?.enfermedad?.tiene ? row.salud.enfermedad.detalle : "",
      ...preguntas.map((pregunta) => row.respuestas[pregunta.id] ?? ""),
    ]);

    await recordAuditEvent({ actor: user, action: "exportar", entityType: "inscripciones_evento", entityId: eventoId, metadata: { inscriptos: inscriptos.length } }).catch(() => undefined);

    // Punto y coma y BOM: así Excel en español lo abre en columnas y con los acentos bien.
    const csv = `﻿${[header, ...rows].map((row) => row.map(cell).join(";")).join("\r\n")}\r\n`;
    const name = evento.evento.normalize("NFD").replace(/[^a-zA-Z0-9 ]/g, "").trim().replace(/\s+/g, "-").toLowerCase().slice(0, 60) || "evento";

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="inscriptos-${name}.csv"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("admin/inscripciones/export", error instanceof Error ? error.name : "error");
    return NextResponse.json({ error: "No se pudo generar el archivo." }, { status: 500 });
  }
}
