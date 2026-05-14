import "server-only";

import { listAgendaEventos } from "@/server/db/content-repository";
import { getNotificationSentByEventType, isHolidayToday } from "@/server/db/notifications-repository";
import { sendNotificationToAll } from "./push-notification-service";

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDateYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDaysUntilDate(targetDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const target = parseLocalDate(targetDate);
  target.setHours(0, 0, 0, 0);
  
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

export async function checkAndSendEventNotifications(): Promise<{ sent: number; events: string[] }> {
  const sentEvents: string[] = [];
  let totalSent = 0;

  try {
    const eventos = await listAgendaEventos();
    const today = new Date();
    const todayStr = formatDateYYYYMMDD(today);

    for (const evento of eventos) {
      const daysUntil = getDaysUntilDate(evento.fecha);
      let shouldNotify = false;
      let notificationType = "";

      // 7 días antes
      if (daysUntil === 7) {
        shouldNotify = true;
        notificationType = "event_7days";
      }
      // 1 día antes
      else if (daysUntil === 1) {
        shouldNotify = true;
        notificationType = "event_1day";
      }
      // Hoy
      else if (daysUntil === 0) {
        shouldNotify = true;
        notificationType = "event_today";
      }

      if (shouldNotify && evento.id) {
        // Verificar si ya se envió esta notificación
        const alreadySent = await getNotificationSentByEventType(notificationType, evento.id);
        
        if (!alreadySent) {
          let message = "";
          if (notificationType === "event_7days") {
            message = `Faltan 7 días para: ${evento.evento}`;
          } else if (notificationType === "event_1day") {
            message = `¡Mañana es: ${evento.evento}!`;
          } else if (notificationType === "event_today") {
            message = `¡Hoy es: ${evento.evento}!`;
          }

          const sent = await sendNotificationToAll(
            {
              title: "Recordatorio de Evento",
              body: message,
              icon: "/icon-192x192.png",
              badge: "/icon-192x192.png",
              data: {
                eventId: String(evento.id),
                eventName: evento.evento,
              },
            },
            notificationType,
            evento.id
          );

          if (sent > 0) {
            sentEvents.push(`${evento.evento} (${notificationType})`);
            totalSent += sent;
          }
        }
      }
    }
  } catch (error) {
    console.error("Error checking events for notifications:", error);
  }

  return { sent: totalSent, events: sentEvents };
}

export async function checkAndSendHolidayNotifications(): Promise<{ sent: number; holiday?: string }> {
  try {
    const today = new Date();
    const todayStr = formatDateYYYYMMDD(today);

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
