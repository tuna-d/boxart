-- A player's diary: one row per play session of a game, on the day it was played.
-- Unlike shelf entries a game can appear many times, for replays.
-- Game details are copied from IGDB like shelf entries.

create table public.diary_entries (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  game_id bigint not null,
  game_slug text not null,
  game_title text not null,
  game_cover_url text,
  game_release_date date,
  -- A day of slack so players ahead of UTC can log what they played today.
  played_on date not null check (played_on <= current_date + 1),
  replay boolean not null default false,
  rating numeric(2, 1) check (rating between 0.5 and 5 and rating * 2 = floor(rating * 2)),
  note text check (char_length(note) between 1 and 500),
  created_at timestamptz not null default now()
);

create index diary_entries_user_played_idx on public.diary_entries (user_id, played_on desc);
create index diary_entries_game_id_idx on public.diary_entries (game_id);

alter table public.diary_entries enable row level security;

grant select on public.diary_entries to anon, authenticated;
grant insert (
  game_id, game_slug, game_title, game_cover_url, game_release_date,
  played_on, replay, rating, note
) on public.diary_entries to authenticated;
grant update (played_on, replay, rating, note) on public.diary_entries to authenticated;
grant delete on public.diary_entries to authenticated;

create policy "Diaries are visible to everyone"
  on public.diary_entries for select
  to anon, authenticated
  using (true);

create policy "Players write in their own diary"
  on public.diary_entries for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Players edit their own diary"
  on public.diary_entries for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Players remove from their own diary"
  on public.diary_entries for delete
  to authenticated
  using ((select auth.uid()) = user_id);
