-- Player made lists of games, their entries and likes.

create table public.lists (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  description text check (char_length(description) between 1 and 1000),
  ranked boolean not null default false,
  items_count integer not null default 0,
  likes_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index lists_user_id_idx on public.lists (user_id, updated_at desc);
create index lists_popular_idx on public.lists (likes_count desc, updated_at desc);

alter table public.lists enable row level security;

grant select on public.lists to anon, authenticated;
grant insert (title, description, ranked) on public.lists to authenticated;
grant update (title, description, ranked, updated_at) on public.lists to authenticated;
grant delete on public.lists to authenticated;

create policy "Lists are visible to everyone"
  on public.lists for select
  to anon, authenticated
  using (true);

create policy "Players create their own lists"
  on public.lists for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Players edit their own lists"
  on public.lists for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Players delete their own lists"
  on public.lists for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Games on a list. Game details are copied from IGDB like shelf entries.

create table public.list_items (
  id bigint generated always as identity primary key,
  list_id bigint not null references public.lists (id) on delete cascade,
  game_id bigint not null,
  game_slug text not null,
  game_title text not null,
  game_cover_url text,
  game_release_date date,
  position integer not null,
  created_at timestamptz not null default now(),
  unique (list_id, game_id)
);

create index list_items_order_idx on public.list_items (list_id, position);
create index list_items_game_id_idx on public.list_items (game_id);

alter table public.list_items enable row level security;

grant select on public.list_items to anon, authenticated;
grant insert (list_id, game_id, game_slug, game_title, game_cover_url, game_release_date)
  on public.list_items to authenticated;
grant update (position) on public.list_items to authenticated;
grant delete on public.list_items to authenticated;

create policy "List items are visible to everyone"
  on public.list_items for select
  to anon, authenticated
  using (true);

create policy "Players add games to their own lists"
  on public.list_items for insert
  to authenticated
  with check (
    exists (
      select 1 from public.lists
      where lists.id = list_id and lists.user_id = (select auth.uid())
    )
  );

create policy "Players reorder their own lists"
  on public.list_items for update
  to authenticated
  using (
    exists (
      select 1 from public.lists
      where lists.id = list_id and lists.user_id = (select auth.uid())
    )
  );

create policy "Players remove games from their own lists"
  on public.list_items for delete
  to authenticated
  using (
    exists (
      select 1 from public.lists
      where lists.id = list_id and lists.user_id = (select auth.uid())
    )
  );

-- New games go to the end of the list, which holds at most 100 games.
create function public.place_new_list_item()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_count integer;
begin
  select items_count into current_count from public.lists where id = new.list_id for update;
  if current_count >= 100 then
    raise exception 'A list can hold up to 100 games' using errcode = 'check_violation';
  end if;

  select coalesce(max(position), 0) + 1 into new.position
  from public.list_items
  where list_id = new.list_id;
  return new;
end;
$$;

create trigger before_list_item_added
  before insert on public.list_items
  for each row execute function public.place_new_list_item();

-- Keep items_count and updated_at in step with list_items.
create function public.sync_list_items_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.lists set items_count = items_count + 1, updated_at = now() where id = new.list_id;
  else
    update public.lists set items_count = greatest(items_count - 1, 0), updated_at = now() where id = old.list_id;
  end if;
  return null;
end;
$$;

create trigger on_list_item_changed
  after insert or delete on public.list_items
  for each row execute function public.sync_list_items_count();

-- Swap a game with its neighbour. Row level security limits it to the list owner.
create function public.move_list_item(target_item_id bigint, direction integer)
returns void
language plpgsql
set search_path = ''
as $$
declare
  target public.list_items;
  neighbour public.list_items;
begin
  select * into target from public.list_items where id = target_item_id;
  if not found then
    return;
  end if;

  if direction < 0 then
    select * into neighbour from public.list_items
    where list_id = target.list_id and (position, id) < (target.position, target.id)
    order by position desc, id desc
    limit 1;
  else
    select * into neighbour from public.list_items
    where list_id = target.list_id and (position, id) > (target.position, target.id)
    order by position, id
    limit 1;
  end if;
  if not found then
    return;
  end if;

  update public.list_items set position = neighbour.position where id = target.id;
  update public.list_items set position = target.position where id = neighbour.id;
end;
$$;

grant execute on function public.move_list_item(bigint, integer) to authenticated;

-- Likes on lists.

create table public.list_likes (
  list_id bigint not null references public.lists (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (list_id, user_id)
);

create index list_likes_user_id_idx on public.list_likes (user_id);

alter table public.list_likes enable row level security;

grant select on public.list_likes to anon, authenticated;
grant insert (list_id) on public.list_likes to authenticated;
grant delete on public.list_likes to authenticated;

create policy "List likes are visible to everyone"
  on public.list_likes for select
  to anon, authenticated
  using (true);

create policy "Players like lists as themselves"
  on public.list_likes for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Players remove their own list likes"
  on public.list_likes for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create function public.sync_list_likes_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.lists set likes_count = likes_count + 1 where id = new.list_id;
  else
    update public.lists set likes_count = greatest(likes_count - 1, 0) where id = old.list_id;
  end if;
  return null;
end;
$$;

create trigger on_list_like_changed
  after insert or delete on public.list_likes
  for each row execute function public.sync_list_likes_count();
