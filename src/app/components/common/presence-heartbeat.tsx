"use client";
import { useEffect } from "react";
import { useSession } from "@/app/hooks/use-session";

export function PresenceHeartbeat() {
  const { user } = useSession();
  useEffect(() => {
    if (!user) return;
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
  }, [user?.id]);
  return null;
}
