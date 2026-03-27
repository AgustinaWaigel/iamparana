import { NextResponse } from "next/server";
import { deleteSessionByTokenHash } from "@/db/auth-repository";
import { AUTH_COOKIE_NAME, hashSessionToken } from "@/lib/auth-security";

function getCookieValue(cookieHeader: string, name: string) {
  const parts = cookieHeader.split(";").map((value) => value.trim());
  const match = parts.find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

export async function POST(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie") ?? "";
    const token = getCookieValue(cookieHeader, AUTH_COOKIE_NAME);

    if (token) {
      await deleteSessionByTokenHash(hashSessionToken(token));
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: "",
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
      expires: new Date(0),
    });

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
