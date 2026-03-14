-- Leads table for free estimate requests (public form submissions)
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  service TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_leads_organization_id ON leads(organization_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);

-- RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Public INSERT: anyone can submit a lead (no auth required)
CREATE POLICY "leads_public_insert" ON leads
  FOR INSERT WITH CHECK (true);

-- Org-scoped SELECT: authenticated users can read their org's leads
CREATE POLICY "leads_org_select" ON leads
  FOR SELECT USING (
    organization_id IN (
      SELECT uo.organization_id FROM user_organizations uo
      WHERE uo.user_id = auth.uid()
    )
  );

-- Org-scoped UPDATE: authenticated users can update their org's leads (status changes)
CREATE POLICY "leads_org_update" ON leads
  FOR UPDATE USING (
    organization_id IN (
      SELECT uo.organization_id FROM user_organizations uo
      WHERE uo.user_id = auth.uid()
    )
  );
