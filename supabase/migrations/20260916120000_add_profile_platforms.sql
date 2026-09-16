-- The platforms a player plays on, shown as badges on their profile.
-- Values are ids from src/lib/platforms.ts, so keep both lists in step.

alter table public.profiles
  add column platforms text[] not null default '{}'
  constraint profiles_platforms_known check (
    platforms <@ array[
      'pc', 'steam-deck', 'ps5', 'ps4', 'xbox-series', 'xbox-one',
      'switch-2', 'switch', 'mac', 'mobile', 'vr', 'retro'
    ]::text[]
  );

grant update (platforms) on public.profiles to authenticated;
