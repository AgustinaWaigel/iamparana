import { NextRequest, NextResponse } from "next/server";
import { updateUser } from "@/db/auth-repository";
import { hashPassword } from "@/lib/auth-security";
import { requirePermission, badRequest, serverError, parseId } from "@/lib/api-utils";

/**
 * PUT: Actualiza un usuario específico.
 */
export async function PUT(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Validar permisos (Solo Admin puede gestionar usuarios)
  const { errorResponse } = await requirePermission("users.manage");
  if (errorResponse) return errorResponse;

  // 2. Validar ID
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return badRequest("ID de usuario inválido");

  try {
    const body = await req.json();
    const { role, isActive, password } = body;

    // 3. Validaciones opcionales de campos
    const validRoles = ["admin", "equipo", "redactor", "coordinador", "animador"];
    if (role && !validRoles.includes(role)) {
      return badRequest("El rol proporcionado no es válido");
    }

    if (password && (typeof password !== "string" || password.length < 8)) {
      return badRequest("La nueva contraseña debe tener al menos 8 caracteres");
    }

    // 4. Preparar actualización
    const passwordHash = password ? hashPassword(password) : undefined;

    await updateUser(id, {
      role,
      isActive,
      passwordHash,
    });

    return NextResponse.json({ success: true, message: "Usuario actualizado" });

  } catch (error) {
    console.error(`❌ Error updating user ${id}:`, error);
    return serverError("No se pudo actualizar el usuario");
  }
}

/**
 * DELETE: Desactiva un usuario (Baja lógica).
 */
export async function DELETE(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  const { errorResponse } = await requirePermission("users.manage");
  if (errorResponse) return errorResponse;

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return badRequest("ID de usuario inválido");

  try {
    // Nota: En tu implementación anterior DELETE solo desactivaba. 
    // Si quieres borrarlo de la DB físicamente, deberías llamar a una función deleteUser(id).
    await updateUser(id, { isActive: false });
    
    return NextResponse.json({ 
      success: true, 
      message: "El usuario ha sido desactivado correctamente" 
    });
  } catch (error) {
    console.error(`❌ Error deleting user ${id}:`, error);
    return serverError("No se pudo eliminar/desactivar el usuario");
  }
}