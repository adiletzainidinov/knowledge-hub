-- KnowledgeHub: source-grounded transcript and analysis storage.
-- Apply in Supabase SQL Editor. Existing videos table is unchanged.
create table if not exists public.video_transcripts (
  video_id text primary key references public.videos(id) on delete cascade,
  language text not null default 'ru',
  transcript text not null,
  source_type text not null check (source_type in ('authorized_captions','user_provided','licensed_transcript','authorized_asr')),
  source_note text not null,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.video_analyses (
  video_id text primary key references public.videos(id) on delete cascade,
  summary text not null,
  sales_techniques jsonb not null default '[]'::jsonb,
  actionable_advice jsonb not null default '[]'::jsonb,
  model text not null,
  transcript_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.video_transcripts enable row level security;
alter table public.video_analyses enable row level security;
revoke all on public.video_transcripts,public.video_analyses from anon,authenticated;
grant select,insert,update,delete on public.video_transcripts,public.video_analyses to service_role;
-- Do not expose the service role key to the browser.
