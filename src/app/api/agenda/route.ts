import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { 
  listAgendaEventos, 
  createAgendaEvento, 
  updateAgendaEvento, 
  deleteAgendaEvento 
} from "@/server/db/content-repository";
import { requirePermission, badRequest, serverError } from "@/server/lib/api-utils";
import {
  createCalendarAgendaEvent,
  deleteCalendarAgendaEvent,
  isGoogleCalendarConfigured,
  listCalendarAgendaEvents,
  updateCalendarAgendaEvent,
} from "@/server/lib/google-calendar-service";

export const revalidate = 60;

// Esta ruta concentra el CRUD de agenda.
// Si Google Calendar está configurado, esa es la fuente principal.
// Si no, se usa la base local como respaldo.
function buildCalendarAccessErrorMessage(error: unknown, fallback: string) {
  const message = String(error instanceof Error ? error.message : error || "").toLowerCase();
  const looksLikePermissionIssue =
    message.includes("forbidden") ||
    message.includes("not found") ||
    message.includes("insufficient") ||
    message.includes("permission");

  const looksLikeMissingDatabase =
    message.includes("database client not available") ||
    message.includes("database") && message.includes("not available");

  if (looksLikePermissionIssue) {
    return "Google Calendar no accesible. Comparti el calendario con iamparana-drive@iamparana.iam.gserviceaccount.com";
  }

  if (looksLikeMissingDatabase) {
    return "No hay base de datos configurada para guardar agenda en este entorno.";
  }

  return fallback;
}

export async function GET() {
  try {
    // Primero intenta traer los eventos desde Google Calendar.
    if (isGoogleCalendarConfigured()) {
      try {
        const eventos = await listCalendarAgendaEvents();
        return NextResponse.json(eventos);
      } catch (calendarError) {
        console.error("Error al leer Google Calendar, se usa agenda local:", calendarError);
      }
    }

    const eventos = await listAgendaEventos();
    return NextResponse.json(eventos);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error leyendo agenda" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { errorResponse } = await requirePermission("users.manage");
  if (errorResponse) return errorResponse;

  try {
    // El frontend manda una estructura simple y esta ruta decide dónde guardarla.
    const body = await req.json();
    const { evento, fecha, fecha_fin, color, descripcion, hora_inicio, hora_fin, todo_el_dia } = body;

    if (!evento || typeof evento !== "string") {
      return badRequest("Evento es requerido");
    }

    if (!fecha || typeof fecha !== "string") {
      return badRequest("Fecha es requerida");
    }

    if (isGoogleCalendarConfigured()) {
      const creado = await createCalendarAgendaEvent({
        evento,
        fecha,
        fecha_fin,
        color,
        descripcion,
        hora_inicio,
        hora_fin,
        todo_el_dia,
      });
      revalidatePath("/");
      return NextResponse.json(creado, { status: 201 });
    }

    const id = await createAgendaEvento(
      evento,
      fecha,
      fecha_fin,
      color,
      descripcion,
      hora_inicio,
      hora_fin,
      todo_el_dia
    );
    revalidatePath("/");
    return NextResponse.json(
      { id, evento, fecha, fecha_fin, color, descripcion, hora_inicio, hora_fin, todo_el_dia },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error al crear evento:", error);
    return serverError(buildCalendarAccessErrorMessage(error, "No se pudo crear el evento"));
  }
}

export async function PUT(req: NextRequest) {
  const { errorResponse } = await requirePermission("users.manage");
  if (errorResponse) return errorResponse;

  try {
    // La actualización sigue el mismo criterio: Google primero, local como respaldo.
    const body = await req.json();
    const { id, evento, fecha, fecha_fin, color, descripcion, hora_inicio, hora_fin, todo_el_dia } = body;

    if (!id || (typeof id !== "number" && typeof id !== "string")) {
      return badRequest("ID es requerido");
    }

    if (!evento || typeof evento !== "string") {
      return badRequest("Evento es requerido");
    }

    if (!fecha || typeof fecha !== "string") {
      return badRequest("Fecha es requerida");
    }

    if (isGoogleCalendarConfigured()) {
      const actualizado = await updateCalendarAgendaEvent(String(id), {
        evento,
        fecha,
        fecha_fin,
        color,
        descripcion,
        hora_inicio,
        hora_fin,
        todo_el_dia,
      });
      revalidatePath("/");
      return NextResponse.json(actualizado);
    }

    const parsedId = Number(id);
    if (!Number.isFinite(parsedId)) {
      return badRequest("ID inválido");
    }

    await updateAgendaEvento(
      parsedId,
      evento,
      fecha,
      fecha_fin,
      color,
      descripcion,
      hora_inicio,
      hora_fin,
      todo_el_dia
    );
    revalidatePath("/");
    return NextResponse.json({
      id,
      evento,
      fecha,
      fecha_fin,
      color,
      descripcion,
      hora_inicio,
      hora_fin,
      todo_el_dia,
    });
  } catch (error) {
    console.error("Error al actualizar evento:", error);
    return serverError(buildCalendarAccessErrorMessage(error, "No se pudo actualizar el evento"));
  }
}

export async function DELETE(req: NextRequest) {
  const { errorResponse } = await requirePermission("users.manage");
  if (errorResponse) return errorResponse;

  try {
    // El borrado también se resuelve según el origen real del dato.
    const body = await req.json();
    const { id } = body;

    if (!id || (typeof id !== "number" && typeof id !== "string")) {
      return badRequest("ID es requerido");
    }

    if (isGoogleCalendarConfigured()) {
      await deleteCalendarAgendaEvent(String(id));
      revalidatePath("/");
      return NextResponse.json({ success: true });
    }

    const parsedId = Number(id);
    if (!Number.isFinite(parsedId)) {
      return badRequest("ID inválido");
    }

    await deleteAgendaEvento(parsedId);
    revalidatePath("/");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar evento:", error);
    return serverError(buildCalendarAccessErrorMessage(error, "No se pudo eliminar el evento"));
  }
}
