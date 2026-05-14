"use client";

import { useEffect } from "react";

export function usePushNotifications() {
  useEffect(() => {
    // Verificar soporte
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.log("Push notifications not supported");
      return;
    }

    // Registrar el service worker
    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
        console.log("✅ Service Worker registered (workbox)");

        // Registrar el handler custom de push
        try {
          await navigator.serviceWorker.register("/sw-custom.js", {
            scope: "/",
          });
          console.log("✅ Custom push handler registered");
        } catch (customError) {
          console.warn("⚠️ Custom push handler registration failed:", customError);
        }

        // Esperar máximo 1 segundo a que el SW esté activo
        let activeWorker = registration.active;
        let attempts = 0;
        const maxAttempts = 10; // máximo 1 segundo (10 * 100ms)

        while (!activeWorker && attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          activeWorker = registration.active;
          attempts++;
        }

        if (activeWorker) {
          console.log("✅ Service Worker is active");
        } else {
          console.log("⚠️ Service Worker activating in background");
        }

        // Solicitar permiso (sin espera extra)
        requestNotificationPermission(registration);
      } catch (error) {
        console.error("❌ Service Worker registration failed:", error);
      }
    };

    registerServiceWorker();
  }, []);
}

async function requestNotificationPermission(registration: ServiceWorkerRegistration) {
  try {
    // Verificar permiso existente
    const permission = Notification.permission;
    console.log("Current notification permission:", permission);

    if (permission === "granted") {
      // Ya tiene permiso, suscribirse
      console.log("Notification permission already granted, proceeding with subscription");
      subscribeToPushNotifications(registration);
      return;
    }

    if (permission === "denied") {
      console.log("User previously denied notification permissions");
      return;
    }

    // Pedir permiso
    console.log("Requesting notification permission from user...");
    const result = await Notification.requestPermission();
    console.log("User response to notification permission:", result);

    if (result === "granted") {
      console.log("User granted notification permission, proceeding with subscription");
      subscribeToPushNotifications(registration);
    } else if (result === "denied") {
      console.log("User denied notification permissions");
    } else {
      console.log("User dismissed notification permission prompt");
    }
  } catch (error) {
    console.error("Error requesting notification permission:", error);
  }
}

async function subscribeToPushNotifications(registration: ServiceWorkerRegistration) {
  try {
    if (!registration.pushManager) {
      console.error("Push Manager not available");
      return;
    }

    console.log("Attempting push subscription...");

    try {
      // Obtener clave VAPID con timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch("/api/notifications/subscribe", {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await response.json();
      const { publicKey } = data;

      if (!publicKey) {
        console.error("VAPID public key not available");
        return;
      }

      // Intentar obtener suscripción existente
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // Crear nueva suscripción
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
        });
        console.log("✅ Push subscription created");
      } else {
        console.log("✅ Existing push subscription");
      }

      // Enviar al servidor (sin esperar)
      fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "subscribe",
          subscription: subscription.toJSON(),
        }),
      }).catch((err) => console.warn("Failed to send subscription:", err));

      localStorage.setItem("pushNotificationsEnabled", "true");
    } catch (error) {
      console.warn("Push subscription error:", error instanceof Error ? error.message : error);
    }
  } catch (error) {
    console.error("Push setup failed:", error);
  }
}

// Convertir clave VAPID de base64 a Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
