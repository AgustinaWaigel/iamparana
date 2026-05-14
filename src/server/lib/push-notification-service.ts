import "server-only";

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

async function sendPushNotification(
  subscription: { endpoint: string; auth: string; p256dh: string },
  payload: PushNotificationPayload
): Promise<boolean> {
  try {
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      console.warn("VAPID public key not configured");
      return false;
    }

    const response = await fetch("https://fcm.googleapis.com/fcm/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `key=${process.env.FCM_SERVER_KEY}`,
      },
      body: JSON.stringify({
        to: subscription.endpoint,
        notification: {
          title: payload.title,
          body: payload.body,
          icon: payload.icon || "/icon-192x192.png",
          badge: payload.badge || "/icon-192x192.png",
        },
        data: payload.data || {},
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("Error sending push notification:", error);
    return false;
  }
}

export async function sendNotificationToAll(payload: PushNotificationPayload, eventType?: string, eventId?: number): Promise<number> {
  try {
    const subscriptions = await getAllPushSubscriptions();
    let successCount = 0;

    for (const sub of subscriptions) {
      const sent = await sendPushNotification(sub, payload);
      if (sent) {
        successCount++;
        if (eventType && eventId) {
          await recordNotificationSent({
            event_type: eventType,
            event_id: eventId,
            title: payload.title,
            body: payload.body,
          });
        }
      }
    }

    return successCount;
  } catch (error) {
    console.error("Error sending notifications to all:", error);
    return 0;
  }
}

export async function sendNotificationToSubscription(
  subscription: { endpoint: string; auth: string; p256dh: string },
  payload: PushNotificationPayload
): Promise<boolean> {
  return sendPushNotification(subscription, payload);
}
