"use client";

import { Loader2, Send, Square, User, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import ReactMarkdown from "react-markdown";

const FORBIN_IMAGE = "/uploads/forbincito.jpg";

type ChatMessage = { id: string; role: "user" | "assistant"; content: string };

function MessageContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        h1: ({ children }) => <p className="mb-2 font-semibold">{children}</p>,
        h2: ({ children }) => <p className="mb-2 font-semibold">{children}</p>,
        h3: ({ children }) => <p className="mb-2 font-semibold">{children}</p>,
        ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
        ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
        a: ({ href = "", children }) => {
          const external = /^https?:\/\//.test(href);
          return <a href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} className="font-medium text-blue-600 hover:underline dark:text-blue-400">{children}</a>;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export function ChatAssistant() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  async function sendMessage(text: string) {
    const cleanInput = text.trim();
    if (!cleanInput || isLoading) return;

    const timestamp = Date.now();
    const userMessage: ChatMessage = { id: `${timestamp}-user`, role: "user", content: cleanInput };
    const assistantId = `${timestamp}-assistant`;
    const conversation = [...messages, userMessage];
    setMessages([...conversation, { id: assistantId, role: "assistant", content: "" }]);
    setInput("");
    setIsLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: conversation.map(({ role, content }) => ({ role, content })) }),
        signal: controller.signal,
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || `Error ${response.status}`);
      }
      if (!response.body) throw new Error("No se pudo transmitir la respuesta.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value, { stream: true });
        setMessages((current) => current.map((message) => message.id === assistantId ? { ...message, content: assistantText } : message));
      }
      assistantText += decoder.decode();
      setMessages((current) => current.map((message) => message.id === assistantId ? { ...message, content: assistantText.trim() || "No pude generar una respuesta." } : message));
    } catch (error) {
      if (controller.signal.aborted) {
        setMessages((current) => current.map((message) => message.id === assistantId && !message.content ? { ...message, content: "Respuesta detenida." } : message));
      } else {
        console.error("Chat error:", error);
        const errorMessage = error instanceof Error ? error.message : "No pude responder en este momento.";
        setMessages((current) => current.map((message) => message.id === assistantId ? { ...message, content: errorMessage } : message));
      }
    } finally {
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isLoading]);
  useEffect(() => { if (isOpen) inputRef.current?.focus(); }, [isOpen]);
  useEffect(() => () => abortControllerRef.current?.abort(), []);
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  if (pathname !== "/") return null;

  return (
    <div className={`fixed z-[1200] flex flex-col items-end ${isOpen ? "inset-0 sm:inset-auto sm:bottom-6 sm:right-6" : "bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 sm:bottom-6 sm:right-6"}`}>
      {isOpen && (
        <>
          <button type="button" aria-label="Cerrar chat" onClick={() => setIsOpen(false)} className="absolute inset-0 hidden bg-black/30 backdrop-blur-[2px] sm:block" />
          <section role="dialog" aria-modal="true" aria-labelledby="forbincito-title" className="relative z-10 flex h-[100dvh] w-full flex-col overflow-hidden bg-[#fffdf9] shadow-2xl animate-in slide-in-from-bottom-5 fade-in sm:mb-4 sm:h-[min(620px,calc(100dvh-3rem))] sm:w-[min(400px,calc(100vw-3rem))] sm:rounded-3xl sm:border sm:border-amber-950/10">
          <div className="flex shrink-0 items-center justify-between bg-gradient-to-r from-[#622d0d] to-[#8a4518] px-4 pb-3 pt-[max(.75rem,env(safe-area-inset-top))] text-white sm:p-4">
            <div className="flex items-center gap-2">
              <Image src={FORBIN_IMAGE} alt="Mons. Carlos Augusto Forbin-Janson" width={36} height={36} className="h-9 w-9 rounded-full border-2 border-white/70 object-cover object-[40%_35%]" />
              <div><h3 id="forbincito-title" className="font-semibold leading-tight">Forbincito</h3><p className="text-xs text-white/80">Asistente de IAM Paraná</p></div>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} aria-label="Cerrar chat" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20 active:scale-95"><X className="h-6 w-6" /></button>
          </div>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain bg-[#fffdf9] px-4 py-5" aria-live="polite">
            {messages.length === 0 && (
              <div className="mx-auto mt-[8dvh] max-w-xs space-y-3 text-center text-stone-700 sm:mt-8">
                <Image src={FORBIN_IMAGE} alt="Forbincito" width={64} height={64} className="mx-auto h-16 w-16 rounded-full border-2 border-primary/30 object-cover object-[40%_35%] shadow-sm" />
                <p>¡Hola! Soy Forbincito, el asistente virtual de IAM Paraná.</p>
                <p className="text-sm">Podés preguntarme sobre la IAM, noticias y próximos eventos.</p>
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  {["¿Qué es la IAM?", "Próximos eventos", "Últimas noticias"].map((suggestion) => (
                    <button key={suggestion} type="button" onClick={() => void sendMessage(suggestion)} className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10">{suggestion}</button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div key={message.id} className={`flex max-w-[88%] gap-2 ${message.role === "user" ? "ml-auto flex-row-reverse" : ""}`}>
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full ${message.role === "user" ? "bg-primary text-primary-foreground" : "border border-primary/30 bg-white"}`}>
                  {message.role === "user" ? <User className="h-5 w-5" /> : <Image src={FORBIN_IMAGE} alt="Forbincito" width={32} height={32} className="h-full w-full object-cover object-[40%_35%]" />}
                </div>
                <div className={`whitespace-pre-wrap rounded-2xl p-3 text-sm leading-relaxed shadow-sm ${message.role === "user" ? "rounded-tr-sm bg-primary text-primary-foreground" : "rounded-tl-sm border border-stone-200 bg-white text-stone-800"}`}>
                  {message.content ? <MessageContent content={message.content} /> : <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Pensando...</span>}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="shrink-0 border-t border-stone-200 bg-white px-3 pb-[max(.75rem,env(safe-area-inset-bottom))] pt-3 sm:p-4">
            <form onSubmit={(event) => { event.preventDefault(); void sendMessage(input); }} className="flex items-center gap-2">
              <input ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} maxLength={1500} disabled={isLoading} placeholder="Escribí tu mensaje..." aria-label="Mensaje" className="min-w-0 flex-1 rounded-full border border-stone-300 bg-stone-50 px-4 py-2.5 text-base text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 disabled:opacity-60 sm:text-sm" />
              {isLoading ? (
                <button type="button" onClick={() => abortControllerRef.current?.abort()} aria-label="Detener respuesta" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"><Square className="h-4 w-4 fill-current" /></button>
              ) : (
                <button type="submit" disabled={!input.trim()} aria-label="Enviar" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"><Send className="h-4 w-4" /></button>
              )}
            </form>
          </div>
          </section>
        </>
      )}
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} aria-label="Abrir a Forbincito, creador de la IAM" className="group flex h-[76px] w-[76px] items-center justify-center rounded-full border border-white/40 bg-white/25 p-1.5 shadow-2xl backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:bg-white/35 hover:shadow-[0_18px_40px_rgba(0,0,0,0.28)] sm:h-[84px] sm:w-[84px]">
          <span className="relative h-full w-full overflow-hidden rounded-full border-2 border-white/90 bg-white shadow-md">
            <Image src={FORBIN_IMAGE} alt="" fill sizes="(min-width: 640px) 72px, 64px" priority className="scale-110 object-cover object-[39%_32%] transition-transform duration-200 group-hover:scale-[1.16]" />
          </span>
        </button>
      )}
    </div>
  );
}
