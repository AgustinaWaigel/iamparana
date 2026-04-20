import "server-only";

import { google } from "googleapis";

export interface CalendarAgendaEvent {
  id: string;
  fecha: string;
  fecha_fin?: string;
  evento: string;
  color?: string;
  descripcion?: string;
  hora_inicio?: string;
  hora_fin?: string;
  todo_el_dia?: boolean;
}

interface CalendarAgendaInput {
  evento: string;
  fecha: string;
  fecha_fin?: string;
  color?: string;
  descripcion?: string;
  hora_inicio?: string;
  hora_fin?: string;
  todo_el_dia?: boolean;
}

const DEFAULT_TIMEZONE = "America/Argentina/Buenos_Aires";

function normalizeColorId(color?: string) {
  if (!color) return undefined;
  const normalized = color.trim();
  if (!/^(?:[1-9]|10|11)$/.test(normalized)) {
    return undefined;
  }
  return normalized;
}

function parseServiceAccount() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON no configurado");
  }
  return JSON.parse(raw);
}

function getCalendarId() {
  const calendarId = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ID?.trim();
  if (!calendarId) {
    throw new Error("NEXT_PUBLIC_GOOGLE_CALENDAR_ID no configurado");
  }
  return calendarId;
}

function getCalendarClient() {
  const credentials = parseServiceAccount();
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });

  return google.calendar({ version: "v3", auth });
}

function toYmd(value?: string | null) {
  if (!value) return undefined;
  return value.slice(0, 10);
}

function toHm(value?: string | null) {
  if (!value) return undefined;
  const match = value.match(/T(\d{2}:\d{2})/);
  return match?.[1];
}

function normalizeYmd(value?: string | null) {
  if (!value || typeof value !== "string") return undefined;
  const normalized = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return undefined;
  return normalized;
}

function normalizeHm(value?: string | null) {
  if (!value || typeof value !== "string") return undefined;
  const normalized = value.trim();
  if (!/^\d{2}:\d{2}$/.test(normalized)) return undefined;
  return normalized;
}

function plusOneHour(hm: string) {
  const [hours, minutes] = hm.split(":").map(Number);
  const date = new Date(Date.UTC(2000, 0, 1, hours, minutes));
  date.setUTCHours(date.getUTCHours() + 1);
  return `${String(date.getUTCHours()).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}`;
}

function toDateTimeWithOffset(dateYmd: string, hm: string) {
  return `${dateYmd}T${hm}:00-03:00`;
}

function plusOneDay(dateYmd: string) {
  const [year, month, day] = dateYmd.split("-").map(Number);
  const dt = new Date(Date.UTC(year, month - 1, day));
  dt.setUTCDate(dt.getUTCDate() + 1);
  return dt.toISOString().slice(0, 10);
}

function minusOneDay(dateYmd: string) {
  const [year, month, day] = dateYmd.split("-").map(Number);
  const dt = new Date(Date.UTC(year, month - 1, day));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return dt.toISOString().slice(0, 10);
}

function mapGoogleEventToAgenda(item: {
  id?: string | null;
  summary?: string | null;
  description?: string | null;
  colorId?: string | null;
  start?: { date?: string | null; dateTime?: string | null } | null;
  end?: { date?: string | null; dateTime?: string | null } | null;
}): CalendarAgendaEvent | null {
  const startDate = toYmd(item.start?.date) || toYmd(item.start?.dateTime);
  if (!item.id || !startDate) {
    return null;
  }

  const isAllDay = Boolean(item.start?.date);
  const endRaw = toYmd(item.end?.date) || toYmd(item.end?.dateTime);
  const endDate = !endRaw
    ? undefined
    : isAllDay
      ? minusOneDay(endRaw)
      : endRaw;

  return {
    id: item.id,
    fecha: startDate,
    fecha_fin: endDate && endDate !== startDate ? endDate : undefined,
    evento: (item.summary || "(Sin título)").trim(),
    color: normalizeColorId(item.colorId || undefined),
    descripcion: item.description?.trim() || undefined,
    hora_inicio: isAllDay ? undefined : toHm(item.start?.dateTime),
    hora_fin: isAllDay ? undefined : toHm(item.end?.dateTime),
    todo_el_dia: isAllDay,
  };
}

export function isGoogleCalendarConfigured() {
  return Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim() &&
      process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ID?.trim()
  );
}

export async function listCalendarAgendaEvents(): Promise<CalendarAgendaEvent[]> {
  const calendar = getCalendarClient();
  const calendarId = getCalendarId();

  const response = await calendar.events.list({
    calendarId,
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 250,
    timeMin: new Date(new Date().getFullYear() - 1, 0, 1).toISOString(),
  });

  return (response.data.items || [])
    .map(mapGoogleEventToAgenda)
    .filter((item): item is CalendarAgendaEvent => Boolean(item));
}

export async function createCalendarAgendaEvent(input: CalendarAgendaInput): Promise<CalendarAgendaEvent> {
  const calendar = getCalendarClient();
  const calendarId = getCalendarId();
  const colorId = normalizeColorId(input.color);
  const description =
    typeof input.descripcion === "string" ? input.descripcion.trim() || undefined : undefined;
  const isAllDay = input.todo_el_dia !== false;

  const startDateYmd = normalizeYmd(input.fecha);
  const endDateYmdFromInput = normalizeYmd(input.fecha_fin);
  if (!startDateYmd) {
    throw new Error("Fecha de inicio invalida");
  }

  const startHm = normalizeHm(input.hora_inicio) || "09:00";
  const rawEndHm = normalizeHm(input.hora_fin);
  const endHm = rawEndHm || plusOneHour(startHm);
  const endDateYmd = endDateYmdFromInput || startDateYmd;

  const startDateTime = toDateTimeWithOffset(startDateYmd, startHm);
  let endDateTime = toDateTimeWithOffset(endDateYmd, endHm);

  if (endDateYmd === startDateYmd && endDateTime <= startDateTime) {
    endDateTime = toDateTimeWithOffset(endDateYmd, plusOneHour(startHm));
  }

  const response = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: input.evento,
      description,
      colorId,
      start: isAllDay
        ? { date: startDateYmd }
        : { dateTime: startDateTime, timeZone: DEFAULT_TIMEZONE },
      end: isAllDay
        ? { date: plusOneDay(endDateYmd) }
        : { dateTime: endDateTime, timeZone: DEFAULT_TIMEZONE },
    },
  });

  const mapped = mapGoogleEventToAgenda({
    id: response.data.id,
    summary: response.data.summary,
    description: response.data.description,
    colorId: response.data.colorId,
    start: response.data.start,
    end: response.data.end,
  });

  if (!mapped) {
    throw new Error("No se pudo mapear el evento creado de Google Calendar");
  }

  return mapped;
}

export async function updateCalendarAgendaEvent(id: string, input: CalendarAgendaInput): Promise<CalendarAgendaEvent> {
  const calendar = getCalendarClient();
  const calendarId = getCalendarId();
  const colorId = normalizeColorId(input.color);
  const description =
    typeof input.descripcion === "string"
      ? input.descripcion.trim() || null
      : undefined;
  const isAllDay = input.todo_el_dia !== false;

  const startDateYmd = normalizeYmd(input.fecha);
  const endDateYmdFromInput = normalizeYmd(input.fecha_fin);
  if (!startDateYmd) {
    throw new Error("Fecha de inicio invalida");
  }

  const startHm = normalizeHm(input.hora_inicio) || "09:00";
  const rawEndHm = normalizeHm(input.hora_fin);
  const endHm = rawEndHm || plusOneHour(startHm);
  const endDateYmd = endDateYmdFromInput || startDateYmd;

  const startDateTime = toDateTimeWithOffset(startDateYmd, startHm);
  let endDateTime = toDateTimeWithOffset(endDateYmd, endHm);

  if (endDateYmd === startDateYmd && endDateTime <= startDateTime) {
    endDateTime = toDateTimeWithOffset(endDateYmd, plusOneHour(startHm));
  }

  const response = await calendar.events.update({
    calendarId,
    eventId: id,
    requestBody: {
      summary: input.evento,
      description,
      colorId,
      start: isAllDay
        ? { date: startDateYmd }
        : { dateTime: startDateTime, timeZone: DEFAULT_TIMEZONE },
      end: isAllDay
        ? { date: plusOneDay(endDateYmd) }
        : { dateTime: endDateTime, timeZone: DEFAULT_TIMEZONE },
    },
  });

  const mapped = mapGoogleEventToAgenda({
    id: response.data.id,
    summary: response.data.summary,
    description: response.data.description,
    colorId: response.data.colorId,
    start: response.data.start,
    end: response.data.end,
  });

  if (!mapped) {
    throw new Error("No se pudo mapear el evento actualizado de Google Calendar");
  }

  return mapped;
}

export async function deleteCalendarAgendaEvent(id: string): Promise<void> {
  const calendar = getCalendarClient();
  const calendarId = getCalendarId();

  await calendar.events.delete({
    calendarId,
    eventId: id,
  });
}