import { db } from "../core/db/mysql";
import { auditLogs } from "../core/db/schema";
import { and, desc, eq, isNotNull } from "drizzle-orm";

export type AuditLog = {
  id: string;
  actor_id: string;
  actor_role: "super_admin" | "admin" | "client" | "operator";
  action: string;
  entity_type: string;
  entity_id: string;
  client_id?: string | null;
  before_state?: any;
  after_state?: any;
  ip_address: string | null;
  user_agent: string | null;
  notif_recipient_id?: string | null;
  notif_is_read?: boolean;
  notif_title?: string | null;
  notif_target_url?: string | null;
  created_at: string;
};

export const auditLogModel = {
  async append(data: Omit<AuditLog, "id" | "created_at">) {
    const toInsert: typeof auditLogs.$inferInsert = {
      id: crypto.randomUUID(),
      actorId: data.actor_id,
      actorRole: data.actor_role as any,
      action: data.action,

      entityType: data.entity_type,
      entityId: data.entity_id,
      clientId: data.client_id ?? null,
      beforeState: data.before_state ?? null,
      afterState: data.after_state ?? null,
      ipAddress: data.ip_address ?? null,
      userAgent: data.user_agent ?? null,
      notifRecipientId: data.notif_recipient_id ?? null,
      notifIsRead: data.notif_is_read ?? false,
      notifTitle: data.notif_title ?? null,
      notifTargetUrl: data.notif_target_url ?? null,
      createdAt: new Date(),
    };
    await db.insert(auditLogs).values(toInsert);
  },
  async listNotificationsForUser(userId: string, limit = 20) {
    const rows = await db
      .select()
      .from(auditLogs)
      .where(and(eq(auditLogs.notifRecipientId, userId), isNotNull(auditLogs.notifTitle)))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);

    return rows;
  },
  async markNotificationRead(id: string, userId: string) {
    await db
      .update(auditLogs)
      .set({ notifIsRead: true })
      .where(and(eq(auditLogs.id, id), eq(auditLogs.notifRecipientId, userId)));
  },
  async markAllNotificationsRead(userId: string) {
    await db.update(auditLogs).set({ notifIsRead: true }).where(eq(auditLogs.notifRecipientId, userId));
  },
};
