-- Lead attribution + first-party marketing events
--
-- leads.discovery_source — customer-reported "How did you hear about us?"
-- leads.attribution      — observed first-touch data: landing path, referrer
--                          host, UTM tags, gclid flag, classified channel.
--                          Never contains names, emails, phone numbers, or
--                          full referrer URLs.
-- marketing_events       — anonymous conversion events from the public site
--                          (currently: call_click). No PII.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS discovery_source TEXT,
  ADD COLUMN IF NOT EXISTS attribution JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_leads_discovery_source ON leads(discovery_source);
CREATE INDEX IF NOT EXISTS idx_leads_attribution_channel ON leads((attribution ->> 'channel'));

CREATE TABLE IF NOT EXISTS marketing_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('call_click')),
  page_path TEXT,
  link_location TEXT,
  channel TEXT,
  attribution JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketing_events_org_created
  ON marketing_events(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketing_events_org_type
  ON marketing_events(organization_id, event_type);

-- Inserts come only from the public events API using the service role, so
-- there is intentionally no INSERT policy. Org members can read their events.
ALTER TABLE marketing_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "marketing_events_org_select" ON marketing_events
  FOR SELECT USING (organization_id = public.get_org_id());
