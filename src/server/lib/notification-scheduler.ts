import "server-only";

import { listAgendaEventos } from "@/server/db/content-repository";
import { getNotificationSentByEventType, isHolidayToday } from "@/server/db/notifications-repository";
import {
  isGoogleCalendarConfigured,
  listCalendarAgendaEvents,
} from "@/server/lib/google-calendar-service";
import { sendNotificationToAll } from "./push-notification-service";

type NotificationEvent = {
  id?: string | number;
  fecha: string;
  evento: string;
};

function getArgentinaDateString(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value || "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function getDaysUntilDate(targetDate: string): number {
  const [todayYear, todayMonth, todayDay] = getArgentinaDateString().split("-").map(Number);
  const [targetYear, targetMonth, targetDay] = targetDate.slice(0, 10).split("-").map(Number);
  const todayUtc = Date.UTC(todayYear, todayMonth - 1, todayDay);
  const targetUtc = Date.UTC(targetYear, targetMonth - 1, targetDay);
  return Math.round((targetUtc - todayUtc) / (1000 * 60 * 60 * 24));
}

// Google Calendar usa IDs de texto, mientras que el historial existente usa
// IDs numéricos. Este hash estable permite deduplicar ambos orígenes sin cambiar
// el esquema de la base de datos.
function getNotificationEventId(id: string | number): number {
  if (typeof id === "number") return id;

  let hash = 2166136261;
  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

async function listNotificationEvents(): Promise<NotificationEvent[]> {
  if (isGoogleCalendarConfigured()) {
    try {
      return await listCalendarAgendaEvents();
    } catch (error) {
      console.error("Error reading Google Calendar for notifications, using local agenda:", error);
    }
  }

  return await listAgendaEventos();
}

export async function checkAndSendEventNotification(evento: NotificationEvent): Promise<number> {
  if (!evento.id) return 0;

  const daysUntil = getDaysUntilDate(evento.fecha);
  let notificationType = "";

  if (daysUntil === 7) notificationType = "event_7days";
  else if (daysUntil === 1) notificationType = "event_1day";
  else if (daysUntil === 0) notificationType = "event_today";
  else return 0;

  const eventId = getNotificationEventId(evento.id);
  const alreadySent = await getNotificationSentByEventType(notificationType, eventId);
  if (alreadySent) return 0;

  let title = "";
  let message = "";
  if (notificationType === "event_7days") {
    title = "Se acerca un encuentro de IAM Paraná";
    message = `${evento.evento} es dentro de una semana. Guardá la fecha.`;
  } else if (notificationType === "event_1day") {
    title = "¡Mañana nos encontramos!";
    message = `Te esperamos en ${evento.evento}. Revisá los detalles en el calendario.`;
  } else {
    title = "¡Es hoy!";
    message = `${evento.evento} comienza hoy. ¡Nos vemos!`;
  }

  return sendNotificationToAll(
    {
      title,
      body: message,
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      image: "/assets/header/logoiam.jpg",
      tag: `${notificationType}-${eventId}`,
      data: {
        url: "/calendario",
        eventId: String(evento.id),
        eventName: evento.evento,
      },
    },
    notificationType,
    eventId
  );
}

export async function checkAndSendEventNotifications(): Promise<{ sent: number; events: string[] }> {
  const sentEvents: string[] = [];
  let totalSent = 0;

  try {
    const eventos = await listNotificationEvents();

    for (const evento of eventos) {
      const sent = await checkAndSendEventNotification(evento);
      if (sent > 0) {
        sentEvents.push(evento.evento);
        totalSent += sent;
      }
    }
  } catch (error) {
    console.error("Error checking events for notifications:", error);
  }

  return { sent: totalSent, events: sentEvents };
}

export async function checkAndSendHolidayNotifications(): Promise<{ sent: number; holiday?: string }> {
  try {
    const todayStr = getArgentinaDateString();

    // Verificar si hoy es festivo
    const isHoliday = await isHolidayToday(todayStr);

    if (isHoliday) {
      // Aquí se enviaría la notificación de festivo
      // Por ahora solo registramos
      return { sent: 0, holiday: todayStr };
    }

    return { sent: 0 };
  } catch (error) {
    console.error("Error checking for holidays:", error);
    return { sent: 0 };
  }
}

export async function checkAndSendAllNotifications(): Promise<{
  eventsNotifications: { sent: number; events: string[] };
  holidayNotification: { sent: number; holiday?: string };
}> {
  const [eventsNotifications, holidayNotification] = await Promise.all([
    checkAndSendEventNotifications(),
    checkAndSendHolidayNotifications(),
  ]);

  return {
    eventsNotifications,
    holidayNotification,
  };
}
