-- Remove anonymous INSERT on leads
--
-- "leads_public_insert" (20260314000001) let anyone holding the public anon key
-- insert rows into leads for any organization through PostgREST, bypassing the
-- estimate API's rate limit, honeypot, Zod validation and server-side
-- attribution. The estimate form posts to /api/v1/leads, which inserts with the
-- service role (RLS does not apply), so no code path needs this policy.
--
-- Rollback:
--   CREATE POLICY "leads_public_insert" ON leads FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "leads_public_insert" ON leads;
