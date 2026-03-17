-- Fix RLS policies for social_posts, reviews, and review_requests.
-- These tables incorrectly used auth.jwt() ->> 'org_id' which doesn't exist
-- in Supabase JWTs. Replace with public.get_org_id() to match all other tables.

-- ============================================================
-- social_posts: drop broken policies, recreate with get_org_id()
-- ============================================================
DROP POLICY IF EXISTS "org_isolation_select" ON social_posts;
DROP POLICY IF EXISTS "org_isolation_insert" ON social_posts;
DROP POLICY IF EXISTS "org_isolation_update" ON social_posts;
DROP POLICY IF EXISTS "org_isolation_delete" ON social_posts;

CREATE POLICY "Org members can view social posts"
  ON social_posts FOR SELECT
  USING (organization_id = public.get_org_id());

CREATE POLICY "Org editors can insert social posts"
  ON social_posts FOR INSERT
  WITH CHECK (organization_id = public.get_org_id());

CREATE POLICY "Org editors can update social posts"
  ON social_posts FOR UPDATE
  USING (organization_id = public.get_org_id());

CREATE POLICY "Org admins can delete social posts"
  ON social_posts FOR DELETE
  USING (organization_id = public.get_org_id());

-- ============================================================
-- reviews: drop broken policies, recreate with get_org_id()
-- (service_role_all policy is fine, leave it)
-- ============================================================
DROP POLICY IF EXISTS "org_isolation_select" ON reviews;
DROP POLICY IF EXISTS "org_isolation_insert" ON reviews;
DROP POLICY IF EXISTS "org_isolation_update" ON reviews;
DROP POLICY IF EXISTS "org_isolation_delete" ON reviews;

CREATE POLICY "Org members can view reviews"
  ON reviews FOR SELECT
  USING (organization_id = public.get_org_id());

CREATE POLICY "Org editors can insert reviews"
  ON reviews FOR INSERT
  WITH CHECK (organization_id = public.get_org_id());

CREATE POLICY "Org editors can update reviews"
  ON reviews FOR UPDATE
  USING (organization_id = public.get_org_id());

CREATE POLICY "Org admins can delete reviews"
  ON reviews FOR DELETE
  USING (organization_id = public.get_org_id());

-- ============================================================
-- review_requests: drop broken policies, recreate with get_org_id()
-- (service_role_all policy is fine, leave it)
-- ============================================================
DROP POLICY IF EXISTS "org_isolation_select" ON review_requests;
DROP POLICY IF EXISTS "org_isolation_insert" ON review_requests;
DROP POLICY IF EXISTS "org_isolation_update" ON review_requests;
DROP POLICY IF EXISTS "org_isolation_delete" ON review_requests;

CREATE POLICY "Org members can view review requests"
  ON review_requests FOR SELECT
  USING (organization_id = public.get_org_id());

CREATE POLICY "Org editors can insert review requests"
  ON review_requests FOR INSERT
  WITH CHECK (organization_id = public.get_org_id());

CREATE POLICY "Org editors can update review requests"
  ON review_requests FOR UPDATE
  USING (organization_id = public.get_org_id());

CREATE POLICY "Org admins can delete review requests"
  ON review_requests FOR DELETE
  USING (organization_id = public.get_org_id());
