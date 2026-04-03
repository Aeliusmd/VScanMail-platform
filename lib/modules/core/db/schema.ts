import {
  mysqlTable,
  varchar,
  text,
  boolean,
  json,
  datetime,
  date,
  decimal,
  int,
  mysqlEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/mysql-core";

// --- Auth / RBAC ---
export const users = mysqlTable(
  "users",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    emailVerifiedAt: datetime("email_verified_at", { mode: "date" }),
    fullName: varchar("full_name", { length: 255 }),
    phone: varchar("phone", { length: 64 }),
    lastLoginAt: datetime("last_login_at", { mode: "date" }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
    updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
  },
  (t) => [uniqueIndex("users_email_uq").on(t.email)]
);

export const profiles = mysqlTable(
  "profiles",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 }).notNull(),
    role: mysqlEnum("role", ["super_admin", "admin", "client"]).notNull(),
    clientId: varchar("client_id", { length: 36 }),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
    updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
  },
  (t) => [
    uniqueIndex("profiles_user_uq").on(t.userId),
    index("profiles_client_idx").on(t.clientId),
    index("profiles_role_idx").on(t.role),
  ]
);

export const emailVerifications = mysqlTable(
  "email_verifications",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    otp: varchar("otp", { length: 16 }).notNull(),
    expiresAt: datetime("expires_at", { mode: "date" }).notNull(),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
  },
  (t) => [index("ev_email_idx").on(t.email)]
);

export const passwordResets = mysqlTable(
  "password_resets",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    userId: varchar("user_id", { length: 36 }).notNull(),
    token: varchar("token", { length: 128 }).notNull(),
    expiresAt: datetime("expires_at", { mode: "date" }).notNull(),
    used: boolean("used").notNull().default(false),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
  },
  (t) => [
    uniqueIndex("pr_token_uq").on(t.token),
    index("pr_user_idx").on(t.userId),
  ]
);

// --- Business ---
export const clients = mysqlTable(
  "clients",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    clientCode: varchar("client_code", { length: 32 }).notNull(),
    tableName: varchar("table_name", { length: 64 }).notNull(),
    companyName: varchar("company_name", { length: 255 }).notNull(),
    registrationNo: varchar("registration_no", { length: 128 }),
    industry: varchar("industry", { length: 128 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 64 }).notNull(),
    addressJson: json("address_json").notNull(),
    clientType: mysqlEnum("client_type", ["subscription", "manual"]).notNull().default("subscription"),
    status: mysqlEnum("status", ["active", "suspended", "pending", "inactive"]).notNull().default("pending"),
    twoFaEnabled: boolean("two_fa_enabled").notNull().default(false),
    twoFaSecret: varchar("two_fa_secret", { length: 255 }),
    addedBy: varchar("added_by", { length: 36 }),
    notes: text("notes"),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
    updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
  },
  (t) => [
    uniqueIndex("clients_code_uq").on(t.clientCode),
    uniqueIndex("clients_table_name_uq").on(t.tableName),
    uniqueIndex("clients_email_uq").on(t.email),
    index("clients_status_idx").on(t.status),
    index("clients_type_idx").on(t.clientType),
    index("clients_added_by_idx").on(t.addedBy),
  ]
);

// --- Billing Tables ---
export const subscriptions = mysqlTable(
  "subscriptions",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    clientId: varchar("client_id", { length: 36 }).notNull(),
    stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
    stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
    planTier: mysqlEnum("plan_tier", ["starter", "professional", "enterprise"]).notNull(),
    monthlyAmount: decimal("monthly_amount", { precision: 12, scale: 2 }).notNull().default("0.00"),
    status: mysqlEnum("status", ["active", "past_due", "canceled", "trialing", "paused"]).notNull().default("trialing"),
    currentPeriodStart: datetime("current_period_start", { mode: "date" }).notNull(),
    currentPeriodEnd: datetime("current_period_end", { mode: "date" }).notNull(),
    canceledAt: datetime("canceled_at", { mode: "date" }),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
    updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
  },
  (t) => [
    uniqueIndex("sub_stripe_uq").on(t.stripeSubscriptionId),
    index("sub_client_idx").on(t.clientId),
    index("sub_status_idx").on(t.status),
  ]
);

export const manualPayments = mysqlTable(
  "manual_payments",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    clientId: varchar("client_id", { length: 36 }).notNull(),
    recordedBy: varchar("recorded_by", { length: 36 }).notNull(),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    paymentMethod: mysqlEnum("payment_method", ["cash", "bank_transfer", "cheque", "other"]).notNull().default("other"),
    referenceNo: varchar("reference_no", { length: 255 }),
    receiptUrl: varchar("receipt_url", { length: 500 }),
    notes: text("notes"),
    paymentDate: date("payment_date", { mode: "date" }).notNull(),
    periodCovered: mysqlEnum("period_covered", ["monthly", "quarterly", "annual", "custom"]).notNull().default("monthly"),
    periodStart: date("period_start", { mode: "date" }).notNull(),
    periodEnd: date("period_end", { mode: "date" }).notNull(),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
  },
  (t) => [
    index("mp_client_idx").on(t.clientId),
    index("mp_recorder_idx").on(t.recordedBy),
    index("mp_date_idx").on(t.paymentDate),
  ]
);

// --- Usage & Audit Tables ---
export const usageEvents = mysqlTable(
  "usage_events",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    clientId: varchar("client_id", { length: 36 }).notNull(),
    eventType: mysqlEnum("event_type", ["scan", "ai_analysis", "storage", "api_call"]).notNull(),
    quantity: int("quantity").notNull().default(1),
    unitCost: decimal("unit_cost", { precision: 12, scale: 2 }).notNull().default("0.00"),
    totalCost: decimal("total_cost", { precision: 12, scale: 2 }).notNull().default("0.00"),
    triggeredBy: varchar("triggered_by", { length: 36 }),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
  },
  (t) => [
    index("ue_client_idx").on(t.clientId),
    index("ue_type_idx").on(t.eventType),
    index("ue_created_idx").on(t.createdAt),
  ]
);

export const auditLogs = mysqlTable(
  "audit_logs",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    actorId: varchar("actor_id", { length: 36 }).notNull(),
    actorRole: mysqlEnum("actor_role", ["super_admin", "admin", "client"]).notNull(),
    action: varchar("action", { length: 128 }).notNull(),
    entityType: varchar("entity_type", { length: 64 }).notNull(),
    entityId: varchar("entity_id", { length: 36 }).notNull(),
    beforeState: json("before_state"),
    afterState: json("after_state"),
    ipAddress: varchar("ip_address", { length: 64 }),
    userAgent: varchar("user_agent", { length: 255 }),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
  },
  (t) => [
    index("al_actor_idx").on(t.actorId),
    index("al_role_idx").on(t.actorRole),
    index("al_entity_idx").on(t.entityType, t.entityId),
    index("al_action_idx").on(t.action),
    index("al_created_idx").on(t.createdAt),
  ]
);
