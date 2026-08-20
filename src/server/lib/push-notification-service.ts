import "server-only";

import webpush from "web-push";
import { getAllPushSubscriptions, recordNotificationSent } from "@/server/db/notifications-repository";

interface PushSubscriptionJSON {
  endpoint: string;
  keys: {
    auth: string;
    p256dh: string;
  };
}

interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, string>;
}

// Configurar web-push con claves VAPID
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    "mailto:admin@iamparana.org", // Contacto
    vapidPublicKey,
    vapidPrivateKey
  );
  console.log("✅ Web Push configured with VAPID keys");
} else {
  console.warn("⚠️ VAPID keys not configured - push notifications will not work");
  console.warn("Missing keys:", {
    publicKey: !!vapidPublicKey,
    privateKey: !!vapidPrivateKey,
  });
}

async function sendPushNotification(
  subscription: { endpoint: string; auth: string; p256dh: string },
  payload: PushNotificationPayload
): Promise<boolean> {
  try {
    if (!vapidPrivateKey) {
      console.warn("⚠️ VAPID private key not configured");
      return false;
    }

    // Preparar el payload para web-push
    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || "/icon-192x192.png",
      badge: payload.badge || "/icon-192x192.png",
      tag: payload.tag || "default",
      data: payload.data || {},
    });

    // Enviar usando web-push
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          auth: subscription.auth,
          p256dh: subscription.p256dh,
        },
      },
      pushPayload
    );

    console.log("✅ Push notification sent to:", subscription.endpoint.substring(0, 30) + "...");
    return true;
  } catch (error) {
    if (error instanceof Error) {
      // Si la suscripción no es válida, registrar pero continuar
      if (error.message.includes("410") || error.message.includes("404")) {
        console.warn("⚠️ Subscription no longer valid (410/404):", subscription.endpoint.substring(0, 30) + "...");
        return false;
      }
      console.error("❌ Error sending push notification:", error.message);
    } else {
      console.error("❌ Error sending push notification:", error);
    }
    return false;
  }
}

export async function sendNotificationToAll(payload: PushNotificationPayload, eventType?: string, eventId?: number): Promise<number> {
  try {
    if (!vapidPrivateKey) {
      console.warn("⚠️ Cannot send notifications: VAPID private key not configured");
      return 0;
    }

    const subscriptions = await getAllPushSubscriptions();
    console.log(`📢 Sending notification to ${subscriptions.length} subscribers...`);
    
    const results = await Promise.all(subscriptions.map((sub) => sendPushNotification(sub, payload)));
    const successCount = results.filter(Boolean).length;

    if (successCount > 0 && eventType && eventId !== undefined) {
      await recordNotificationSent({
        event_type: eventType,
        event_id: eventId,
        title: payload.title,
        body: payload.body,
      });
    }

    console.log(`✅ Notifications sent: ${successCount}/${subscriptions.length}`);
    return successCount;
  } catch (error) {
    console.error("❌ Error sending notifications to all:", error);
    return 0;
  }
}

export async function sendNotificationToSubscription(
  subscription: { endpoint: string; auth: string; p256dh: string },
  payload: PushNotificationPayload
): Promise<boolean> {
  return sendPushNotification(subscription, payload);
}
