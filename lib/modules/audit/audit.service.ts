import { auditLogModel } from "./audit.model";

export const auditService = {
  async log(params: {
    actor: string;
    actor_role?: string;
    action: string;
    entity: string;
    before?: any;
    after?: any;
    req?: Request; // Passing the Next.js Request object to auto-extract metadata
    ip?: string;
    userAgent?: string;
  }) {
    // Extract metadata from request if provided
    let ip = params.ip || null;
    let userAgent = params.userAgent || null;

    if (params.req) {
      userAgent = params.req.headers.get("user-agent");
      // Try x-forwarded-for, then Next.js specific ip property, then fallback
      ip = params.req.headers.get("x-forwarded-for")?.split(",")[0] || (params.req as any).ip || "127.0.0.1";
    }


    await auditLogModel.append({
      actor_id: params.actor,
      actor_role: (params.actor_role as any) || "admin",
      action: params.action,
      entity_type: params.action.split(".")[0],
      entity_id: params.entity,
      before_state: params.before || null,
      after_state: params.after || null,
      ip_address: ip,
      user_agent: userAgent,
    });

  },
};

