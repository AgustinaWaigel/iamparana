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

    if (permission === "granted") {
      // Ya tiene permiso, suscribirse
      subscribeToPushNotifications(registration);
      return;
    }

    if (permission === "denied") {
      console.log("User denied notification permissions");
      return;
    }

    // Pedir permiso
    const result = await Notification.requestPermission();

    if (result === "granted") {
      subscribeToPushNotifications(registration);
    }
  } catch (error) {
    console.error("Error requesting notification permission:", error);
  }
}

async function subscribeToPushNotifications(registration: ServiceWorkerRegistration) {
  try {
    // Obtener clave VAPID
    const response = await fetch("/api/notifications/subscribe");
    const { publicKey } = await response.json();

    if (!publicKey) {
      console.error("VAPID public key not available");
      return;
    }

    // Verificar si ya existe suscripción
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Crear nueva suscripción
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }

    // Enviar suscripción al servidor
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
      console.log("Successfully subscribed to push notifications");
      localStorage.setItem("pushNotificationsEnabled", "true");
    }
  } catch (error) {
    console.error("Error subscribing to push notifications:", error);
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
