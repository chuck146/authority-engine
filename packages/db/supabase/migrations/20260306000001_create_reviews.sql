-- Reviews table for aggregated reviews from Google, Yelp, Angi's, and manual entries
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('google', 'yelp', 'angi', 'manual')),
  external_id TEXT,
  reviewer_name TEXT NOT NULL,
  reviewer_profile_url TEXT,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  review_date TIMESTAMPTZ NOT NULL,
  response_text TEXT,
  response_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (response_status IN ('pending', 'draft', 'review', 'approved', 'sent', 'archived')),
  response_generated_at TIMESTAMPTZ,
  response_approved_by UUID,
  response_approved_at TIMESTAMPTZ,
  response_sent_at TIMESTAMPTZ,
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', 'mixed')),
  sentiment_score NUMERIC(3,2),
  metadata JSONB DEFAULT '{}',
  synced_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, platform, external_id)
);

-- RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation_select" ON reviews
  FOR SELECT USING (organization_id = (auth.jwt() ->> 'org_id')::uuid);

CREATE POLICY "org_isolation_insert" ON reviews
  FOR INSERT WITH CHECK (organization_id = (auth.jwt() ->> 'org_id')::uuid);

CREATE POLICY "org_isolation_update" ON reviews
  FOR UPDATE USING (organization_id = (auth.jwt() ->> 'org_id')::uuid);

CREATE POLICY "org_isolation_delete" ON reviews
  FOR DELETE USING (organization_id = (auth.jwt() ->> 'org_id')::uuid);

-- Service role bypass
CREATE POLICY "service_role_all" ON reviews
  FOR ALL USING (auth.role() = 'service_role');

-- Indexes
CREATE INDEX idx_reviews_org ON reviews(organization_id);
CREATE INDEX idx_reviews_platform ON reviews(platform);
CREATE INDEX idx_reviews_response_status ON reviews(response_status);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_review_date ON reviews(review_date DESC);
CREATE INDEX idx_reviews_external ON reviews(organization_id, platform, external_id);
