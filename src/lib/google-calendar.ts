const API_KEY = process.env.GOOGLE_CALENDAR_API_KEY;
const CALENDAR_ID = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ID;

export async function getCalendarEvents() {
  const now = new Date().toISOString();
  // Traemos eventos desde ahora hasta 6 meses en el futuro
  const url = `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events?key=${API_KEY}&timeMin=${now}&singleEvents=true&orderBy=startTime`;

  try {
    const response = await fetch(url, { next: { revalidate: 3600 } }); // Cache de 1 hora
    const data = await response.json();

    if (!data.items) return [];

    return data.items.map((event: any) => ({
      id: event.id,
      fecha: event.start.date || event.start.dateTime,
      fecha_fin: event.end.date || event.end.dateTime,
      evento: event.summary,
      descripcion: event.description || "",
      link: event.htmlLink
    }));
  } catch (error) {
    console.error("Error al obtener eventos de Google Calendar:", error);
    return [];
  }
}