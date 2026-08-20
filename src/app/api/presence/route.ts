import { NextResponse } from "next/server";
import { getSessionUser } from "@/app/api/admin/_shared/auth";
import { listOnlineUsers, touchUserPresence } from "@/server/db/presence-repository";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ users: await listOnlineUsers() });
  } catch (error) {
    console.error("presence GET", error);
    return NextResponse.json({ users: [] });
  }
}

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  try {
    await touchUserPresence(user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("presence POST", error);
    return NextResponse.json({ error: "No se pudo actualizar la presencia" }, { status: 500 });
  }
}
