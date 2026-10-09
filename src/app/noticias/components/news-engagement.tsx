"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Check, Heart, Loader2, MessageCircle, Send, Trash2 } from "lucide-react";
import { useSession } from "@/app/hooks/use-session";

// Me gusta y comentarios de una noticia. Con cuenta, el comentario se publica al instante;
// sin cuenta, se deja con un nombre y lo aprueba un administrador antes de que se vea.

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  userId: number | null;
  author: string;
  /** Lo dejó alguien sin cuenta. */
  guest: boolean;
  /** Espera aprobación: solo le llega a un administrador. */
  pending: boolean;
}

interface EngagementState {
  likes: number;
  likedByMe: boolean;
  comments: Comment[];
}

const CAMPO = "w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-base text-stone-800 outline-none placeholder:text-stone-500 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/30";
const ETIQUETA = "mb-1.5 block text-sm font-bold text-stone-700";

export function NewsEngagement({ slug }: { slug: string }) {
  const { user, isLoading: sessionLoading } = useSession();
  const [data, setData] = useState<EngagementState>({ likes: 0, likedByMe: false, comments: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [comment, setComment] = useState("");
  const [name, setName] = useState("");
  // Campo trampa para robots: las personas no lo ven ni lo completan.
  const [web, setWeb] = useState("");
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isAdmin = user?.role === "admin";
  const clave = (item: Comment) => `${item.guest ? "g" : "u"}${item.id}`;

  const load = useCallback(async () => {
    const response = await fetch(`/api/noticias/${slug}/engagement`, { cache: "no-store", credentials: "include" });
    if (!response.ok) throw new Error("No se pudieron cargar las interacciones");
    setData(await response.json());
  }, [slug]);

  useEffect(() => {
    load().catch((cause) => setError(cause instanceof Error ? cause.message : "Error inesperado")).finally(() => setLoading(false));
  }, [load, user?.id]);

  const toggleLike = async () => {
    if (!user || busy) return;
    const previousLiked = data.likedByMe;
    const previousLikes = data.likes;

    // Respuesta optimista: la interfaz cambia al instante y se confirma con
    // Turso en segundo plano. Ante un error se restaura el estado anterior.
    setData((current) => ({
      ...current,
      likedByMe: !previousLiked,
      likes: Math.max(0, previousLikes + (previousLiked ? -1 : 1)),
    }));
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/noticias/${slug}/engagement`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "like" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No se pudo registrar el Me gusta");
      setData((current) => ({ ...current, likedByMe: result.liked }));
    } catch (cause) {
      setData((current) => ({ ...current, likedByMe: previousLiked, likes: previousLikes }));
      setError(cause instanceof Error ? cause.message : "Error inesperado");
    } finally {
      setBusy(false);
    }
  };

  const submitComment = async (event: FormEvent) => {
    event.preventDefault();
    if (!comment.trim() || busy || (!user && !name.trim())) return;
    setBusy(true);
    setError("");
    setAviso("");
    try {
      const response = await fetch(`/api/noticias/${slug}/engagement`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user ? { type: "comment", content: comment } : { type: "comment", content: comment, name, web }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No se pudo enviar el comentario");
      setComment("");
      if (result.pending) setAviso("¡Gracias! Tu comentario se va a publicar cuando un administrador lo apruebe.");
      else await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Error inesperado");
    } finally {
      setBusy(false);
    }
  };

  const deleteComment = async (item: Comment) => {
    if (!user || deletingId !== null) return;
    const previousComments = data.comments;
    setDeletingId(clave(item));
    setError("");
    setData((current) => ({ ...current, comments: current.comments.filter((otro) => clave(otro) !== clave(item)) }));

    try {
      const response = await fetch(`/api/noticias/${slug}/engagement?commentId=${item.id}${item.guest ? "&guest=1" : ""}`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No se pudo eliminar el comentario");
    } catch (cause) {
      setData((current) => ({ ...current, comments: previousComments }));
      setError(cause instanceof Error ? cause.message : "Error inesperado");
    } finally {
      setDeletingId(null);
    }
  };

  const approveComment = async (item: Comment) => {
    if (deletingId !== null) return;
    setDeletingId(clave(item));
    setError("");
    try {
      const response = await fetch(`/api/noticias/${slug}/engagement?commentId=${item.id}`, { method: "PATCH", credentials: "include" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No se pudo aprobar el comentario");
      setData((current) => ({ ...current, comments: current.comments.map((otro) => (clave(otro) === clave(item) ? { ...otro, pending: false } : otro)) }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Error inesperado");
    } finally {
      setDeletingId(null);
    }
  };

  const publicados = data.comments.filter((item) => !item.pending).length;

  return (
    <section className="mt-12 rounded-3xl border border-stone-200 bg-stone-50/70 p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h2 className="m-0 text-xl font-black text-brand-brown">Participá de la noticia</h2>
          <p className="m-0 mt-1 text-sm text-stone-600">Dejá tu reacción o compartí un comentario.</p>
        </div>
        <button
          type="button"
          onClick={toggleLike}
          disabled={!user || busy || loading}
          title={user ? undefined : "Iniciá sesión para dar Me gusta"}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-bold transition ${
            data.likedByMe
              ? "border-red-200 bg-red-50 text-red-600"
              : "border-stone-200 bg-white text-stone-600 hover:border-red-200 hover:text-red-500"
          } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          <Heart size={18} className={data.likedByMe ? "fill-current" : ""} />
          Me gusta <span className="rounded-full bg-black/5 px-2 py-0.5">{data.likes}</span>
        </button>
      </div>

      {!sessionLoading && (
        <form onSubmit={submitComment} className="my-5">
          {!user && (
            <>
              <p className="m-0 mb-4 max-w-none rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left text-sm leading-relaxed text-amber-900">
                Podés comentar sin cuenta, con tu nombre: lo revisa un administrador antes de publicarlo. Si{" "}
                <Link href="/auth/login" className="font-black underline">iniciás sesión</Link>, tu comentario se publica al instante y podés dar Me gusta.
              </p>
              <label htmlFor="comentario-nombre" className={ETIQUETA}>Tu nombre</label>
              <input id="comentario-nombre" value={name} onChange={(event) => setName(event.target.value)} maxLength={60} required autoComplete="given-name" placeholder="Ej.: Sofi" className={`${CAMPO} mb-4 sm:max-w-xs`} />
              <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
                <label>
                  No completar
                  <input tabIndex={-1} autoComplete="off" value={web} onChange={(event) => setWeb(event.target.value)} />
                </label>
              </div>
            </>
          )}
          <label htmlFor="comentario-texto" className={ETIQUETA}>Tu comentario</label>
          <div className="flex items-end gap-2">
            <textarea
              id="comentario-texto"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              maxLength={1000}
              rows={3}
              required
              placeholder="Escribí algo sobre esta noticia..."
              className={`${CAMPO} min-h-24 flex-1 resize-y`}
            />
            <button type="submit" disabled={busy || !comment.trim() || (!user && !name.trim())} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-brown text-white disabled:opacity-50" aria-label={user ? "Publicar comentario" : "Enviar comentario"}>
              {busy ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </form>
      )}

      {aviso && <p role="status" className="m-0 my-4 max-w-none rounded-xl border border-green-200 bg-green-50 p-3 text-left text-sm font-medium text-green-900">{aviso}</p>}
      {error && <p role="alert" className="m-0 my-4 max-w-none rounded-xl bg-red-50 p-3 text-left text-sm text-red-700">{error}</p>}

      <div className="mt-5">
        <div className="mb-4 flex items-center gap-2 text-brand-brown">
          <MessageCircle size={18} />
          <h3 className="m-0 text-sm font-black uppercase tracking-wider">Comentarios ({publicados})</h3>
        </div>
        {loading ? (
          <Loader2 className="animate-spin text-stone-400" size={22} />
        ) : data.comments.length === 0 ? (
          <p className="m-0 text-sm text-stone-600">Todavía no hay comentarios. Podés ser la primera persona en participar.</p>
        ) : (
          <div className="space-y-3">
            {data.comments.map((item) => (
              <article key={clave(item)} className={`rounded-2xl border p-4 ${item.pending ? "border-amber-300 bg-amber-50" : "border-stone-200 bg-white"}`}>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <strong className="text-sm text-brand-brown">{item.author}</strong>
                    {item.pending && <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-bold text-amber-950">Espera aprobación</span>}
                  </span>
                  <div className="flex items-center gap-2">
                    <time className="text-xs text-stone-500">{new Date(item.createdAt).toLocaleDateString('es-AR')}</time>
                    {item.pending && isAdmin && (
                      <button type="button" onClick={() => approveComment(item)} disabled={deletingId !== null} className="inline-flex items-center gap-1 rounded-full bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-800 disabled:opacity-50">
                        <Check size={14} aria-hidden /> Aprobar
                      </button>
                    )}
                    {(isAdmin || (!item.guest && user?.id === item.userId)) && (
                      <button
                        type="button"
                        onClick={() => deleteComment(item)}
                        disabled={deletingId !== null}
                        aria-label="Eliminar comentario"
                        title="Eliminar comentario"
                        className="rounded-full p-1.5 text-stone-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      >
                        {deletingId === clave(item) ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    )}
                  </div>
                </div>
                <p className="m-0 whitespace-pre-wrap break-words text-left text-sm leading-relaxed text-stone-700">{item.content}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
