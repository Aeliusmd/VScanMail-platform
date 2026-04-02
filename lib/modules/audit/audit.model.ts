import { db } from "../core/db/mysql";
import { auditLogs } from "../core/db/schema";

export type AuditLog = {
  id: string;
  actor_id: string;
  actor_role: "super_admin" | "admin" | "client";
  action: string;
  entity_type: string;
  entity_id: string;
  details: any;
  ip_address: string | null;
  created_at: string;
};

export const auditLogModel = {
  async append(data: Omit<AuditLog, "id" | "created_at">) {
    const toInsert: typeof auditLogs.$inferInsert = {
      id: crypto.randomUUID(),
      actorId: data.actor_id,
      actorRole: data.actor_role,
      action: data.action,
      entityType: data.entity_type,
      entityId: data.entity_id,
      afterState: data.details ?? {},
      ipAddress: data.ip_address ?? undefined,
      createdAt: new Date(),
    };
    await db.insert(auditLogs).values(toInsert);
  },
};
