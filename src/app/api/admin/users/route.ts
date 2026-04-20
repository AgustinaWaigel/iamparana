// CRUD de usuarios administrativos y del equipo interno.
import { NextRequest, NextResponse } from "next/server";
import { createUser, listUsers } from "@/server/db/auth-repository";
import { hashPassword } from "@/server/lib/auth-security";
import { requirePermission, badRequest, serverError } from "@/server/lib/api-utils";

/**
 * GET: Lista todos los usuarios.
 * Solo accesible para usuarios con permiso 'users.manage' (Admin).
 */
export async function GET() {
  const { errorResponse } = await requirePermission("users.manage");
  if (errorResponse) return errorResponse;

  try {
    const users = await listUsers();
    // Retornamos la lista (excluyendo hashes de password si tu repository no lo hace ya)
    return NextResponse.json(users);
  } catch (error) {
    console.error("❌ Error listUsers:", error);
    return serverError("No se pudo obtener la lista de usuarios");
  }
}

/**
 * POST: Crea un nuevo usuario.
 */
export async function POST(req: NextRequest) {
  const { errorResponse } = await requirePermission("users.manage");
  if (errorResponse) return errorResponse;

  try {
    const body = await req.json();
    const { email, password, role } = body;

    // 1. Validaciones de entrada
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return badRequest("Email inválido");
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return badRequest("La contraseña debe tener al menos 8 caracteres");
    }

    const validRoles = ["admin", "equipo", "redactor", "coordinador", "animador"];
    if (!role || !validRoles.includes(role)) {
      return badRequest("Rol no válido");
    }

    // 2. Operación en Base de Datos
    const normalizedEmail = email.trim().toLowerCase();
    const hashedPassword = hashPassword(password);

    await createUser(normalizedEmail, hashedPassword, role);

    return NextResponse.json({ success: true }, { status: 201 });

  } catch (error: any) {
    console.error("❌ Error createUser:", error);
    
    // Manejo específico para emails duplicados (si Turso lanza error de UNIQUE)
    if (error.message?.includes("UNIQUE constraint failed")) {
      return badRequest("El email ya está registrado");
    }

    return serverError("Error al crear el usuario");
  }
}