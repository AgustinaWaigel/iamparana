import "server-only";

import { getTursoClient } from "./turso";

interface PushSubscription {
  id?: number;
  user_id?: number;
  endpoint: string;
  auth: string;
  p256dh: string;
}

interface NotificationSent {
  id?: number;
  event_type: string;
  event_id?: number;
  title: string;
  body: string;
  sent_at?: string;
}

interface HolidayDate {
  id?: number;
  date: string;
  name: string;
  is_fixed: number;
  month?: number;
  day?: number;
}

// Suscripciones push
export async function subscribePush(subscription: PushSubscription): Promise<number> {
  const client = getTursoClient();
  if (!client) throw new Error("Database client not available");

  try {
    const result = await client.execute({
      sql: "INSERT INTO push_subscriptions (user_id, endpoint, auth, p256dh) VALUES (?, ?, ?, ?)",
      args: [subscription.user_id || null, subscription.endpoint, subscription.auth, subscription.p256dh],
    });
    return Number(result.lastInsertRowid);
  } catch (error) {
    // Si el endpoint ya existe, actualizar
    const existsResult = await client.execute({
      sql: "SELECT id FROM push_subscriptions WHERE endpoint = ?",
      args: [subscription.endpoint],
    });
    
    if (existsResult.rows.length > 0) {
      await client.execute({
        sql: "UPDATE push_subscriptions SET auth = ?, p256dh = ?, user_id = ?, updated_at = CURRENT_TIMESTAMP WHERE endpoint = ?",
        args: [subscription.auth, subscription.p256dh, subscription.user_id || null, subscription.endpoint],
      });
      return Number(existsResult.rows[0].id);
    }
    throw error;
  }
}

export async function unsubscribePush(endpoint: string): Promise<void> {
  const client = getTursoClient();
  if (!client) throw new Error("Database client not available");

  await client.execute({
    sql: "DELETE FROM push_subscriptions WHERE endpoint = ?",
    args: [endpoint],
  });
}

export async function getAllPushSubscriptions(): Promise<PushSubscription[]> {
  const client = getTursoClient();
  if (!client) throw new Error("Database client not available");

  const result = await client.execute("SELECT id, user_id, endpoint, auth, p256dh FROM push_subscriptions");
  
  return result.rows.map((row) => ({
    id: Number(row.id),
    user_id: row.user_id ? Number(row.user_id) : undefined,
    endpoint: String(row.endpoint),
    auth: String(row.auth),
    p256dh: String(row.p256dh),
  }));
}

// Notificaciones enviadas
export async function recordNotificationSent(notification: NotificationSent): Promise<number> {
  const client = getTursoClient();
  if (!client) throw new Error("Database client not available");

  const result = await client.execute({
    sql: "INSERT INTO notifications_sent (event_type, event_id, title, body) VALUES (?, ?, ?, ?)",
    args: [notification.event_type, notification.event_id || null, notification.title, notification.body],
  });
  return Number(result.lastInsertRowid);
}

export async function getNotificationSentByEventType(eventType: string, eventId: number): Promise<NotificationSent | null> {
  const client = getTursoClient();
  if (!client) throw new Error("Database client not available");

  const result = await client.execute({
    sql: "SELECT id, event_type, event_id, title, body, sent_at FROM notifications_sent WHERE event_type = ? AND event_id = ? LIMIT 1",
    args: [eventType, eventId],
  });

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    id: Number(row.id),
    event_type: String(row.event_type),
    event_id: row.event_id ? Number(row.event_id) : undefined,
    title: String(row.title),
    body: String(row.body),
    sent_at: row.sent_at ? String(row.sent_at) : undefined,
  };
}

// Días festivos
export async function getHolidaysForYear(year: number): Promise<HolidayDate[]> {
  const client = getTursoClient();
  if (!client) throw new Error("Database client not available");

  const yearStr = String(year);
  const result = await client.execute({
    sql: "SELECT id, date, name, is_fixed, month, day FROM holiday_dates WHERE date LIKE ? OR (month IS NOT NULL AND day IS NOT NULL)",
    args: [`${yearStr}%`],
  });

  return result.rows.map((row) => ({
    id: Number(row.id),
    date: String(row.date),
    name: String(row.name),
    is_fixed: Number(row.is_fixed),
    month: row.month ? Number(row.month) : undefined,
    day: row.day ? Number(row.day) : undefined,
  }));
}

export async function isHolidayToday(date: string): Promise<boolean> {
  const client = getTursoClient();
  if (!client) throw new Error("Database client not available");

  const result = await client.execute({
    sql: "SELECT id FROM holiday_dates WHERE date = ?",
    args: [date],
  });

  return result.rows.length > 0;
}

export async function addHolidayDate(holiday: HolidayDate): Promise<number> {
  const client = getTursoClient();
  if (!client) throw new Error("Database client not available");

  const result = await client.execute({
    sql: "INSERT INTO holiday_dates (date, name, is_fixed, month, day) VALUES (?, ?, ?, ?, ?)",
    args: [holiday.date, holiday.name, holiday.is_fixed, holiday.month || null, holiday.day || null],
  });

  return Number(result.lastInsertRowid);
}
