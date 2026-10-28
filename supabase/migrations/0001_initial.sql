-- Spelboken: initial schema. See docs/ARCHITECTURE.md and docs/DECISIONS.md (D9, D10).
-- Security lives in the row-level security (RLS) policies below; the public anon key grants nothing on its own.
--
-- Roles: 'coach' edits everything in the team. 'player' is prepared for future player accounts and
-- can only read. Today only coaches exist: the creator of a team becomes its coach automatically.

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  created_by uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.team_members (
  team_id uuid not null references public.teams (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('coach', 'player')),
  created_at timestamptz not null default now(),
  primary key (team_id, user_id)
);

-- The squad. Minimal personal data by design (D10): name, shirt number, positions.
-- user_id links a squad member to their own account once player accounts exist.
create table public.people (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  number smallint check (number between 1 and 99),
  positions text[] not null default '{}',
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A scenario is stored as the same JSON document the app uses (src/domain/types.ts),
-- with a few columns copied out for listing and filtering.
create table public.scenarios (
  id uuid primary key,
  team_id uuid not null references public.teams (id) on delete cascade,
  title text not null,
  phase text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index people_team_idx on public.people (team_id);
create index scenarios_team_idx on public.scenarios (team_id, updated_at desc);
create index team_members_user_idx on public.team_members (user_id);

-- Membership check used by the policies. SECURITY DEFINER avoids recursive RLS on team_members.
create function public.has_team_role(team uuid, roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.team_members m
    where m.team_id = team and m.user_id = auth.uid() and m.role = any (roles)
  );
$$;

-- The creator of a team becomes its coach.
create function public.add_team_creator_as_coach()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.team_members (team_id, user_id, role) values (new.id, new.created_by, 'coach');
  return new;
end;
$$;

create trigger teams_add_creator after insert on public.teams
  for each row execute function public.add_team_creator_as_coach();

create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger people_touch before update on public.people
  for each row execute function public.touch_updated_at();
create trigger scenarios_touch before update on public.scenarios
  for each row execute function public.touch_updated_at();

alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.people enable row level security;
alter table public.scenarios enable row level security;

-- Teams
create policy "members read their teams" on public.teams
  for select to authenticated using (public.has_team_role(id, array['coach', 'player']));
create policy "signed-in users create teams" on public.teams
  for insert to authenticated with check (created_by = auth.uid());
create policy "coaches update teams" on public.teams
  for update to authenticated using (public.has_team_role(id, array['coach']));
create policy "coaches delete teams" on public.teams
  for delete to authenticated using (public.has_team_role(id, array['coach']));

-- Team members (inviting players comes later; coaches manage membership)
create policy "members see their team's members" on public.team_members
  for select to authenticated using (public.has_team_role(team_id, array['coach', 'player']));
create policy "coaches add members" on public.team_members
  for insert to authenticated with check (public.has_team_role(team_id, array['coach']));
create policy "coaches change members" on public.team_members
  for update to authenticated using (public.has_team_role(team_id, array['coach']));
create policy "coaches remove members" on public.team_members
  for delete to authenticated using (public.has_team_role(team_id, array['coach']));

-- Squad
create policy "members read the squad" on public.people
  for select to authenticated using (public.has_team_role(team_id, array['coach', 'player']));
create policy "coaches add to the squad" on public.people
  for insert to authenticated with check (public.has_team_role(team_id, array['coach']));
create policy "coaches edit the squad" on public.people
  for update to authenticated using (public.has_team_role(team_id, array['coach']))
  with check (public.has_team_role(team_id, array['coach']));
create policy "coaches remove from the squad" on public.people
  for delete to authenticated using (public.has_team_role(team_id, array['coach']));

-- Scenarios
create policy "members read scenarios" on public.scenarios
  for select to authenticated using (public.has_team_role(team_id, array['coach', 'player']));
create policy "coaches create scenarios" on public.scenarios
  for insert to authenticated with check (public.has_team_role(team_id, array['coach']));
create policy "coaches edit scenarios" on public.scenarios
  for update to authenticated using (public.has_team_role(team_id, array['coach']))
  with check (public.has_team_role(team_id, array['coach']));
create policy "coaches delete scenarios" on public.scenarios
  for delete to authenticated using (public.has_team_role(team_id, array['coach']));
