-- Players who signed up without a username (for example through Google)
-- get a placeholder and are asked to pick a real one.

alter table public.profiles
  add column needs_username boolean not null default false;

update public.profiles
  set needs_username = true
  where username ~ '^player_[0-9a-f]{8}$';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  chosen text := new.raw_user_meta_data ->> 'username';
begin
  insert into public.profiles (id, username, needs_username)
  values (
    new.id,
    coalesce(chosen, 'player_' || substr(replace(new.id::text, '-', ''), 1, 8)),
    chosen is null
  );
  return new;
end;
$$;

-- Picking a username clears the flag, so players cannot set it by hand.
create function public.clear_needs_username()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.username is distinct from old.username then
    new.needs_username := false;
  end if;
  return new;
end;
$$;

create trigger on_profile_username_changed
  before update of username on public.profiles
  for each row execute function public.clear_needs_username();

grant update (username) on public.profiles to authenticated;
