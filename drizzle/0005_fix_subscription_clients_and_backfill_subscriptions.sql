-- Fix: revert accidental client_type overwrites (subscription -> manual)
-- and backfill missing subscriptions rows for subscription clients.
--
-- Context: a frontend edit flow previously sent `clientType: 'manual'` on PATCH,
-- causing subscribed orgs to be mislabeled as MANUAL and breaking planTier display.
--
-- This migration is safe/idempotent:
-- - It only reverts client_type when audit logs explicitly show subscription -> manual.
-- - It only inserts subscriptions rows when none exist for that client.

-- 1) Revert accidental client_type overwrite using audit logs (JSON).
UPDATE clients c
JOIN (
  SELECT DISTINCT entity_id
  FROM audit_logs
  WHERE entity_type = 'client'
    AND action = 'client.updated'
    AND JSON_UNQUOTE(JSON_EXTRACT(before_state, '$.client_type')) = 'subscription'
    AND JSON_UNQUOTE(JSON_EXTRACT(after_state, '$.client_type')) = 'manual'
) t ON t.entity_id = c.id
SET c.client_type = 'subscription'
WHERE c.client_type = 'manual';

-- 2) Backfill subscriptions row for any subscription client missing one.
-- Note: plan_tier defaulted to 'starter' when unknown.
INSERT INTO subscriptions (
  id,
  client_id,
  stripe_customer_id,
  stripe_subscription_id,
  plan_tier,
  monthly_amount,
  status,
  current_period_start,
  current_period_end,
  canceled_at,
  created_at,
  updated_at
)
SELECT
  UUID(),
  c.id,
  NULL,
  NULL,
  'starter',
  0.00,
  'active',
  NOW(),
  DATE_ADD(NOW(), INTERVAL 1 MONTH),
  NULL,
  NOW(),
  NOW()
FROM clients c
LEFT JOIN subscriptions s ON s.client_id = c.id
WHERE c.client_type = 'subscription'
  AND s.id IS NULL;

