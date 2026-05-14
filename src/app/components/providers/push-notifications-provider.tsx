"use client";

import { usePushNotifications } from "@/app/hooks/use-push-notifications";

export function PushNotificationsProvider() {
  usePushNotifications();
  return null;
}
