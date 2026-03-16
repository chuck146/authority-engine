-- Expand leads table with assignment, scoring, and pipeline fields
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'website'
    CHECK (source IN ('website', 'phone', 'referral', 'gbp', 'facebook', 'other')),
  ADD COLUMN IF NOT EXISTS score INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS score_label TEXT
    CHECK (score_label IN ('hot', 'warm', 'cold')),
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS contacted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS close_reason TEXT
    CHECK (close_reason IN ('won', 'lost_price', 'lost_competitor', 'lost_no_response', 'lost_other'));

-- Expand status CHECK constraint: new | contacted | qualified | proposed | won | lost
-- Drop old constraint and add new one
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE leads ADD CONSTRAINT leads_status_check
  CHECK (status IN ('new', 'contacted', 'qualified', 'proposed', 'won', 'lost'));

-- Migrate any existing 'closed' rows to 'won'
UPDATE leads SET status = 'won' WHERE status = 'closed';

-- New indexes
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_updated_at ON leads(updated_at DESC);

-- Lead activities table
CREATE TABLE IF NOT EXISTS lead_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'note', 'status_change', 'sms_sent', 'sms_received',
    'email_sent', 'email_received', 'phone_call',
    'assignment_change', 'score_change', 'followup_triggered',
    'ai_call', 'ai_text'
  )),
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX idx_lead_activities_organization_id ON lead_activities(organization_id);
CREATE INDEX idx_lead_activities_created_at ON lead_activities(created_at DESC);

-- RLS for lead_activities
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_activities_org_select" ON lead_activities
  FOR SELECT USING (
    organization_id IN (
      SELECT uo.organization_id FROM user_organizations uo
      WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY "lead_activities_org_insert" ON lead_activities
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT uo.organization_id FROM user_organizations uo
      WHERE uo.user_id = auth.uid()
    )
  );

-- Lead followups table
CREATE TABLE IF NOT EXISTS lead_followups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  sequence_name TEXT NOT NULL,
  step_number INTEGER NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('sms', 'email')),
  message_template TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'cancelled', 'failed')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_lead_followups_lead_id ON lead_followups(lead_id);
CREATE INDEX idx_lead_followups_pending ON lead_followups(status, scheduled_at) WHERE status = 'pending';

-- RLS for lead_followups
ALTER TABLE lead_followups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_followups_org_select" ON lead_followups
  FOR SELECT USING (
    organization_id IN (
      SELECT uo.organization_id FROM user_organizations uo
      WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY "lead_followups_org_insert" ON lead_followups
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT uo.organization_id FROM user_organizations uo
      WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY "lead_followups_org_update" ON lead_followups
  FOR UPDATE USING (
    organization_id IN (
      SELECT uo.organization_id FROM user_organizations uo
      WHERE uo.user_id = auth.uid()
    )
  );
