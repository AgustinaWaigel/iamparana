"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Heart, Loader2, MessageCircle, Send, Trash2 } from "lucide-react";
import { useSession } from "@/app/hooks/use-session";

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  userId: number;
  author: string;
}

interface EngagementState {
  likes: number;
  likedByMe: boolean;
  comments: Comment[];
}

export function NewsEngagement({ slug }: { slug: string }) {
  const { user, isLoading: sessionLoading } = useSession();
  const [data, setData] = useState<EngagementState>({ likes: 0, likedByMe: false, comments: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

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
    if (!user || !comment.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/noticias/${slug}/engagement`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "comment", content: comment }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No se pudo publicar el comentario");
      setComment("");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Error inesperado");
    } finally {
      setBusy(false);
    }
  };

  const deleteComment = async (commentId: number) => {
    if (!user || deletingId !== null) return;
    const previousComments = data.comments;
    setDeletingId(commentId);
    setError("");
    setData((current) => ({ ...current, comments: current.comments.filter((item) => item.id !== commentId) }));

    try {
      const response = await fetch(`/api/noticias/${slug}/engagement?commentId=${commentId}`, {
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

  return (
    <section className="mt-12 rounded-3xl border border-stone-200 bg-stone-50/70 p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <h2 className="m-0 text-xl font-black text-brand-brown">Participá de la noticia</h2>
          <p className="m-0 mt-1 text-sm text-stone-500">Dejá tu reacción o compartí un comentario.</p>
        </div>
        <button
          type="button"
          onClick={toggleLike}
          disabled={!user || busy || loading}
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

      {!sessionLoading && !user && (
        <div className="my-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <Link href="/auth/login" className="font-black underline">Iniciá sesión</Link> para dar Me gusta o comentar.
        </div>
      )}

      {user && (
        <form onSubmit={submitComment} className="my-5">
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-stone-500">Tu comentario</label>
          <div className="flex items-end gap-2">
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="Escribí algo sobre esta noticia..."
              className="min-h-24 flex-1 resize-y rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm outline-none focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20"
            />
            <button type="submit" disabled={busy || !comment.trim()} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-brown text-white disabled:opacity-50" aria-label="Publicar comentario">
              {busy ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
        </form>
      )}

      {error && <p className="m-0 my-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="mt-5">
        <div className="mb-4 flex items-center gap-2 text-brand-brown">
          <MessageCircle size={18} />
          <h3 className="m-0 text-sm font-black uppercase tracking-wider">Comentarios ({data.comments.length})</h3>
        </div>
        {loading ? (
          <Loader2 className="animate-spin text-stone-400" size={22} />
        ) : data.comments.length === 0 ? (
          <p className="m-0 text-sm text-stone-500">Todavía no hay comentarios. Podés ser la primera persona en participar.</p>
        ) : (
          <div className="space-y-3">
            {data.comments.map((item) => (
              <article key={item.id} className="rounded-2xl border border-stone-200 bg-white p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <strong className="text-sm text-brand-brown">{item.author}</strong>
                  <div className="flex items-center gap-2">
                    <time className="text-xs text-stone-400">{new Date(item.createdAt).toLocaleDateString('es-AR')}</time>
                    {(user?.id === item.userId || user?.role === 'admin') && (
                      <button
                        type="button"
                        onClick={() => deleteComment(item.id)}
                        disabled={deletingId !== null}
                        aria-label="Eliminar comentario"
                        title="Eliminar comentario"
                        className="rounded-full p-1.5 text-stone-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      >
                        {deletingId === item.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
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
