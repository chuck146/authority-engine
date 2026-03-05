-- Review requests table for outbound review solicitations (SMS/email)
CREATE TABLE review_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'email')),
  review_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'completed', 'failed')),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  review_id UUID REFERENCES reviews(id),
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE review_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation_select" ON review_requests
  FOR SELECT USING (organization_id = (auth.jwt() ->> 'org_id')::uuid);

CREATE POLICY "org_isolation_insert" ON review_requests
  FOR INSERT WITH CHECK (organization_id = (auth.jwt() ->> 'org_id')::uuid);

CREATE POLICY "org_isolation_update" ON review_requests
  FOR UPDATE USING (organization_id = (auth.jwt() ->> 'org_id')::uuid);

CREATE POLICY "org_isolation_delete" ON review_requests
  FOR DELETE USING (organization_id = (auth.jwt() ->> 'org_id')::uuid);

-- Service role bypass
CREATE POLICY "service_role_all" ON review_requests
  FOR ALL USING (auth.role() = 'service_role');

-- Indexes
CREATE INDEX idx_review_requests_org ON review_requests(organization_id);
CREATE INDEX idx_review_requests_status ON review_requests(status);
