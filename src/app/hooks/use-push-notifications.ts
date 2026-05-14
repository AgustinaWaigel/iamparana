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
        console.log("Service Worker registered:", registration);

        // Esperar a que el Service Worker esté activo con timeout
        let activeWorker = registration.active;
        let attempts = 0;
        const maxAttempts = 50; // 5 segundos máximo (50 * 100ms)

        while (!activeWorker && attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          activeWorker = registration.active;
          attempts++;
        }

        if (!activeWorker) {
          console.warn(
            "Service Worker did not become active after waiting. Attempting subscription anyway..."
          );
        } else {
          console.log("Service Worker is now active");
        }

        // Esperar un poco más para asegurar que todo esté listo
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Solicitar permiso
        requestNotificationPermission(registration);
      } catch (error) {
        console.error("Service Worker registration failed:", error);
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
    // Verificar que pushManager está disponible
    if (!registration.pushManager) {
      console.error("Push Manager not available in Service Worker registration");
      return;
    }

    // Obtener clave VAPID
    const response = await fetch("/api/notifications/subscribe");
    const data = await response.json();
    const { publicKey } = data;

    if (!publicKey) {
      console.error("VAPID public key not available");
      return;
    }

    console.log("Attempting to get or create subscription...");

    // Verificar si ya existe suscripción
    let subscription = await registration.pushManager.getSubscription();
    console.log("Current subscription status:", subscription ? "exists" : "none");

    if (!subscription) {
      console.log("Creating new push subscription...");
      // Crear nueva suscripción
      try {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
        });
        console.log("✅ New push subscription created successfully");
      } catch (subscribeError) {
        console.error("Failed to subscribe:", subscribeError);
        throw subscribeError;
      }
    } else {
      console.log("✅ Existing push subscription found");
    }

    // Enviar suscripción al servidor
    console.log("Sending subscription to server...");
    const subscribeResponse = await fetch("/api/notifications/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "subscribe",
        subscription: subscription.toJSON(),
      }),
    });

    if (subscribeResponse.ok) {
      console.log("✅ Successfully subscribed to push notifications");
      localStorage.setItem("pushNotificationsEnabled", "true");
    } else {
      console.error("Failed to send subscription to server:", subscribeResponse.status);
    }
  } catch (error) {
    console.error("❌ Error subscribing to push notifications:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
    }
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
