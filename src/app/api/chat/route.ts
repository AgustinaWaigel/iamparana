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
      url: `/noticias/${item.slug}`,
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
        url: "/calendario",
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
INFORMACIÓN INSTITUCIONAL Y DE LA OBRA:
Sobre la "Infancia y Adolescencia Misionera" (IAM):
- Es una obra de los niños y adolescentes en favor de los niños y adolescentes.
- Es un espacio donde ellos no solo son destinatarios de formación y servicios, sino que se transforman en verdaderos protagonistas de los mismos.
- Es una Obra por, para, con y de los niños y adolescentes en favor de la Iglesia universal y de los niños y adolescentes del mundo.

Historia:
- La Infancia y Adolescencia Misionera (IAM) nació en 1843, fundada por Mons. Carlos Augusto Forbin-Janson en Francia, motivado por las cartas de misioneros (especialmente de China) que relataban la situación de muchos niños sin bautizar y en condiciones muy precarias.
- Monseñor Forbin-Janson propuso una obra en la que los niños ayudaran a otros niños mediante la oración y la ayuda material. Así surgió el lema: "Que los niños (y adolescentes) ayuden a los niños (y adolescentes)".
- La Obra se expandió rápidamente por Europa y América, y en 1922 el Papa Pío XI la elevó a categoría de Obra Pontificia, proponiéndola como una escuela de fe para los niños cristianos.
- En Argentina, la Santa Infancia llegó en 1849. La primera colecta registrada fue en Tucumán en 1896.
- Desde 2002, tras un Encuentro Continental, se formalizó también la animación de adolescentes, cambiando el nombre a Infancia y Adolescencia Misionera (IAM).
- Hoy, en Argentina, la IAM está presente en casi todas las diócesis, con más de 475 grupos y más de 15.000 miembros activos.

Objetivos:
- Ayudar a los educadores (en Argentina: Animadores) a despertar progresivamente en los niños la conciencia misionera universal (Estatutos OMP III, N° 17).
- Promover la conciencia y el compromiso misionero de los niños.
- Dar apertura misionera a la educación cristiana (Estatutos OMP, Cap. II, Art. III, n° 19).
- Motivar a los niños a compartir su Fe y los medios materiales con los niños de las regiones e iglesias más necesitadas (Estatutos OMP III, 17 y 20).
- Promover las vocaciones misioneras (Estatutos OMP 17 – RM 84).

Fundador:
- Carlos Augusto Forbin-Janson fue un obispo francés, fundador de la Santa Infancia en 1843.
- Inspirado por las necesidades de los niños en tierras de misión, propuso una obra donde los propios niños se comprometieran a orar y colaborar materialmente para ayudar a otros niños necesitados.
- Puso la Obra bajo la protección del Niño Jesús, entendiendo la infancia como una etapa sagrada y un modelo de vida cristiana.
- Frente a la falta de respuesta de los adultos, Forbin-Janson acudió directamente a los niños, pidiéndoles "un Ave María cada día y una moneda al mes" para colaborar con la misión.

Paulina Jaricot:
- Paulina Jaricot fue una laica francesa, fundadora de la Obra de la Propagación de la Fe en 1822.
- Cuando Forbin-Janson le consultó su idea de fundar una obra para los niños, Paulina lo animó y quiso ser la primera miembro de la nueva obra.
- Ella reconoció el valor original del proyecto: niños ayudando a niños, y lo entendió como una "propagación de la fe para los niños".

Modelos de la IAM:
- Jesús: el primer misionero, enviado del Padre. Es el modelo supremo que los niños deben seguir, ser cristianos es ser imitadores de Cristo. Enviado por el Padre, es modelo de amor, obediencia, servicio y vida en oración, encarnado para revelar el amor del Padre a todos los hombres. Todo lo que Jesús hizo en la tierra es lo que nosotros debemos imitar.
- María: la Primera Misionera. Ella es la primera misionera de Jesús, dijo sí a su misión y la cumplió con entrega, generosidad, alegría y sencillez. También dijo sí a la misión que le encomendara el Hijo: ser Madre nuestra. Desde el momento mismo de la Anunciación, María comenzó a ayudar en la salvación de todos los hombres.

Patronos de la IAM:
- San Francisco Javier: Sacerdote jesuita, gran misionero sobre todo en la India y Japón, anunciando a Jesús, bautizando a miles de niños y, por sobre todo, haciendo grandes y pequeños amigos para Jesús. Su vida de oración lo llevó a encarnar el Evangelio y a integrarse completamente a la actividad misionera. Su gran preocupación era que todos conozcan a Cristo, lo amen y lo sigan. Su fiesta se celebra el día 3 de diciembre.
- Santa Teresita del Niño Jesús: Carmelita de clausura, dedicó su vida a orar por las misiones. Fue un ejemplo admirable de la cooperación misionera porque ofrecía los sacrificios diarios y sus oraciones por las misiones. Por eso el Papa Pío XI le dio el título de Patrona Universal de las Misiones, aunque nunca salió de su convento. Su fiesta se celebra el día 1 de octubre.

Insignias de la IAM:
- Carnet: Es la primer insignia oficial que se entrega en el proceso formativo que realiza el niño, adolescente o animador en la Obra y que lo identifica como miembro activo.
- Escudo: Es la segunda insignia oficial que se entrega al niño, adolescente o animador y lo identifica en su compromiso asumido en la IAM.
- Pañoleta: Es la tercera insignia oficial que se entrega. Simboliza la consagración asumida en la IAM.

Escuela con Jesús (Momentos dentro de un encuentro):
Esta estructura busca garantizar un proceso integral, sistemático y progresivo en la formación misionera de niños y adolescentes.
Esta guía presenta cada momento de la Escuela con Jesús en su orden pedagógico para ayudar a planificar encuentros claros, dinámicos y fieles al proceso misionero.
Orden secuencial: No se omiten pasos.
Duración flexible: Según edad y grupo.
Enfoque integral: Vida, Palabra y misión.

1. Objetivos
Se trata de un momento previo al encuentro en el que se plantean los objetivos que queremos lograr.
Cada encuentro tiene un objetivo único, simple y propio según el ciclo que estémos transitando.
(Para formularlos, podemos recurrir a la lista de acciones o verboides que se ofrecieron en el material Metodología de la IAM Parte I), realizable (concreto) y evaluable.
El objetivo de cada encuentro debe relacionarse con el tema central del Ciclo.
Hay que evitar objetivos amplios, difíciles de concretar o de evaluar, abstractos o de un nivel de concreción casi imposible.
Ejemplo: "Que los niños anuncien a todo el mundo que Dios los ama" (es imposible que un niño anuncie a "todo el mundo").
Correcto: "Que el niño anuncie a sus vecinos que Dios lo ama" o "Que el niño rece un Ave María por todo el mundo como gesto de que Dios ama a todos".

2. Ambientación
Es sumamente importante y necesario que los espacios que utilizamos estén ambientados de acuerdo con los objetivos y el tema del ciclo.
Estas ambientaciones, en lo posible, no deben repetirse ni requerir un alto nivel de abstracción para comprenderlas.
Si tenemos que explicar el recurso que usamos, no es pertinente.
Crear el clima y el espacio para el encuentro: por ejemplo, si hablamos de María, colocar una imagen suya, telas celestes, flores, etc.
La ambientación cambia entre ciclos y en cada encuentro.
Siempre debe estar presente la Palabra en un lugar privilegiado.
La ambientación también invita a que los animadores esperen a los niños/adolescentes antes de comenzar el encuentro.

3. Animación
Nos disponemos a romper el hielo y a poner en sintonía al grupo.
Una canción, una dinámica breve, el saludo de la IAM, o cantar el Himno son ideales.
La animación debe ser breve y relacionada con el tema del encuentro.

4. Oración Inicial
En este momento ponemos en manos de Jesús lo que vamos a vivir.
Saludamos a quien nos llama y disponemos el corazón.
No es necesario hacer una oración extensa, sino abierta y sincera.

5. Testimonio
Nos encontramos como personas y compartimos experiencias de la semana.
Preguntas como "¿Cómo estás?", "¿Qué te pasó?" ayudan a conectar.
Revisamos los compromisos misioneros asumidos.
También presentamos la Alcancía Misionera para el aporte solidario semanal.

6. Experiencia de Vida
Traemos la vida real del niño/adolescente al encuentro.
Juegos, dinámicas, cuentos, imágenes o canciones ayudan a conectar.
La experiencia debe ser variada, creativa y no repetitiva.
No debemos dar definiciones, sino que el niño descubra por sí mismo el mensaje.

7. Iluminación
La Palabra de Dios ilumina la experiencia vivida.
La cita debe ser adecuada a la edad y comprensible.
No se debe suprimir la lectura; se puede acompañar de imágenes o representaciones para facilitar su comprensión.

8. Dinámica/Actividad
Momento para reflexionar jugando.
Las actividades deben vincular la experiencia de vida y la Palabra.
Ejemplo: Dinámica sobre compartir si trabajamos ese tema.
Cada paso (catequesis, espiritualidad, proyección, comunión) tiene un tipo de actividad específica.

9. Compromisos
Tiempo para asumir compromisos misioneros personales.
El niño/adolescente debe elegirlo libremente, no impuesto por el animador.
Hay 3 tipos: personales, ambientales y más allá de las fronteras.
Se registran en el Cuaderno Misionero de cada uno.

10. Oración Final
Encuentro íntimo y breve con Jesús para dar gracias y sellar el compromiso.
Se puede finalizar rezando juntos el Ave María por día.
No puede omitirse ningún momento ni cambiar su orden.

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
5. Cuando hables sobre una noticia o evento, incluye su enlace usando formato Markdown: [texto del enlace](/ruta).
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