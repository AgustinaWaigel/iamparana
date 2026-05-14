import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/app/api/admin/_shared/auth";
import { checkAndSendAllNotifications } from "@/server/lib/notification-scheduler";

export async function POST(request: NextRequest) {
  try {
    // Validar que es admin
    const auth = await requirePermission("users.manage");
    if ("errorResponse" in auth) {
      return auth.errorResponse;
    }

    const body = await request.json();
    const { action } = body;

    if (action === "check") {
      // Ejecutar verificación de eventos y festivos
      const result = await checkAndSendAllNotifications();
      return NextResponse.json({
        success: true,
        result,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error in notifications API:", error);
    return NextResponse.json(
      { error: "Failed to process notification request" },
      { status: 500 }
    );
  }
}
