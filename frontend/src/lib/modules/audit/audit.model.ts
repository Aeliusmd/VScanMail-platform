import { db } from "../core/db/mysql";
import { auditLogs } from "../core/db/schema";

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
      createdAt: new Date(),
    };
    await db.insert(auditLogs).values(toInsert);
  },
};
