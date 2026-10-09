"use client";
import { useEffect } from "react";

// Avisa que hay alguien en el sitio: al entrar y después cada 4 minutos, solo mientras la pestaña
// está a la vista. El servidor cuenta como conectado a quien avisó en los últimos 6 minutos.
const CADA_MS = 4 * 60_000;

export function PresenceHeartbeat() {
  useEffect(() => {
    let ultimo = 0;
    const touch = () => {
      if (document.visibilityState !== "visible" || Date.now() - ultimo < CADA_MS - 5000) return;
      ultimo = Date.now();
      fetch("/api/presence", { method: "POST", credentials: "include", keepalive: true })
        .then((response) => {
          if (response.ok) window.dispatchEvent(new Event("presence-updated"));
        })
        .catch(() => undefined);
    };
    touch();
    const reloj = window.setInterval(touch, CADA_MS);
    // Si la pestaña estaba en segundo plano, se avisa cuando se la vuelve a mirar.
    document.addEventListener("visibilitychange", touch);
    return () => {
      window.clearInterval(reloj);
      document.removeEventListener("visibilitychange", touch);
    };
  }, []);
  return null;
}
