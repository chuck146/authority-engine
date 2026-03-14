-- Add county column to location_pages for grouping by county

ALTER TABLE public.location_pages ADD COLUMN county text;

CREATE INDEX idx_location_pages_county ON public.location_pages(organization_id, county);
