-- Add sms_consent column to track TCPA opt-in from estimate form
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS sms_consent BOOLEAN NOT NULL DEFAULT false;
