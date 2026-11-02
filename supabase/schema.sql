-- KnowledgeHub database schema. Run in Supabase SQL Editor.
create extension if not exists pgcrypto;
create table if not exists public.channels (
 id text primary key, handle text not null unique, title text not null,
 created_at timestamptz not null default now(), synced_at timestamptz
);
create table if not exists public.videos (
 id text primary key, channel_id text not null references public.channels(id) on delete cascade,
 title text not null, description text not null default '',
 url text not null, published_at timestamptz, thumbnail text,
 status text not null default 'metadata_only'
 check (status in ('metadata_only','text_available','reviewed')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists videos_channel_published on public.videos(channel_id,published_at desc);
create table if not exists public.video_notes (
 video_id text primary key references public.videos(id) on delete cascade,
 source_type text not null check (source_type in ('description','authorized_transcript','manual_notes')),
 source_text text not null, summary text, key_points jsonb not null default '[]'::jsonb,
 source_url text not null, updated_at timestamptz not null default now()
);
alter table public.channels enable row level security;
alter table public.videos enable row level security;
alter table public.video_notes enable row level security;
-- No public access policies. Server uses service-role key, never expose it in client code.
