import { groq } from "@ai-sdk/groq";
import { streamText, createTextStreamResponse } from "ai";
import { listNoticiasPreview } from "@/server/db/content-repository";
import { listCalendarAgendaEvents } from "@/server/lib/google-calendar-service";

export const maxDuration = 30;

interface IncomingMessage {
  role?: "user" | "assistant" | "system" | "data";
  content?: string;
  parts?: Array<{ type?: string; text?: string }>;
}

// Helper para buscar noticias y eventos relevantes desde la misma fuente que usa la web
async function getContextData() {
  try {
    const [newsItems, agendaItems] = await Promise.all([
      listNoticiasPreview(),
      listCalendarAgendaEvents(),
    ]);

    const newsList = newsItems.slice(0, 5).map((item) => ({
      title: item.title,
      summary: item.description,
      url: `https://iamparana.org/noticias/${item.slug}`,
    }));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingEvents = agendaItems
      .filter((item) => {
        const rawDate = item.fecha;
        if (!rawDate) return false;
        const eventDate = new Date(rawDate);
        if (Number.isNaN(eventDate.getTime())) return false;
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= today;
      })
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
      .slice(0, 5)
      .map((item) => ({
        title: item.evento,
        description: item.descripcion ?? "",
        date: item.fecha,
        url: "https://iamparana.org/calendario",
      }));

    const eventsList = upcomingEvents;

    return { newsList, eventsList };
  } catch (err) {
    console.error("[DB RETRIEVAL ERROR]:", err);
    return { newsList: [], eventsList: [] };
  }
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const normalizedMessages = (messages ?? []).map((m: IncomingMessage) => {
      let content = "";

      if (typeof m.content === "string") {
        content = m.content;
      } else if (Array.isArray(m.parts)) {
        content = m.parts
          .map((p) => (p && p.type === "text" ? p.text ?? "" : ""))
          .join("");
      } else {
        content = JSON.stringify(m.content ?? "");
      }

      return {
        role: (m.role ?? "user") as "user" | "assistant" | "system",
        content,
      };
    });

    // Cargar información real desde la base de datos
    const { newsList, eventsList } = await getContextData();

    // Contexto en formato JSON/texto para el system prompt
    const contextText = `
NOTICIAS DISPONIBLES EN LA WEB:
${JSON.stringify(newsList, null, 2)}

EVENTOS DISPONIBLES EN LA WEB:
${JSON.stringify(eventsList, null, 2)}
`;

    const systemPrompt = `
Eres el asistente virtual oficial de "IAM Arquidiócesis de Paraná".

REGLAS STRICTAS DE RESPUESTA:
1. Responde ÚNICAMENTE con la información explícitamente presente en la sección "INFORMACIÓN DE LA PÁGINA WEB".
2. NO inventes, completes, reformules ni agregues datos que no aparezcan textualmente en el contexto. Si no aparece un dato, no lo deduzcas.
3. NO cambies fechas, títulos, descripciones ni detalles. Mantén exactitud literal cuando sea posible.
4. Si la respuesta a la pregunta del usuario NO se encuentra en el contexto, responde exactamente: "Lo siento, no dispongo de esa información en la página web oficial por el momento."
5. Cuando hables sobre una noticia o evento, incluye el enlace directo (URL) provisto en el contexto.
6. Si el usuario pregunta por un evento concreto y el contexto solo menciona el título y la fecha, responde solo con lo que se sabe, sin agregar información adicional.

INFORMACIÓN DE LA PÁGINA WEB:
${contextText}
`;

    const result = streamText({
      model: groq("llama-3.3-70b-versatile"),
      messages: normalizedMessages,
      system: systemPrompt,
      temperature: 0.1, // Temperatura baja para evitar alucinaciones/creatividad
      onError: ({ error }) => {
        console.error("[CHAT ROUTE ERROR]:", error);
      },
    });

    return createTextStreamResponse({
      stream: result.textStream,
    });
  } catch (error) {
    console.error("[CHAT API ERROR]:", error);
    return new Response(
      JSON.stringify({ error: "Error al procesar la solicitud" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}