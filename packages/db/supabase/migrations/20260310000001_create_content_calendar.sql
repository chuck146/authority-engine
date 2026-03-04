-- Content calendar for scheduling content publishing.
-- Tracks scheduled, in-progress, and completed publish events.

create table public.content_calendar (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  content_type text not null check (content_type in ('service_page', 'location_page', 'blog_post')),
  content_id uuid not null,
  scheduled_at timestamptz not null,
  published_at timestamptz,
  status text not null default 'scheduled' check (status in ('scheduled', 'publishing', 'published', 'failed', 'cancelled')),
  error_message text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index idx_content_calendar_org on public.content_calendar(organization_id);
create index idx_content_calendar_scheduled on public.content_calendar(scheduled_at) where status = 'scheduled';

-- Prevent double-scheduling: only one active schedule per content item
create unique index idx_content_calendar_active on public.content_calendar(organization_id, content_type, content_id)
  where status in ('scheduled', 'publishing');

-- Updated_at trigger
create trigger on_content_calendar_updated
  before update on public.content_calendar
  for each row execute function public.handle_updated_at();

-- RLS
alter table public.content_calendar enable row level security;

create policy "Org members can view calendar entries"
  on public.content_calendar for select
  using (organization_id = public.get_org_id());

create policy "Org editors can insert calendar entries"
  on public.content_calendar for insert
  with check (organization_id = public.get_org_id());

create policy "Org editors can update calendar entries"
  on public.content_calendar for update
  using (organization_id = public.get_org_id());

create policy "Org admins can delete calendar entries"
  on public.content_calendar for delete
  using (organization_id = public.get_org_id());
