-- Likes on reviews and lists now notify the player who wrote them.

alter table public.notifications drop constraint notifications_kind_check;
alter table public.notifications
  add constraint notifications_kind_check check (kind in ('follow', 'reply', 'review_like', 'list_like'));

alter table public.notifications
  add column list_id bigint references public.lists (id) on delete cascade;

-- Reply and review like notices point at a review, list like notices at a list.
alter table public.notifications drop constraint notifications_entry_id_kind_check;
alter table public.notifications
  add constraint notifications_entry_id_kind_check check ((kind in ('reply', 'review_like')) = (entry_id is not null));
alter table public.notifications
  add constraint notifications_list_id_kind_check check ((kind = 'list_like') = (list_id is not null));

create index notifications_list_id_idx on public.notifications (list_id) where list_id is not null;

-- A like notifies the author, unless they liked their own work. Liking again after
-- taking a like back replaces the older notice, and taking a like back removes it.
create function public.notify_review_like()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  author_id uuid;
begin
  if tg_op = 'DELETE' then
    delete from public.notifications
    where kind = 'review_like' and entry_id = old.entry_id and actor_id = old.user_id;
    return null;
  end if;

  select user_id into author_id from public.library_entries where id = new.entry_id;
  if author_id is null or author_id = new.user_id then
    return null;
  end if;

  delete from public.notifications
  where kind = 'review_like' and entry_id = new.entry_id and actor_id = new.user_id;
  insert into public.notifications (recipient_id, actor_id, kind, entry_id)
  values (author_id, new.user_id, 'review_like', new.entry_id);
  return null;
end;
$$;

create trigger on_review_like_notify
  after insert or delete on public.review_likes
  for each row execute function public.notify_review_like();

create function public.notify_list_like()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  author_id uuid;
begin
  if tg_op = 'DELETE' then
    delete from public.notifications
    where kind = 'list_like' and list_id = old.list_id and actor_id = old.user_id;
    return null;
  end if;

  select user_id into author_id from public.lists where id = new.list_id;
  if author_id is null or author_id = new.user_id then
    return null;
  end if;

  delete from public.notifications
  where kind = 'list_like' and list_id = new.list_id and actor_id = new.user_id;
  insert into public.notifications (recipient_id, actor_id, kind, list_id)
  values (author_id, new.user_id, 'list_like', new.list_id);
  return null;
end;
$$;

create trigger on_list_like_notify
  after insert or delete on public.list_likes
  for each row execute function public.notify_list_like();

-- Clearing a review also clears the like notices about it.
create function public.clear_review_like_notifications()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.notifications where entry_id = new.id and kind = 'review_like';
  return null;
end;
$$;

create trigger on_review_removed_clear_likes
  after update of review on public.library_entries
  for each row
  when (old.review is not null and new.review is null)
  execute function public.clear_review_like_notifications();
