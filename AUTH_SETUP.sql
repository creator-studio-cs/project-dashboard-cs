-- ============================================================
-- AUTH + ROW-LEVEL SECURITY  (run once in Supabase → SQL Editor)
--
-- This replaces the old wide-open "Public access" policies (which let anyone
-- with the anon key read/write everything) with real row-level security:
--
--   • Signed-in users  → full access to all workspace tables.
--   • Anonymous users  → NOTHING, with two deliberate exceptions:
--        - INSERT into `contacts`  (so the public #intake form still works)
--        - SELECT on `workspace_settings` (so the intake/login page can show
--          your logo, name, and colors before anyone signs in)
--
-- After this runs, the database returns nothing to an unauthenticated request —
-- so the workspace can no longer be reached just by sharing the link or pulling
-- the anon key out of the page. That is the real fix; the login screen is just
-- the front door to it.
--
-- Safe to re-run: every policy is dropped-if-exists before it's recreated.
-- ============================================================

-- ---------- CONTACTS ----------
alter table contacts enable row level security;
drop policy if exists "Public can insert contacts" on contacts;
drop policy if exists "Public can read contacts"   on contacts;
drop policy if exists "Public can update contacts" on contacts;
drop policy if exists "Public can delete contacts" on contacts;
drop policy if exists "Team full access contacts"  on contacts;
drop policy if exists "Public intake insert"       on contacts;
-- Signed-in team: everything.
create policy "Team full access contacts"
  on contacts for all to authenticated using (true) with check (true);
-- Public intake form: insert-only, nothing else (no read/update/delete).
create policy "Public intake insert"
  on contacts for insert to anon with check (true);

-- ---------- TASKS ----------
alter table tasks enable row level security;
drop policy if exists "Public access tasks"    on tasks;
drop policy if exists "Team full access tasks"  on tasks;
create policy "Team full access tasks"
  on tasks for all to authenticated using (true) with check (true);

-- ---------- ACTIVITY LOG ----------
alter table activity_log enable row level security;
drop policy if exists "Public access activity_log"   on activity_log;
drop policy if exists "Team full access activity_log" on activity_log;
create policy "Team full access activity_log"
  on activity_log for all to authenticated using (true) with check (true);

-- ---------- FIELD DEFS ----------
alter table field_defs enable row level security;
drop policy if exists "Public access field_defs"   on field_defs;
drop policy if exists "Team full access field_defs" on field_defs;
create policy "Team full access field_defs"
  on field_defs for all to authenticated using (true) with check (true);

-- ---------- PROJECTS ----------
alter table projects enable row level security;
drop policy if exists "Public access projects"   on projects;
drop policy if exists "Team full access projects" on projects;
create policy "Team full access projects"
  on projects for all to authenticated using (true) with check (true);

-- ---------- WORKSPACE SETTINGS ----------
alter table workspace_settings enable row level security;
drop policy if exists "Public access workspace_settings"      on workspace_settings;
drop policy if exists "Team full access workspace_settings"    on workspace_settings;
drop policy if exists "Public read workspace_settings"         on workspace_settings;
-- Signed-in team: read + write branding/config.
create policy "Team full access workspace_settings"
  on workspace_settings for all to authenticated using (true) with check (true);
-- Anyone (incl. the login/intake page before sign-in): read-only, so branding shows.
create policy "Public read workspace_settings"
  on workspace_settings for select to anon using (true);
