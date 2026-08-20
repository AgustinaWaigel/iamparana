"use client";

import { useEffect } from "react";

export function usePushNotifications() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    const setupPushNotifications = async () => {
      try {
        // El worker se registra una sola vez desde ServiceWorkerRegistration.
        // Registrar otro archivo con el mismo scope reemplaza el worker de caché
        // y deja la PWA sin modo offline.
        const registration = await navigator.serviceWorker.ready;

        // Los navegadores bloquean o penalizan los permisos pedidos durante la
        // carga. Si el permiso ya fue concedido, restauramos la suscripción.
        // El permiso inicial debe solicitarse desde una acción explícita de UI.
        if (Notification.permission === "granted") {
          await subscribeToPushNotifications(registration);
        }
      } catch (error) {
        console.error("Push notification setup failed:", error);
      }
    };

    void setupPushNotifications();
  }, []);
}

export async function enablePushNotifications(): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return false;
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;
  const registration = await navigator.serviceWorker.ready;
  return subscribeToPushNotifications(registration);
}

async function subscribeToPushNotifications(registration: ServiceWorkerRegistration): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 3000);
    const response = await fetch("/api/notifications/subscribe", { signal: controller.signal });
    window.clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`Could not obtain VAPID key (${response.status})`);

    const { publicKey } = await response.json();
    if (!publicKey) return false;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });
    }

    await fetch("/api/notifications/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "subscribe", subscription: subscription.toJSON() }),
    });
    localStorage.setItem("pushNotificationsEnabled", "true");
    return true;
  } catch (error) {
    console.warn("Push subscription error:", error);
    return false;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }
  return outputArray;
}
