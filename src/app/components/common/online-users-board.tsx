"use client";
import { useCallback, useEffect, useState } from "react";
import { Users } from "lucide-react";

interface OnlineUser { name: string }

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "U";
}

export function OnlineUsersBoard() {
  const [users, setUsers] = useState<OnlineUser[]>([]);
  const load = useCallback(async () => {
    const response = await fetch("/api/presence", { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json();
    setUsers(Array.isArray(data.users) ? data.users : []);
  }, []);

  useEffect(() => {
    load().catch(() => undefined);
    const interval = window.setInterval(() => load().catch(() => undefined), 30_000);
    const refresh = () => load().catch(() => undefined);
    window.addEventListener("presence-updated", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("presence-updated", refresh);
    };
  }, [load]);

  const visibleUsers = users.slice(0, 8);

  return (
    <aside className="mx-auto mt-6 w-full px-3 sm:px-8" aria-label="Usuarios conectados">
      <div className="flex flex-col gap-4 rounded-2xl border border-brand-brown/10 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-brand-brown/10 text-brand-brown">
            <Users size={19} />
            <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />
          </span>
          <div>
            <h2 className="m-0 text-sm font-black text-brand-brown">Comunidad en línea</h2>
            <p className="m-0 text-xs text-stone-500">
              {users.length === 0
                ? "Nadie conectado todavía"
                : `${users.length} ${users.length === 1 ? "persona conectada" : "personas conectadas"}`}
            </p>
          </div>
        </div>
        <div className="flex items-center -space-x-2">
          {visibleUsers.map((user, index) => (
            <div key={`${user.name}-${index}`} title={user.name} className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-brand-gold to-amber-600 text-[10px] font-black text-brand-deep shadow-sm">
              {initials(user.name)}
            </div>
          ))}
          {users.length > visibleUsers.length && (
            <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-stone-200 text-[10px] font-black text-stone-600">+{users.length - visibleUsers.length}</div>
          )}
        </div>
      </div>
    </aside>
  );
}
