-- A player's shelf: one entry per game, holding status, rating and an optional review.
-- Game details are copied from IGDB when the entry is saved so shelves render
-- without asking IGDB again.

create table public.library_entries (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  game_id bigint not null,
  game_slug text not null,
  game_title text not null,
  game_cover_url text,
  game_release_date date,
  status text not null check (status in ('played', 'playing', 'backlog')),
  rating numeric(2, 1) check (rating between 0.5 and 5 and rating * 2 = floor(rating * 2)),
  platform text check (char_length(platform) <= 40),
  hours_played integer check (hours_played between 0 and 9999),
  review text check (char_length(review) between 1 and 2000),
  likes_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, game_id),
  -- Backlog games have not been played yet, so they carry no rating or review.
  check (status <> 'backlog' or (rating is null and review is null))
);

create index library_entries_game_id_idx on public.library_entries (game_id);
create index library_entries_reviews_idx on public.library_entries (game_id, likes_count desc)
  where review is not null;

alter table public.library_entries enable row level security;

grant select on public.library_entries to anon, authenticated;
-- Saving uses an upsert, so both lists cover every column the app sends.
grant insert (
  game_id, game_slug, game_title, game_cover_url, game_release_date,
  status, rating, platform, hours_played, review, updated_at
) on public.library_entries to authenticated;
grant update (
  game_id, game_slug, game_title, game_cover_url, game_release_date,
  status, rating, platform, hours_played, review, updated_at
) on public.library_entries to authenticated;
grant delete on public.library_entries to authenticated;

create policy "Shelves are visible to everyone"
  on public.library_entries for select
  to anon, authenticated
  using (true);

create policy "Players add to their own shelf"
  on public.library_entries for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Players edit their own shelf"
  on public.library_entries for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Players remove from their own shelf"
  on public.library_entries for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Likes on reviews.

create table public.review_likes (
  entry_id bigint not null references public.library_entries (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (entry_id, user_id)
);

alter table public.review_likes enable row level security;

grant select on public.review_likes to anon, authenticated;
grant insert (entry_id) on public.review_likes to authenticated;
grant delete on public.review_likes to authenticated;

create policy "Likes are visible to everyone"
  on public.review_likes for select
  to anon, authenticated
  using (true);

create policy "Players like as themselves"
  on public.review_likes for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.library_entries
      where library_entries.id = entry_id and library_entries.review is not null
    )
  );

create policy "Players remove their own likes"
  on public.review_likes for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Keep likes_count in step with review_likes. Players cannot write the column directly.
create function public.sync_review_likes_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.library_entries set likes_count = likes_count + 1 where id = new.entry_id;
  else
    update public.library_entries set likes_count = greatest(likes_count - 1, 0) where id = old.entry_id;
  end if;
  return null;
end;
$$;

create trigger on_review_like_changed
  after insert or delete on public.review_likes
  for each row execute function public.sync_review_likes_count();

-- Rating summary for a game page: average, count and a five bucket histogram.
create function public.game_rating_stats(target_game_id bigint)
returns table (
  average numeric,
  rating_count bigint,
  one_heart bigint,
  two_hearts bigint,
  three_hearts bigint,
  four_hearts bigint,
  five_hearts bigint
)
language sql
stable
set search_path = ''
as $$
  select
    coalesce(round(avg(rating), 1), 0),
    count(rating),
    count(*) filter (where rating <= 1),
    count(*) filter (where rating > 1 and rating <= 2),
    count(*) filter (where rating > 2 and rating <= 3),
    count(*) filter (where rating > 3 and rating <= 4),
    count(*) filter (where rating > 4)
  from public.library_entries
  where game_id = target_game_id and rating is not null;
$$;

grant execute on function public.game_rating_stats(bigint) to anon, authenticated;

-- Average and count for many games at once, for cover grids.
create function public.games_rating_summary(game_ids bigint[])
returns table (game_id bigint, average numeric, rating_count bigint)
language sql
stable
set search_path = 
as $
  select
    library_entries.game_id,
    round(avg(library_entries.rating), 1),
    count(library_entries.rating)
  from public.library_entries
  where library_entries.game_id = any (game_ids) and library_entries.rating is not null
  group by library_entries.game_id;
$;

grant execute on function public.games_rating_summary(bigint[]) to anon, authenticated;
