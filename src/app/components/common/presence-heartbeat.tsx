"use client";
import { useEffect } from "react";

// Avisa la presencia una sola vez por visita (al entrar al sitio), sin repetir.
export function PresenceHeartbeat() {
  useEffect(() => {
    let done = false;
    const touch = () => {
      if (done || document.visibilityState !== "visible") return;
      done = true;
      document.removeEventListener("visibilitychange", touch);
      fetch("/api/presence", { method: "POST", credentials: "include", keepalive: true })
        .then((response) => {
          if (response.ok) window.dispatchEvent(new Event("presence-updated"));
        })
        .catch(() => undefined);
    };
    touch();
    // Si la pestaña se abrió en segundo plano, se avisa cuando se la mira por primera vez.
    document.addEventListener("visibilitychange", touch);
    return () => document.removeEventListener("visibilitychange", touch);
  }, []);
  return null;
}
