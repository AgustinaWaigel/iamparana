import { NextResponse } from "next/server";
import { deleteNoticiaGaleriaImage } from "@/app/db/admin-repository";
import { badRequest, requirePermission, parseId, serverError } from "@/app/api/admin/_shared/auth";

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requirePermission("content.delete");
  if ("errorResponse" in auth) return auth.errorResponse;

  const { id } = await context.params;
  const imageId = parseId(id);

  if (imageId === null) {
    return badRequest("ID invalido");
  }

  try {
    await deleteNoticiaGaleriaImage(imageId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return serverError("No se pudo eliminar la imagen de la galería");
  }
}
