-- The player directory: every named player with shelf totals and their latest games.
-- Runs with the caller's rights, so it only reads what profiles and shelves already expose.

create function public.list_players(
  sort_by text default 'active',
  name_query text default null,
  max_rows integer default 60
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
  order by
    case when sort_by = 'liked' then stats.likes_received end desc nulls last,
    case when sort_by = 'newest' then profiles.created_at end desc nulls last,
    case when sort_by = 'active' then stats.games_count end desc nulls last,
    stats.last_active_at desc nulls last,
    profiles.created_at desc
  limit least(greatest(max_rows, 1), 100);
$$;

grant execute on function public.list_players(text, text, integer) to anon, authenticated;
