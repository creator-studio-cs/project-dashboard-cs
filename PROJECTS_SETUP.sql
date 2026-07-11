-- ============================================================
-- PROJECTS  (run once in Supabase → SQL Editor)
-- Powers the Projects tab + Gantt timeline. Each project links
-- to a single primary client (contact_id) and has a start/end
-- date so it can be placed on the timeline.
-- ============================================================
create table if not exists projects (
  id         bigint generated always as identity primary key,
  name       text not null,
  contact_id bigint references contacts(id) on delete set null,
  status     text not null default 'Planning',
  start_date date,
  end_date   date,
  value      numeric default 0,
  notes      text,
  created_at timestamptz default now()
);

create index if not exists projects_contact_id_idx on projects(contact_id);
create index if not exists projects_start_date_idx on projects(start_date);

alter table projects enable row level security;
create policy "Public access projects"
  on projects for all using (true) with check (true);

alter publication supabase_realtime add table projects;
