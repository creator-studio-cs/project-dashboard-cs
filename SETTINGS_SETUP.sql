-- ============================================================
-- WORKSPACE SETTINGS  (run once in Supabase → SQL Editor)
-- Stores your editable branding + configuration as a single
-- JSON row, shared across everyone in the workspace.
-- ============================================================
create table if not exists workspace_settings (
  id         bigint generated always as identity primary key,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

alter table workspace_settings enable row level security;
create policy "Public access workspace_settings"
  on workspace_settings for all using (true) with check (true);

alter publication supabase_realtime add table workspace_settings;
