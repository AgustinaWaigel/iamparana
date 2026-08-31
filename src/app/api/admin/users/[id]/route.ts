// Operaciones sobre un usuario puntual: editar, activar, desactivar o eliminar.
import { NextRequest, NextResponse } from "next/server";
import { updateUser } from "@/server/db/auth-repository";
import { hashPassword } from "@/server/lib/auth-security";
import { requirePermission, badRequest, serverError, parseId } from "@/app/api/admin/_shared/auth";
import { recordAuditEvent } from "@/server/db/audit-repository";

/**
 * PUT: Actualiza un usuario específico.
 */
export async function PUT(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Validar permisos (Solo Admin puede gestionar usuarios)
  const { errorResponse, user } = await requirePermission("users.manage");
  if (errorResponse) return errorResponse;

  // 2. Validar ID
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return badRequest("ID de usuario inválido");

  try {
    const body = await req.json();
    const { role, isActive, is_active, password, displayName, nombre, isAnimator, areas } = body;
    const normalizedIsActive =
      typeof isActive === "boolean"
        ? isActive
        : typeof is_active === "number"
          ? is_active === 1
          : undefined;

    // 3. Validaciones opcionales de campos
    const validRoles = ["admin", "miembro"];
    const validAreas = ["animacion", "comunicacion", "formacion", "logistica", "espiritualidad", "institucional"];
    if (role && !validRoles.includes(role)) {
      return badRequest("El rol proporcionado no es válido");
    }
    if (areas && (!Array.isArray(areas) || areas.some((area) => typeof area !== 'string' || !validAreas.includes(area)))) {
      return badRequest("Las áreas seleccionadas no son válidas");
    }

    if (password && (typeof password !== "string" || password.length < 8)) {
      return badRequest("La nueva contraseña debe tener al menos 8 caracteres");
    }

    // 4. Preparar actualización
    const passwordHash = password ? hashPassword(password) : undefined;

    await updateUser(id, {
      role,
      isActive: normalizedIsActive,
      passwordHash,
      displayName: typeof displayName === "string" ? displayName : typeof nombre === "string" ? nombre : undefined,
      isAnimator: typeof isAnimator === 'boolean' ? isAnimator : undefined,
      areas: Array.isArray(areas) ? areas : undefined,
    });
    if (user) await recordAuditEvent({ actor: user, action: "update", entityType: "usuario", entityId: id, area: "administracion", metadata: { changedFields: [role !== undefined && "role", normalizedIsActive !== undefined && "isActive", password !== undefined && "password", displayName !== undefined || nombre !== undefined ? "displayName" : false, isAnimator !== undefined && "isAnimator", areas !== undefined && "areas"].filter(Boolean) } });

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
  const { errorResponse, user } = await requirePermission("users.manage");
  if (errorResponse) return errorResponse;

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return badRequest("ID de usuario inválido");

  try {
    // Nota: En tu implementación anterior DELETE solo desactivaba. 
    // Si quieres borrarlo de la DB físicamente, deberías llamar a una función deleteUser(id).
    await updateUser(id, { isActive: false });
    if (user) await recordAuditEvent({ actor: user, action: "deactivate", entityType: "usuario", entityId: id, area: "administracion" });
    
    return NextResponse.json({ 
      success: true, 
      message: "El usuario ha sido desactivado correctamente" 
    });
  } catch (error) {
    console.error(`❌ Error deleting user ${id}:`, error);
    return serverError("No se pudo eliminar/desactivar el usuario");
  }
}
