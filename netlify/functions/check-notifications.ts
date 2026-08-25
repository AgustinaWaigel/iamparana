import { checkAndSendAllNotifications } from "@/server/lib/notification-scheduler";

export default async (req: any, context: any) => {
  // Verificar que solo se puede ejecutar desde Netlify o con Authorization header
  const authHeader = req.headers.get("authorization");
  const netlifyAuth = req.headers.get("x-webhook-signature");
  
  const isScheduledInvocation = Boolean(context?.next_run);
  if (!isScheduledInvocation && !authHeader && !netlifyAuth) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const result = await checkAndSendAllNotifications();
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Notifications checked and sent",
        result,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in scheduled notification function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const config = {
  // 11:00 UTC = 08:00 en Argentina (UTC-3).
  schedule: "0 11 * * *",
};
