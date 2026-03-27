-- ============================================================
-- VScanMail — Database Schema Migration
-- Run with: supabase db push
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES (RBAC layer on top of Supabase auth.users)
-- ============================================================
CREATE TABLE profiles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'operator', 'client', 'viewer')),
  client_id   UUID,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- ============================================================
-- CLIENTS
-- ============================================================
CREATE TABLE clients (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_code         VARCHAR(10) NOT NULL UNIQUE,
  company_name        TEXT NOT NULL,
  registration_no     TEXT,
  industry            TEXT NOT NULL,
  email               TEXT NOT NULL UNIQUE,
  phone               TEXT NOT NULL,
  address_json        JSONB NOT NULL DEFAULT '{}',
  stripe_customer_id  TEXT,
  plan_type           TEXT NOT NULL CHECK (plan_type IN ('subscription', 'topup')),
  plan_tier           TEXT CHECK (plan_tier IN ('starter', 'professional', 'enterprise')),
  wallet_balance      DECIMAL(12, 2) NOT NULL DEFAULT 0,
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'suspended', 'pending')),
  two_fa_enabled      BOOLEAN NOT NULL DEFAULT false,
  two_fa_secret       TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_stripe ON clients(stripe_customer_id);

-- ============================================================
-- EMAIL VERIFICATIONS
-- ============================================================
CREATE TABLE email_verifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email       TEXT NOT NULL,
  otp         VARCHAR(6) NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_verifications_email ON email_verifications(email);

-- ============================================================
-- SUBSCRIPTIONS (mirrors Stripe subscription data)
-- ============================================================
CREATE TABLE subscriptions (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id                 UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  stripe_subscription_id    TEXT NOT NULL UNIQUE,
  plan_tier                 TEXT,
  status                    TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'past_due', 'canceled', 'trialing', 'incomplete')),
  current_period_start      TIMESTAMPTZ,
  current_period_end        TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_client ON subscriptions(client_id);

-- ============================================================
-- MAIL ITEMS
-- ============================================================
CREATE TABLE mail_items (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id             UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  irn                   VARCHAR(20) NOT NULL UNIQUE,
  type                  TEXT NOT NULL CHECK (type IN ('letter', 'cheque', 'package', 'legal')),
  envelope_front_url    TEXT,
  envelope_back_url     TEXT,
  content_scan_urls     TEXT[] DEFAULT '{}',
  tamper_detected       BOOLEAN NOT NULL DEFAULT false,
  tamper_annotations    JSONB DEFAULT '{}',
  ocr_text              TEXT,
  ai_summary            TEXT,
  ai_actions            JSONB,
  ai_risk_level         TEXT CHECK (ai_risk_level IN ('low', 'medium', 'high', 'critical')),
  retention_until       DATE,
  scanned_by            UUID,
  scanned_at            TIMESTAMPTZ,
  status                TEXT NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'scanned', 'processed', 'delivered')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mail_items_client ON mail_items(client_id);
CREATE INDEX idx_mail_items_irn ON mail_items(irn);
CREATE INDEX idx_mail_items_status ON mail_items(status);
CREATE INDEX idx_mail_items_type ON mail_items(type);
CREATE INDEX idx_mail_items_retention ON mail_items(retention_until);
CREATE INDEX idx_mail_items_scanned_at ON mail_items(scanned_at);

-- ============================================================
-- CHEQUES
-- ============================================================
CREATE TABLE cheques (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mail_item_id            UUID NOT NULL REFERENCES mail_items(id) ON DELETE CASCADE,
  amount_figures          DECIMAL(12, 2),
  amount_words            TEXT,
  amounts_match           BOOLEAN,
  date_on_cheque          DATE,
  date_valid              BOOLEAN,
  beneficiary             TEXT,
  beneficiary_match_score DECIMAL(5, 4) DEFAULT 0,
  signature_present       BOOLEAN,
  alteration_detected     BOOLEAN DEFAULT false,
  crossing_present        BOOLEAN DEFAULT false,
  ai_confidence           DECIMAL(5, 4) DEFAULT 0,
  ai_raw_result           JSONB,
  client_decision         TEXT NOT NULL DEFAULT 'pending'
    CHECK (client_decision IN ('pending', 'approved', 'rejected')),
  decided_by              UUID,
  decided_at              TIMESTAMPTZ,
  deposit_batch_id        UUID,
  status                  TEXT NOT NULL DEFAULT 'validated'
    CHECK (status IN ('validated', 'flagged', 'approved', 'deposited', 'cleared')),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cheques_mail_item ON cheques(mail_item_id);
CREATE INDEX idx_cheques_status ON cheques(status);
CREATE INDEX idx_cheques_decision ON cheques(client_decision);
CREATE INDEX idx_cheques_batch ON cheques(deposit_batch_id);

-- ============================================================
-- DEPOSIT BATCHES
-- ============================================================
CREATE TABLE deposit_batches (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_date        DATE NOT NULL,
  total_amount      DECIMAL(12, 2) NOT NULL DEFAULT 0,
  cheque_count      INT NOT NULL DEFAULT 0,
  bank_reference    TEXT,
  deposit_slip_url  TEXT,
  status            TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'deposited', 'confirmed')),
  created_by        UUID,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add FK to cheques after deposit_batches exists
ALTER TABLE cheques
  ADD CONSTRAINT fk_cheques_batch
  FOREIGN KEY (deposit_batch_id) REFERENCES deposit_batches(id);

-- ============================================================
-- USAGE EVENTS (billing)
-- ============================================================
CREATE TABLE usage_events (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL,
  quantity    INT NOT NULL DEFAULT 1,
  unit_cost   DECIMAL(10, 4) NOT NULL DEFAULT 0,
  total_cost  DECIMAL(10, 4) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_usage_events_client ON usage_events(client_id);
CREATE INDEX idx_usage_events_type ON usage_events(event_type);
CREATE INDEX idx_usage_events_date ON usage_events(created_at);

-- ============================================================
-- INVOICES
-- ============================================================
CREATE TABLE invoices (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id           UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  stripe_invoice_id   TEXT,
  amount              DECIMAL(12, 2) NOT NULL DEFAULT 0,
  pdf_url             TEXT,
  status              TEXT NOT NULL DEFAULT 'draft',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoices_client ON invoices(client_id);

-- ============================================================
-- AUDIT LOGS (immutable — append only)
-- ============================================================
CREATE TABLE audit_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id      TEXT NOT NULL,
  action        TEXT NOT NULL,
  entity_type   TEXT NOT NULL,
  entity_id     TEXT NOT NULL,
  details       JSONB DEFAULT '{}',
  ip_address    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_date ON audit_logs(created_at);

-- Prevent UPDATE and DELETE on audit_logs (immutable)
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable — updates and deletes are not allowed';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_logs_no_update
  BEFORE UPDATE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

CREATE TRIGGER audit_logs_no_delete
  BEFORE DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

-- ============================================================
-- WALLET BALANCE FUNCTION (atomic update)
-- ============================================================
CREATE OR REPLACE FUNCTION adjust_wallet_balance(
  p_client_id UUID,
  p_amount DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
  new_balance DECIMAL;
BEGIN
  UPDATE clients
  SET wallet_balance = wallet_balance + p_amount,
      updated_at = now()
  WHERE id = p_client_id
  RETURNING wallet_balance INTO new_balance;

  IF new_balance < 0 THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;

  RETURN new_balance;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE mail_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cheques ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Clients: users can only read their own record
CREATE POLICY clients_self_read ON clients
  FOR SELECT USING (id = auth.uid());

-- Mail items: users can only read their own mail
CREATE POLICY mail_items_client_read ON mail_items
  FOR SELECT USING (client_id = auth.uid());

-- Cheques: via mail_items join
CREATE POLICY cheques_client_read ON cheques
  FOR SELECT USING (
    mail_item_id IN (
      SELECT id FROM mail_items WHERE client_id = auth.uid()
    )
  );

-- Subscriptions: own only
CREATE POLICY subscriptions_self_read ON subscriptions
  FOR SELECT USING (client_id = auth.uid());

-- Usage events: own only
CREATE POLICY usage_events_self_read ON usage_events
  FOR SELECT USING (client_id = auth.uid());

-- Invoices: own only
CREATE POLICY invoices_self_read ON invoices
  FOR SELECT USING (client_id = auth.uid());

-- Audit logs: read-only for admins (handled via service role key)
CREATE POLICY audit_logs_insert_only ON audit_logs
  FOR INSERT WITH CHECK (true);

-- Profiles: own only
CREATE POLICY profiles_self_read ON profiles
  FOR SELECT USING (user_id = auth.uid());

-- ============================================================
-- STORAGE BUCKET
-- ============================================================
-- Run in Supabase dashboard or via CLI:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('scans', 'scans', false);
