import { NextResponse, NextRequest } from "next/server";
import { updateUser, UserRole } from "@/db/auth-repository";
import { hashPassword } from "@/lib/auth-security";
import { getSessionUser } from "@/api/admin/_shared/auth";

type UpdateUserBody = {
  role?: UserRole;
  isActive?: boolean;
  password?: string;
};

function isValidRole(value: unknown): value is UserRole {
  return ["admin", "equipo", "redactor", "coordinador", "animador"].includes(value as string);
}

function isValidUpdateBody(value: unknown): value is UpdateUserBody {
  if (typeof value !== "object" || value === null) return false;
  const body = value as Partial<UpdateUserBody>;

  const roleOk = typeof body.role === "undefined" || isValidRole(body.role);
  const activeOk = typeof body.isActive === "undefined" || typeof body.isActive === "boolean";
  const passOk = typeof body.password === "undefined" || (typeof body.password === "string" && body.password.length >= 8);

  return roleOk && activeOk && passOk;
}

async function checkAdminAuth(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user || user.role !== "admin") {
    return null;
  }
  return user;
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const admin = await checkAdminAuth(req);
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const id = Number((await context.params).id);
  if (!id || isNaN(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  if (!isValidUpdateBody(body)) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const passwordHash = body.password ? hashPassword(body.password) : undefined;

  try {
    await updateUser(id, {
      role: body.role,
      isActive: body.isActive,
      passwordHash,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "No se pudo actualizar el usuario" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const admin = await checkAdminAuth(req);
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const id = Number((await context.params).id);
  if (!id || isNaN(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  try {
    await updateUser(id, { isActive: false });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "No se pudo eliminar el usuario" }, { status: 500 });
  }
}
