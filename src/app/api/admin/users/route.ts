import { NextResponse, NextRequest } from "next/server";
import { createUser, listUsers, UserRole } from "@/db/auth-repository";
import { hashPassword } from "@/lib/auth-security";
import { getSessionUser } from "@/api/admin/_shared/auth";

type CreateUserBody = {
  email: string;
  password: string;
  role: UserRole;
};

function isValidRole(value: unknown): value is UserRole {
  return ["admin", "equipo", "redactor", "coordinador", "animador"].includes(value as string);
}

function isValidCreateBody(value: unknown): value is CreateUserBody {
  if (typeof value !== "object" || value === null) return false;
  const body = value as Partial<CreateUserBody>;
  return (
    typeof body.email === "string" &&
    typeof body.password === "string" &&
    body.password.length >= 8 &&
    isValidRole(body.role)
  );
}

async function checkAdminAuth(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user || user.role !== "admin") {
    return null;
  }
  return user;
}

export async function GET(req: NextRequest) {
  const admin = await checkAdminAuth(req);
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const users = await listUsers();
    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await checkAdminAuth(req);
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  if (!isValidCreateBody(body)) {
    return NextResponse.json({ error: "Datos inválidos. Email, password (8+ chars), y rol requeridos" }, { status: 400 });
  }

  try {
    await createUser(body.email.trim().toLowerCase(), hashPassword(body.password), body.role);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "No se pudo crear el usuario" }, { status: 500 });
  }
}
