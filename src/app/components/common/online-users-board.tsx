"use client";
import { useCallback, useEffect, useState } from "react";

// Comunidad en línea: cuánta gente está en el sitio ahora y, de quienes tienen cuenta, su nombre.
// Los visitantes sin cuenta solo se cuentan.

interface OnlineUser { name: string }

// Un color del rosario misionero para cada persona, siempre el mismo para el mismo nombre.
const COLORES = [
  "bg-emerald-600 text-white",
  "bg-red-600 text-white",
  "bg-white text-brand-deep ring-1 ring-brand-deep/25",
  "bg-blue-700 text-white",
  "bg-yellow-400 text-brand-deep",
];
const MAX_NOMBRES = 12;

const colorDe = (name: string) => COLORES[[...name].reduce((suma, letra) => suma + letra.charCodeAt(0), 0) % COLORES.length];

export function OnlineUsersBoard() {
  const [users, setUsers] = useState<OnlineUser[]>([]);
  const [visitors, setVisitors] = useState(0);
  const [total, setTotal] = useState<number | null>(null);
  const load = useCallback(async () => {
    const response = await fetch("/api/presence", { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json();
    setUsers(Array.isArray(data.users) ? data.users : []);
    setVisitors(Number(data.visitors || 0));
    setTotal(Number(data.total || 0));
  }, []);

  useEffect(() => {
    // Se consulta al entrar y cada vez que se avisa la propia presencia (cada 4 minutos).
    load().catch(() => undefined);
    const refresh = () => load().catch(() => undefined);
    window.addEventListener("presence-updated", refresh);
    return () => {
      window.removeEventListener("presence-updated", refresh);
    };
  }, [load]);

  const visibles = users.slice(0, MAX_NOMBRES);
  // Quienes no entran en la lista de nombres se suman a los visitantes.
  const sinNombre = visitors + (users.length - visibles.length);

  return (
    <section aria-labelledby="comunidad-titulo" className="mx-auto w-full max-w-7xl px-4 pb-14 pt-12 sm:px-6 sm:pb-20 sm:pt-16">
      <div className="relative overflow-hidden rounded-[28px] bg-yellow-400 px-6 py-8 text-brand-deep shadow-[0_26px_50px_-30px_rgba(58,21,8,0.8)] sm:px-10 sm:py-10">
        <span aria-hidden className="absolute -right-12 -top-16 h-56 w-56 rounded-full bg-white/30" />
        <span aria-hidden className="absolute -bottom-24 right-40 h-48 w-48 rounded-full bg-white/20" />

        <div className="relative grid gap-7 lg:grid-cols-[auto_1fr] lg:items-center lg:gap-12">
          <div>
            <h2 id="comunidad-titulo" className="m-0 text-left font-display text-[clamp(1.9rem,4.6vw,3rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-brand-deep">
              Comunidad en línea
            </h2>
            <p aria-live="polite" className="m-0 mt-4 flex max-w-none items-center gap-4 text-left">
              <span className="font-display text-6xl font-extrabold leading-none tabular-nums sm:text-7xl">{total ?? "–"}</span>
              <span className="text-base font-bold leading-snug sm:text-lg">
                <span className="flex items-center gap-2">
                  <span aria-hidden className="relative flex h-3 w-3">
                    <span className="absolute inset-0 rounded-full bg-emerald-600/60 motion-safe:animate-ping" />
                    <span className="relative h-3 w-3 rounded-full bg-emerald-700" />
                  </span>
                  {total === 1 ? "persona" : "personas"}
                </span>
                en el sitio ahora
              </span>
            </p>
          </div>

          <div>
            {visibles.length > 0 || sinNombre > 0 ? (
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                {visibles.map((user, index) => (
                  <li key={`${user.name}-${index}`} className="flex items-center gap-2 rounded-full bg-white py-1.5 pl-1.5 pr-4 text-sm font-bold text-brand-deep shadow-[0_8px_16px_-12px_rgba(58,21,8,0.8)] animate-in fade-in zoom-in-95 duration-300 motion-reduce:animate-none">
                    <span aria-hidden className={`flex h-8 w-8 items-center justify-center rounded-full font-display text-sm font-extrabold ${colorDe(user.name)}`}>
                      {user.name[0]?.toUpperCase() ?? "U"}
                    </span>
                    {user.name}
                  </li>
                ))}
                {sinNombre > 0 && (
                  <li className="flex items-center rounded-full bg-brand-deep px-4 py-2.5 text-sm font-bold text-white">
                    {visibles.length > 0 ? "y " : ""}{sinNombre} {sinNombre === 1 ? "visitante" : "visitantes"}{visibles.length > 0 ? " más" : ""}
                  </li>
                )}
              </ul>
            ) : (
              <p className="m-0 max-w-none text-left text-base font-medium text-brand-deep/85">{total === null ? "Mirando quién anda por acá…" : "Por ahora no hay nadie más. ¡Sos la primera persona en llegar!"}</p>
            )}

          </div>
        </div>
      </div>
    </section>
  );
}
