import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { 
  listAgendaEventos, 
  createAgendaEvento, 
  updateAgendaEvento, 
  deleteAgendaEvento 
} from "@/app/db/content-repository";
import { requirePermission, badRequest, serverError } from "@/app/lib/api-utils";

export const revalidate = 60;

export async function GET() {
  try {
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
    const body = await req.json();
    const { evento, fecha, fecha_fin } = body;

    if (!evento || typeof evento !== "string") {
      return badRequest("Evento es requerido");
    }

    if (!fecha || typeof fecha !== "string") {
      return badRequest("Fecha es requerida");
    }

    const id = await createAgendaEvento(evento, fecha, fecha_fin);
    revalidatePath("/");
    return NextResponse.json({ id, evento, fecha, fecha_fin }, { status: 201 });
  } catch (error) {
    console.error("Error creating evento:", error);
    return serverError("No se pudo crear el evento");
  }
}

export async function PUT(req: NextRequest) {
  const { errorResponse } = await requirePermission("users.manage");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { id, evento, fecha, fecha_fin } = body;

    if (!id || typeof id !== "number") {
      return badRequest("ID es requerido");
    }

    if (!evento || typeof evento !== "string") {
      return badRequest("Evento es requerido");
    }

    if (!fecha || typeof fecha !== "string") {
      return badRequest("Fecha es requerida");
    }

    await updateAgendaEvento(id, evento, fecha, fecha_fin);
    revalidatePath("/");
    return NextResponse.json({ id, evento, fecha, fecha_fin });
  } catch (error) {
    console.error("Error updating evento:", error);
    return serverError("No se pudo actualizar el evento");
  }
}

export async function DELETE(req: NextRequest) {
  const { errorResponse } = await requirePermission("users.manage");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { id } = body;

    if (!id || typeof id !== "number") {
      return badRequest("ID es requerido");
    }

    await deleteAgendaEvento(id);
    revalidatePath("/");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting evento:", error);
    return serverError("No se pudo eliminar el evento");
  }
}
