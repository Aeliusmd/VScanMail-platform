-- ============================================================
-- VScanMail — Seed Data (development only)
-- ============================================================

-- NOTE: Create auth users via Supabase dashboard or CLI first,
-- then reference their UUIDs below.

-- Example admin profile (replace UUID with actual auth user ID)
-- INSERT INTO profiles (user_id, role) VALUES
--   ('YOUR-ADMIN-AUTH-USER-UUID', 'admin');

-- Example operator profile
-- INSERT INTO profiles (user_id, role) VALUES
--   ('YOUR-OPERATOR-AUTH-USER-UUID', 'operator');

-- Example test client
-- INSERT INTO clients (
--   id, client_code, company_name, registration_no, industry,
--   email, phone, address_json, plan_type, plan_tier, status
-- ) VALUES (
--   'YOUR-CLIENT-AUTH-USER-UUID',
--   'VSM-TEST1',
--   'Test Company Ltd',
--   'REG-12345',
--   'Technology',
--   'test@example.com',
--   '+94771234567',
--   '{"street": "123 Test St", "city": "Colombo", "state": "Western", "zip": "10100", "country": "LK"}',
--   'subscription',
--   'professional',
--   'active'
-- );

-- INSERT INTO profiles (user_id, role, client_id) VALUES
--   ('YOUR-CLIENT-AUTH-USER-UUID', 'client', 'YOUR-CLIENT-AUTH-USER-UUID');
