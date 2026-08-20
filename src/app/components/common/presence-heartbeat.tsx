"use client";
import { useEffect } from "react";

export function PresenceHeartbeat() {
  useEffect(() => {
    const touch = () => {
      if (document.visibilityState === "visible") {
        fetch("/api/presence", { method: "POST", credentials: "include", keepalive: true })
          .then((response) => {
            if (response.ok) window.dispatchEvent(new Event("presence-updated"));
          })
          .catch(() => undefined);
      }
    };
    touch();
    const interval = window.setInterval(touch, 45_000);
    document.addEventListener("visibilitychange", touch);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", touch);
    };
  }, []);
  return null;
}
