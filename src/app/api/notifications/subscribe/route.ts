import { NextRequest, NextResponse } from "next/server";
import { subscribePush, unsubscribePush } from "@/server/db/notifications-repository";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscription, action } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }

    if (action === "unsubscribe") {
      await unsubscribePush(subscription.endpoint);
      return NextResponse.json({ success: true, message: "Unsubscribed from notifications" });
    }

    // Subscribe
    const subscriptionData = {
      endpoint: subscription.endpoint,
      auth: subscription.keys?.auth || "",
      p256dh: subscription.keys?.p256dh || "",
    };

    const id = await subscribePush(subscriptionData);

    return NextResponse.json({
      success: true,
      id,
      message: "Successfully subscribed to notifications",
    });
  } catch (error) {
    console.error("Error in push subscription API:", error);
    return NextResponse.json({ error: "Failed to process subscription" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Endpoint para obtener la clave VAPID pública
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  if (!vapidPublicKey) {
    return NextResponse.json(
      { error: "VAPID public key not configured" },
      { status: 500 }
    );
  }

  return NextResponse.json({ publicKey: vapidPublicKey });
}
