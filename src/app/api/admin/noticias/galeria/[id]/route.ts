import { NextRequest, NextResponse } from "next/server";
import { deleteNoticiaGaleriaImage } from "@/server/db/admin-repository";
import { 
  badRequest, 
  requirePermission, 
  parseId, 
  serverError 
} from "@/app/api/admin/_shared/auth";

/**
 * En Next.js 15, los parámetros de las rutas dinámicas 
 * deben definirse como una Promesa.
 */
type Context = {
  params: Promise<{ id: string }>;
};

export async function DELETE(req: NextRequest, context: Context) {
  // 1. Validar permisos (Lado del servidor)
  const auth = await requirePermission("content.delete");
  if ("errorResponse" in auth) return auth.errorResponse;

  try {
    // 2. Esperar a que los parámetros se resuelvan (Requisito de Next 15)
    const { id } = await context.params;
    
    // 3. Parsear el ID (según tu lógica de repositorio)
    const imageId = parseId(id);

    if (imageId === null) {
      return badRequest("ID de imagen inválido");
    }

    // 4. Ejecutar la eliminación en la DB (Turso/SQLite)
    await deleteNoticiaGaleriaImage(imageId);
    
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error en DELETE galeria/[id]:", error);
    return serverError("No se pudo eliminar la imagen de la galería");
  }
}