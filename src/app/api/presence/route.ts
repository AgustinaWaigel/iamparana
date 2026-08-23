import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/app/api/admin/_shared/auth";
import { getOnlinePresence, removeVisitorPresence, touchUserPresence, touchVisitorPresence } from "@/server/db/presence-repository";

export const dynamic = "force-dynamic";
const VISITOR_COOKIE = "iam_visitor_presence";

export async function GET() {
  try {
    return NextResponse.json(await getOnlinePresence());
  } catch (error) {
    console.error("presence GET", error);
    return NextResponse.json({ users: [], visitors: 0, total: 0 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  const currentVisitorId = request.cookies.get(VISITOR_COOKIE)?.value;

  try {
    if (user) {
      await touchUserPresence(user.id);
      if (currentVisitorId) await removeVisitorPresence(currentVisitorId);
      const response = NextResponse.json({ success: true, authenticated: true });
      if (currentVisitorId) response.cookies.delete(VISITOR_COOKIE);
      return response;
    }

    const visitorId = currentVisitorId || crypto.randomUUID();
    await touchVisitorPresence(visitorId);
    const response = NextResponse.json({ success: true, authenticated: false });
    if (!currentVisitorId) {
      response.cookies.set(VISITOR_COOKIE, visitorId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
      });
    }
    return response;
  } catch (error) {
    console.error("presence POST", error);
    return NextResponse.json({ error: "No se pudo actualizar la presencia" }, { status: 500 });
  }
}
