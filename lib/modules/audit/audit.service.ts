import { auditLogModel } from "./audit.model";

export const auditService = {
  async log(params: {
    actor: string;
    actor_role?: "super_admin" | "admin" | "client";
    action: string;
    entity: string;
    details?: any;
    ip?: string;
  }) {
    await auditLogModel.append({
      actor_id: params.actor,
      actor_role: params.actor_role || "admin", // Default to admin for background/operator tasks
      action: params.action,
      entity_type: params.action.split(".")[0], // e.g., "cheque" from "cheque.approved"
      entity_id: params.entity,
      details: params.details || {},
      ip_address: params.ip || null,
    });
  },
};
