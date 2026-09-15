-- One-way follows between players, and notifications that tell a player who followed them.

create table public.follows (
  follower_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  followee_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

create index follows_followee_idx on public.follows (followee_id, created_at desc);

alter table public.follows enable row level security;

grant select on public.follows to anon, authenticated;
grant insert (followee_id) on public.follows to authenticated;
grant delete on public.follows to authenticated;

create policy "Follows are visible to everyone"
  on public.follows for select
  to anon, authenticated
  using (true);

create policy "Players follow as themselves"
  on public.follows for insert
  to authenticated
  with check ((select auth.uid()) = follower_id);

create policy "Players unfollow as themselves"
  on public.follows for delete
  to authenticated
  using ((select auth.uid()) = follower_id);

-- Notifications are written by triggers only. Players read theirs and mark them read.

create table public.notifications (
  id bigint generated always as identity primary key,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('follow')),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index notifications_recipient_idx on public.notifications (recipient_id, created_at desc);
create index notifications_unread_idx on public.notifications (recipient_id) where read_at is null;

alter table public.notifications enable row level security;

grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

create policy "Players read their own notifications"
  on public.notifications for select
  to authenticated
  using ((select auth.uid()) = recipient_id);

create policy "Players mark their own notifications read"
  on public.notifications for update
  to authenticated
  using ((select auth.uid()) = recipient_id)
  with check ((select auth.uid()) = recipient_id);

-- A new follow notifies the followed player. Following again after an unfollow
-- replaces the older notice instead of stacking a second one.
create function public.notify_new_follower()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.notifications
  where recipient_id = new.followee_id and actor_id = new.follower_id and kind = 'follow';

  insert into public.notifications (recipient_id, actor_id, kind)
  values (new.followee_id, new.follower_id, 'follow');
  return null;
end;
$$;

create trigger on_follow_created
  after insert on public.follows
  for each row execute function public.notify_new_follower();

-- The player directory can now be limited to a set of players, for the Following tab.
drop function public.list_players(text, text, integer);

create function public.list_players(
  sort_by text default 'active',
  name_query text default null,
  max_rows integer default 60,
  only_ids uuid[] default null
)
returns table (
  id uuid,
  username text,
  bio text,
  created_at timestamptz,
  games_count bigint,
  reviews_count bigint,
  likes_received bigint,
  last_active_at timestamptz,
  recent_games jsonb
)
language sql
stable
set search_path = ''
as $$
  select
    profiles.id,
    profiles.username,
    profiles.bio,
    profiles.created_at,
    stats.games_count,
    stats.reviews_count,
    stats.likes_received,
    stats.last_active_at,
    coalesce(recent.games, '[]'::jsonb)
  from public.profiles
  cross join lateral (
    select
      count(*) as games_count,
      count(entries.review) as reviews_count,
      coalesce(sum(entries.likes_count), 0)::bigint as likes_received,
      max(entries.updated_at) as last_active_at
    from public.library_entries as entries
    where entries.user_id = profiles.id
  ) as stats
  cross join lateral (
    select jsonb_agg(
      jsonb_build_object('slug', latest.game_slug, 'title', latest.game_title, 'coverUrl', latest.game_cover_url)
      order by latest.updated_at desc
    ) as games
    from (
      select entries.game_slug, entries.game_title, entries.game_cover_url, entries.updated_at
      from public.library_entries as entries
      where entries.user_id = profiles.id
      order by entries.updated_at desc
      limit 4
    ) as latest
  ) as recent
  -- Players who have not picked a name yet still carry a placeholder, so keep them out.
  where not profiles.needs_username
    and (name_query is null or profiles.username ilike '%' || name_query || '%')
    and (only_ids is null or profiles.id = any (only_ids))
  order by
    case when sort_by = 'liked' then stats.likes_received end desc nulls last,
    case when sort_by = 'newest' then profiles.created_at end desc nulls last,
    case when sort_by = 'active' then stats.games_count end desc nulls last,
    stats.last_active_at desc nulls last,
    profiles.created_at desc
  limit least(greatest(max_rows, 1), 100);
$$;

grant execute on function public.list_players(text, text, integer, uuid[]) to anon, authenticated;
