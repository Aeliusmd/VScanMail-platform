-- Merge email notification capability keys into billing_plans.features (MySQL 8+).
-- Starter: core mail + weekly only (no delivery/deposit/cheque extras).
-- Professional: adds delivery + new_cheque.
-- Enterprise: all notification channels.

UPDATE `billing_plans`
SET `features` = JSON_MERGE_PRESERVE(
  COALESCE(`features`, JSON_ARRAY()),
  CAST(
    '["email_notifications","email_new_mail","email_weekly_summary"]'
    AS JSON
  )
)
WHERE `id` = 'starter';

UPDATE `billing_plans`
SET `features` = JSON_MERGE_PRESERVE(
  COALESCE(`features`, JSON_ARRAY()),
  CAST(
    '["email_notifications","email_new_mail","email_new_cheque","email_delivery","email_weekly_summary"]'
    AS JSON
  )
)
WHERE `id` = 'professional';

UPDATE `billing_plans`
SET `features` = JSON_MERGE_PRESERVE(
  COALESCE(`features`, JSON_ARRAY()),
  CAST(
    '["email_notifications","email_new_mail","email_new_cheque","email_delivery","email_deposit","email_weekly_summary"]'
    AS JSON
  )
)
WHERE `id` = 'enterprise';
