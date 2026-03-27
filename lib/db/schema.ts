import {
  mysqlTable,
  varchar,
  text,
  boolean,
  json,
  datetime,
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
    id: varchar("id", { length: 36 }).primaryKey(), // uuid
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    emailVerifiedAt: datetime("email_verified_at", { mode: "date" }),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
  },
  (t) => [uniqueIndex("users_email_uq").on(t.email)]
);

export const profiles = mysqlTable(
  "profiles",
  {
    id: varchar("id", { length: 36 }).primaryKey(), // uuid
    userId: varchar("user_id", { length: 36 }).notNull(),
    role: mysqlEnum("role", ["admin", "operator", "client"]).notNull(),
    clientId: varchar("client_id", { length: 36 }),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
  },
  (t) => [
    uniqueIndex("profiles_user_uq").on(t.userId),
    index("profiles_client_idx").on(t.clientId),
  ]
);

export const emailVerifications = mysqlTable(
  "email_verifications",
  {
    id: varchar("id", { length: 36 }).primaryKey(), // uuid
    email: varchar("email", { length: 255 }).notNull(),
    otp: varchar("otp", { length: 16 }).notNull(),
    expiresAt: datetime("expires_at", { mode: "date" }).notNull(),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
  },
  (t) => [index("email_verifications_email_idx").on(t.email)]
);

// --- Business ---
export const clients = mysqlTable(
  "clients",
  {
    id: varchar("id", { length: 36 }).primaryKey(), // uuid (matches users.id for client accounts)
    clientCode: varchar("client_code", { length: 32 }).notNull(),
    companyName: varchar("company_name", { length: 255 }).notNull(),
    registrationNo: varchar("registration_no", { length: 128 }),
    industry: varchar("industry", { length: 128 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 64 }).notNull(),
    addressJson: json("address_json").notNull(),
    stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
    planType: mysqlEnum("plan_type", ["subscription", "topup"]).notNull(),
    planTier: mysqlEnum("plan_tier", ["starter", "professional", "enterprise"]),
    walletBalance: decimal("wallet_balance", { precision: 12, scale: 2 })
      .notNull()
      .default("0"),
    status: mysqlEnum("status", ["active", "suspended", "pending"])
      .notNull()
      .default("pending"),
    twoFaEnabled: boolean("two_fa_enabled").notNull().default(false),
    twoFaSecret: varchar("two_fa_secret", { length: 255 }),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
  },
  (t) => [
    uniqueIndex("clients_client_code_uq").on(t.clientCode),
    index("clients_email_idx").on(t.email),
  ]
);

export const mailItems = mysqlTable(
  "mail_items",
  {
    id: varchar("id", { length: 36 }).primaryKey(), // uuid
    clientId: varchar("client_id", { length: 36 }).notNull(),
    irn: varchar("irn", { length: 128 }).notNull(),
    type: mysqlEnum("type", ["letter", "cheque", "package", "legal"]).notNull(),
    envelopeFrontUrl: text("envelope_front_url").notNull(),
    envelopeBackUrl: text("envelope_back_url").notNull(),
    contentScanUrls: json("content_scan_urls").notNull(), // string[]
    tamperDetected: boolean("tamper_detected").notNull().default(false),
    tamperAnnotations: json("tamper_annotations"),
    ocrText: text("ocr_text"),
    aiSummary: text("ai_summary"),
    aiActions: json("ai_actions"),
    aiRiskLevel: mysqlEnum("ai_risk_level", [
      "low",
      "medium",
      "high",
      "critical",
    ]),
    retentionUntil: datetime("retention_until", { mode: "date" }).notNull(),
    scannedBy: varchar("scanned_by", { length: 36 }).notNull(),
    scannedAt: datetime("scanned_at", { mode: "date" }).notNull(),
    status: mysqlEnum("status", [
      "received",
      "scanned",
      "processed",
      "delivered",
    ])
      .notNull()
      .default("received"),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
  },
  (t) => [
    index("mail_items_client_idx").on(t.clientId),
    index("mail_items_scanned_at_idx").on(t.scannedAt),
    uniqueIndex("mail_items_irn_uq").on(t.irn),
  ]
);

export const cheques = mysqlTable(
  "cheques",
  {
    id: varchar("id", { length: 36 }).primaryKey(), // uuid
    mailItemId: varchar("mail_item_id", { length: 36 }).notNull(),
    amountFigures: decimal("amount_figures", { precision: 12, scale: 2 }).notNull(),
    amountWords: varchar("amount_words", { length: 255 }).notNull(),
    amountsMatch: boolean("amounts_match").notNull().default(false),
    dateOnCheque: varchar("date_on_cheque", { length: 64 }).notNull(),
    dateValid: boolean("date_valid").notNull().default(false),
    beneficiary: varchar("beneficiary", { length: 255 }).notNull(),
    beneficiaryMatchScore: decimal("beneficiary_match_score", {
      precision: 6,
      scale: 4,
    }).notNull(),
    signaturePresent: boolean("signature_present").notNull().default(false),
    alterationDetected: boolean("alteration_detected").notNull().default(false),
    crossingPresent: boolean("crossing_present").notNull().default(false),
    aiConfidence: decimal("ai_confidence", { precision: 6, scale: 4 }).notNull(),
    aiRawResult: json("ai_raw_result").notNull(),
    clientDecision: mysqlEnum("client_decision", ["pending", "approved", "rejected"])
      .notNull()
      .default("pending"),
    decidedBy: varchar("decided_by", { length: 36 }),
    decidedAt: datetime("decided_at", { mode: "date" }),
    depositBatchId: varchar("deposit_batch_id", { length: 36 }),
    status: mysqlEnum("status", [
      "validated",
      "flagged",
      "approved",
      "deposited",
      "cleared",
    ])
      .notNull()
      .default("validated"),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
  },
  (t) => [
    index("cheques_mail_item_idx").on(t.mailItemId),
    index("cheques_deposit_batch_idx").on(t.depositBatchId),
    index("cheques_client_decision_idx").on(t.clientDecision),
  ]
);

export const depositBatches = mysqlTable(
  "deposit_batches",
  {
    id: varchar("id", { length: 36 }).primaryKey(), // uuid
    batchDate: varchar("batch_date", { length: 10 }).notNull(), // YYYY-MM-DD
    totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
    chequeCount: int("cheque_count").notNull(),
    bankReference: varchar("bank_reference", { length: 255 }),
    depositSlipUrl: text("deposit_slip_url"),
    status: mysqlEnum("status", ["pending", "deposited", "confirmed"])
      .notNull()
      .default("pending"),
    createdBy: varchar("created_by", { length: 36 }).notNull(),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
  },
  (t) => [index("deposit_batches_batch_date_idx").on(t.batchDate)]
);

export const subscriptions = mysqlTable(
  "subscriptions",
  {
    id: varchar("id", { length: 36 }).primaryKey(), // uuid
    clientId: varchar("client_id", { length: 36 }).notNull(),
    stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }).notNull(),
    planTier: varchar("plan_tier", { length: 64 }).notNull(),
    status: mysqlEnum("status", ["active", "past_due", "canceled", "trialing"]).notNull(),
    currentPeriodStart: datetime("current_period_start", { mode: "date" }).notNull(),
    currentPeriodEnd: datetime("current_period_end", { mode: "date" }).notNull(),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
  },
  (t) => [
    uniqueIndex("subscriptions_stripe_sub_uq").on(t.stripeSubscriptionId),
    index("subscriptions_client_idx").on(t.clientId),
  ]
);

export const usageEvents = mysqlTable(
  "usage_events",
  {
    id: varchar("id", { length: 36 }).primaryKey(), // uuid
    clientId: varchar("client_id", { length: 36 }).notNull(),
    eventType: varchar("event_type", { length: 64 }).notNull(),
    quantity: int("quantity").notNull(),
    unitCost: decimal("unit_cost", { precision: 12, scale: 2 }).notNull(),
    totalCost: decimal("total_cost", { precision: 12, scale: 2 }).notNull(),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
  },
  (t) => [
    index("usage_events_client_idx").on(t.clientId),
    index("usage_events_created_at_idx").on(t.createdAt),
  ]
);

export const invoices = mysqlTable(
  "invoices",
  {
    id: varchar("id", { length: 36 }).primaryKey(), // uuid
    clientId: varchar("client_id", { length: 36 }).notNull(),
    stripeInvoiceId: varchar("stripe_invoice_id", { length: 255 }).notNull(),
    amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
    pdfUrl: text("pdf_url"),
    status: varchar("status", { length: 64 }).notNull(),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
  },
  (t) => [
    uniqueIndex("invoices_stripe_invoice_uq").on(t.stripeInvoiceId),
    index("invoices_client_idx").on(t.clientId),
  ]
);

export const auditLogs = mysqlTable(
  "audit_logs",
  {
    id: varchar("id", { length: 36 }).primaryKey(), // uuid
    actorId: varchar("actor_id", { length: 36 }).notNull(),
    action: varchar("action", { length: 128 }).notNull(),
    entityType: varchar("entity_type", { length: 64 }).notNull(),
    entityId: varchar("entity_id", { length: 36 }).notNull(),
    details: json("details").notNull(),
    ipAddress: varchar("ip_address", { length: 64 }),
    createdAt: datetime("created_at", { mode: "date" }).notNull(),
  },
  (t) => [
    index("audit_logs_actor_idx").on(t.actorId),
    index("audit_logs_entity_idx").on(t.entityType, t.entityId),
    index("audit_logs_created_at_idx").on(t.createdAt),
  ]
);

