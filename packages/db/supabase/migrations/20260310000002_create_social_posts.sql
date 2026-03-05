-- Social posts table for GBP, Instagram, and Facebook content
CREATE TABLE social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('gbp', 'instagram', 'facebook')),
  post_type TEXT NOT NULL DEFAULT 'update',
  title TEXT,
  body TEXT NOT NULL,
  hashtags TEXT[] DEFAULT '{}',
  cta_type TEXT,
  cta_url TEXT,
  media_asset_id UUID REFERENCES media_assets(id),
  status TEXT NOT NULL DEFAULT 'review'
    CHECK (status IN ('draft', 'review', 'approved', 'published', 'archived')),
  keywords TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  published_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation_select" ON social_posts
  FOR SELECT USING (organization_id = (auth.jwt() ->> 'org_id')::uuid);

CREATE POLICY "org_isolation_insert" ON social_posts
  FOR INSERT WITH CHECK (organization_id = (auth.jwt() ->> 'org_id')::uuid);

CREATE POLICY "org_isolation_update" ON social_posts
  FOR UPDATE USING (organization_id = (auth.jwt() ->> 'org_id')::uuid);

CREATE POLICY "org_isolation_delete" ON social_posts
  FOR DELETE USING (organization_id = (auth.jwt() ->> 'org_id')::uuid);

-- Indexes
CREATE INDEX idx_social_posts_org ON social_posts(organization_id);
CREATE INDEX idx_social_posts_platform ON social_posts(platform);
CREATE INDEX idx_social_posts_status ON social_posts(status);
