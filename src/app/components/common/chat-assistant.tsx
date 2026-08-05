"use client";

import { MessageCircle, X, Send, Loader2, Bot, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = input.trim();
    if (!cleanInput || isLoading) return;

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: cleanInput,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const assistantText = await response.text();
      const assistantMessage: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        content: assistantText.trim(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-assistant`,
          role: "assistant",
          content: "Lo siento, no pude responder en este momento.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-scroll al final del chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Autofocus al abrir el widget
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-[350px] sm:w-[400px] h-[500px] bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
          
          {/* Header */}
          <div className="bg-primary/90 text-primary-foreground p-4 flex justify-between items-center backdrop-blur-md">
            <div className="flex items-center gap-2">
              <Bot className="w-6 h-6" />
              <h3 className="font-semibold text-lg">Asistente IamParaná</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-primary-foreground/80 hover:text-white transition-colors"
              aria-label="Cerrar chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Área de Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {messages.length === 0 && (
              <div className="text-center text-slate-700 dark:text-slate-300 mt-10 space-y-2">
                <Bot className="w-12 h-12 mx-auto opacity-50" />
                <p>¡Hola! Soy el asistente virtual.</p>
                <p className="text-sm">
                  Pregúntame sobre noticias, la agenda de eventos o documentos del sitio.
                </p>
              </div>
            )}

            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2 max-w-[85%] ${
                  m.role === "user" ? "ml-auto flex-row-reverse" : ""
                } mt-1 mb-1`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-100"
                  }`}
                >
                  {m.role === "user" ? (
                    <User className="w-5 h-5" />
                  ) : (
                    <Bot className="w-5 h-5" />
                  )}
                </div>

                <div
                  className={`p-3 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm shadow-sm"
                      : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100 rounded-tl-sm border border-slate-200 dark:border-slate-700 shadow-sm"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2 max-w-[85%] mt-1 mb-1">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="p-3 rounded-2xl bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100 rounded-tl-sm border border-slate-200 dark:border-slate-700 flex items-center gap-2 shadow-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Escribiendo...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Formulario e Input */}
          <div className="p-4 bg-white/90 dark:bg-slate-950/90 border-t border-slate-200 dark:border-slate-800/80">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                ref={inputRef}
                className="flex-1 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-full px-4 py-2 text-sm placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                value={input}
                placeholder="Escribe tu mensaje..."
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-primary text-primary-foreground p-2 rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0 flex items-center justify-center w-10 h-10 shadow-sm"
                aria-label="Enviar"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 -ml-0.5" />
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Botón Flotante */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-primary text-primary-foreground p-4 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 animate-in zoom-in group"
          aria-label="Abrir asistente"
        >
          <MessageCircle className="w-7 h-7 group-hover:animate-pulse" />
        </button>
      )}
    </div>
  );
}