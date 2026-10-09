"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, Trash2 } from "lucide-react";

// Comentarios que dejó gente sin cuenta en las noticias: no se publican hasta aprobarlos acá.

type Pendiente = { id: number; slug: string; noticia: string; author: string; content: string; createdAt: string };

function fecha(valor: string) {
  // La base guarda la hora en UTC, sin zona.
  const dia = new Date(`${valor.replace(" ", "T")}Z`);
  return Number.isNaN(dia.getTime()) ? valor : dia.toLocaleString("es-AR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
}

export default function ComentariosPage() {
  const [pendientes, setPendientes] = useState<Pendiente[] | null>(null);
  const [ocupado, setOcupado] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);

  const cargar = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/comentarios", { cache: "no-store", credentials: "include" });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "No se pudieron cargar los comentarios.");
      setPendientes(data.comentarios);
    } catch (error) {
      setPendientes((prev) => prev ?? []);
      setMensaje({ ok: false, texto: error instanceof Error ? error.message : "No se pudieron cargar los comentarios." });
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const resolver = async (item: Pendiente, aprobar: boolean) => {
    setOcupado(item.id);
    setMensaje(null);
    try {
      const response = await fetch(`/api/noticias/${item.slug}/engagement?commentId=${item.id}${aprobar ? "" : "&guest=1"}`, { method: aprobar ? "PATCH" : "DELETE", credentials: "include" });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "No se pudo guardar el cambio.");
      setPendientes((prev) => (prev ?? []).filter((otro) => otro.id !== item.id));
      setMensaje({ ok: true, texto: aprobar ? `Se publicó el comentario de ${item.author}.` : `Se borró el comentario de ${item.author}.` });
    } catch (error) {
      setMensaje({ ok: false, texto: error instanceof Error ? error.message : "No se pudo guardar el cambio." });
    } finally {
      setOcupado(null);
    }
  };

  return (
    <div className="min-h-screen bg-brand-paper">
      <div className="mx-auto max-w-3xl px-4 pb-20 pt-20 sm:px-6 sm:pt-24">
        <h1 className="m-0 text-left font-display text-[clamp(2rem,5vw,2.75rem)] font-extrabold leading-tight tracking-tight text-brand-ink">Comentarios por aprobar</h1>
        <p className="m-0 mt-3 max-w-2xl text-left text-base leading-relaxed text-brand-ink/75">
          Los comentarios de quien tiene cuenta se publican solos. Los de quien comenta sin cuenta, con su nombre, esperan acá hasta que los apruebes o los borres.
        </p>

        {mensaje && <p role={mensaje.ok ? "status" : "alert"} className={`m-0 mt-6 max-w-none rounded-xl border px-4 py-3 text-left text-sm font-medium ${mensaje.ok ? "border-green-200 bg-green-50 text-green-900" : "border-red-200 bg-red-50 text-red-800"}`}>{mensaje.texto}</p>}

        {pendientes === null ? (
          <p className="m-0 mt-10 max-w-none text-center text-stone-500"><Loader2 aria-hidden className="mx-auto mb-2 animate-spin motion-reduce:animate-none" />Cargando…</p>
        ) : pendientes.length === 0 ? (
          <p className="m-0 mt-8 max-w-none rounded-2xl border border-dashed border-brand-brown/25 px-5 py-10 text-center text-base text-brand-ink/75">No hay comentarios esperando. Cuando alguien comente sin cuenta, va a aparecer acá.</p>
        ) : (
          <ul className="m-0 mt-8 list-none space-y-4 p-0">
            {pendientes.map((item) => (
              <li key={item.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
                <p className="m-0 max-w-none text-left text-sm text-stone-600">
                  <strong className="font-extrabold text-brand-ink">{item.author}</strong> · {fecha(item.createdAt)} · en{" "}
                  <Link href={`/noticias/${item.slug}`} className="font-bold text-brand-brown underline">{item.noticia}</Link>
                </p>
                <p className="m-0 mt-3 max-w-none whitespace-pre-wrap break-words text-left text-base leading-relaxed text-brand-ink">{item.content}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" disabled={ocupado !== null} onClick={() => resolver(item, true)} className="btn-primary">
                    {ocupado === item.id ? <Loader2 size={16} aria-hidden className="animate-spin motion-reduce:animate-none" /> : <Check size={16} aria-hidden />} Aprobar y publicar
                  </button>
                  <button type="button" disabled={ocupado !== null} onClick={() => resolver(item, false)} className="btn-secondary">
                    <Trash2 size={16} aria-hidden /> Borrar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
