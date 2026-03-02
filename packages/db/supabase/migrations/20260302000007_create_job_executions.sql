-- Background job logs for BullMQ (content generation, image gen, SEO audits)

create type public.job_status as enum ('queued', 'processing', 'completed', 'failed', 'cancelled');

create table public.job_executions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  queue_name text not null,
  job_type text not null,
  status public.job_status not null default 'queued',
  payload jsonb not null default '{}'::jsonb,
  result jsonb,
  error_message text,
  attempts integer not null default 0,
  max_attempts integer not null default 3,
  started_at timestamptz,
  completed_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index idx_job_executions_org on public.job_executions(organization_id);
create index idx_job_executions_status on public.job_executions(organization_id, status);
create index idx_job_executions_queue on public.job_executions(queue_name, status);

alter table public.job_executions enable row level security;
