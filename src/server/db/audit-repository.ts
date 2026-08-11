import "server-only";

import type { AuthUser } from "@/server/db/auth-repository";
import { ensureSchemaInitialized, getTursoClient } from "@/server/db/turso";

export type AuditEvent = {
  actor: Pick<AuthUser, "id" | "email">;
  action: string;
  entityType: string;
  entityId?: string | number | null;
  area?: string | null;
  metadata?: Record<string, unknown>;
};

function safeMetadata(metadata: Record<string, unknown> | undefined) {
  if (!metadata) return null;
  // Evita que una llamada futura agregue secretos de forma accidental.
  const blocked = /password|token|secret|authorization|cookie/i;
  const entries = Object.entries(metadata).filter(([key]) => !blocked.test(key));
  return entries.length ? JSON.stringify(Object.fromEntries(entries)) : null;
}

export async function recordAuditEvent(event: AuditEvent) {
  await ensureSchemaInitialized();
  const client = getTursoClient();
  if (!client) throw new Error("Turso no configurado");
  await client.execute({
    sql: `INSERT INTO audit_logs
      (actor_user_id, actor_email, action, entity_type, entity_id, area, metadata_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      event.actor.id,
      event.actor.email,
      event.action,
      event.entityType,
      event.entityId == null ? null : String(event.entityId),
      event.area || null,
      safeMetadata(event.metadata),
    ],
  });
}

export async function listAuditEvents(limit = 100, offset = 0) {
  await ensureSchemaInitialized();
  const client = getTursoClient();
  if (!client) throw new Error("Turso no configurado");
  const result = await client.execute({
    sql: `SELECT id, actor_user_id, actor_email, action, entity_type, entity_id, area, metadata_json, created_at
      FROM audit_logs ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`,
    args: [limit, offset],
  });
  return result.rows.map((row) => ({
    ...row,
    metadata: typeof row.metadata_json === "string" ? JSON.parse(row.metadata_json) : null,
    metadata_json: undefined,
  }));
}
