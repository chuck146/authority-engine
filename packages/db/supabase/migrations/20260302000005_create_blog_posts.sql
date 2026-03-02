-- AI-generated blog posts with human editorial workflow

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  slug text not null,
  excerpt text,
  meta_title text,
  meta_description text,
  content jsonb not null default '{}'::jsonb,
  featured_image_url text,
  category text,
  tags text[] default '{}',
  status public.content_status not null default 'draft',
  seo_score integer,
  keywords text[] default '{}',
  reading_time_minutes integer,
  created_by uuid references auth.users(id),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organization_id, slug)
);

create index idx_blog_posts_org on public.blog_posts(organization_id);
create index idx_blog_posts_status on public.blog_posts(organization_id, status);
create index idx_blog_posts_category on public.blog_posts(organization_id, category);

create trigger on_blog_posts_updated
  before update on public.blog_posts
  for each row execute function public.handle_updated_at();

alter table public.blog_posts enable row level security;
