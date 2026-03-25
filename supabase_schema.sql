-- ============================================================
-- East Kilbride Pickleball Championship — Supabase Schema
-- Paste this into your Supabase SQL Editor and click Run
-- ============================================================

-- Players table
create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name  text not null,
  skill_level text not null default 'Intermediate'
    check (skill_level in ('Beginner','Intermediate','Advanced')),
  created_at timestamptz default now()
);

-- Fixtures table
create table if not exists fixtures (
  id uuid primary key default gen_random_uuid(),
  match_type text not null check (match_type in ('Singles','Doubles','Mixed')),
  match_date date not null,
  venue      text,
  status     text not null default 'Scheduled'
    check (status in ('Scheduled','Played')),
  -- Team 1
  p1a uuid references players(id),
  p1b uuid references players(id),  -- null for singles
  -- Team 2
  p2a uuid references players(id),
  p2b uuid references players(id),  -- null for singles
  created_at timestamptz default now()
);

-- Results (sets) table — each row is one set of a fixture
create table if not exists results (
  id         uuid primary key default gen_random_uuid(),
  fixture_id uuid not null references fixtures(id) on delete cascade,
  set_number int  not null,
  score_p1   int  not null default 0,
  score_p2   int  not null default 0,
  created_at timestamptz default now(),
  unique (fixture_id, set_number)
);

-- ============================================================
-- Row Level Security — allow public read, authenticated write
-- ============================================================
alter table players  enable row level security;
alter table fixtures enable row level security;
alter table results  enable row level security;

-- Public read (anyone with the URL can view)
create policy "Public read players"  on players  for select using (true);
create policy "Public read fixtures" on fixtures for select using (true);
create policy "Public read results"  on results  for select using (true);

-- Authenticated write (only logged-in admins can add/edit)
create policy "Auth insert players"  on players  for insert with check (auth.role() = 'authenticated');
create policy "Auth update players"  on players  for update using (auth.role() = 'authenticated');
create policy "Auth delete players"  on players  for delete using (auth.role() = 'authenticated');

create policy "Auth insert fixtures" on fixtures for insert with check (auth.role() = 'authenticated');
create policy "Auth update fixtures" on fixtures for update using (auth.role() = 'authenticated');
create policy "Auth delete fixtures" on fixtures for delete using (auth.role() = 'authenticated');

create policy "Auth insert results"  on results  for insert with check (auth.role() = 'authenticated');
create policy "Auth update results"  on results  for update using (auth.role() = 'authenticated');
create policy "Auth delete results"  on results  for delete using (auth.role() = 'authenticated');

-- ============================================================
-- Handy view: fixtures with player names + sets joined
-- ============================================================
create or replace view fixture_view as
select
  f.id,
  f.match_type,
  f.match_date,
  f.venue,
  f.status,
  p1a.first_name || ' ' || p1a.last_name as team1_player_a,
  p1b.first_name || ' ' || p1b.last_name as team1_player_b,
  p2a.first_name || ' ' || p2a.last_name as team2_player_a,
  p2b.first_name || ' ' || p2b.last_name as team2_player_b,
  json_agg(
    json_build_object('set', r.set_number, 'p1', r.score_p1, 'p2', r.score_p2)
    order by r.set_number
  ) filter (where r.id is not null) as sets
from fixtures f
left join players p1a on f.p1a = p1a.id
left join players p1b on f.p1b = p1b.id
left join players p2a on f.p2a = p2a.id
left join players p2b on f.p2b = p2b.id
left join results r on r.fixture_id = f.id
group by f.id, p1a.first_name, p1a.last_name, p1b.first_name, p1b.last_name,
         p2a.first_name, p2a.last_name, p2b.first_name, p2b.last_name;
