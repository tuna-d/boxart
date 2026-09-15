-- Replies on reviews, a reply count on each shelf entry, and reply notifications.

create table public.review_replies (
  id bigint generated always as identity primary key,
  entry_id bigint not null references public.library_entries (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);

create index review_replies_entry_idx on public.review_replies (entry_id, created_at);
create index review_replies_user_id_idx on public.review_replies (user_id);

alter table public.review_replies enable row level security;

grant select on public.review_replies to anon, authenticated;
grant insert (entry_id, body) on public.review_replies to authenticated;
grant delete on public.review_replies to authenticated;

create policy "Replies are visible to everyone"
  on public.review_replies for select
  to anon, authenticated
  using (true);

create policy "Players reply to reviews as themselves"
  on public.review_replies for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.library_entries
      where library_entries.id = entry_id and library_entries.review is not null
    )
  );

-- A reply can be removed by the player who wrote it or by the author of the review.
create policy "Players remove their replies or replies on their reviews"
  on public.review_replies for delete
  to authenticated
  using (
    (select auth.uid()) = user_id
    or exists (
      select 1 from public.library_entries
      where library_entries.id = entry_id and library_entries.user_id = (select auth.uid())
    )
  );

-- Keep replies_count in step with review_replies. Players cannot write the column directly.
alter table public.library_entries
  add column replies_count integer not null default 0;

create function public.sync_review_replies_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.library_entries set replies_count = replies_count + 1 where id = new.entry_id;
  else
    update public.library_entries set replies_count = greatest(replies_count - 1, 0) where id = old.entry_id;
  end if;
  return null;
end;
$$;

create trigger on_review_reply_changed
  after insert or delete on public.review_replies
  for each row execute function public.sync_review_replies_count();

-- Notifications can now point at a review, for replies.
alter table public.notifications drop constraint notifications_kind_check;
alter table public.notifications
  add constraint notifications_kind_check check (kind in ('follow', 'reply'));

alter table public.notifications
  add column entry_id bigint references public.library_entries (id) on delete cascade;
alter table public.notifications
  add constraint notifications_entry_id_kind_check check ((kind = 'reply') = (entry_id is not null));

create index notifications_entry_id_idx on public.notifications (entry_id) where entry_id is not null;

-- Clearing a review, or moving the game back to the backlog, removes its replies
-- and the notices about them, so no thread is left hanging off a missing review.
create function public.clear_replies_on_removed_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.review_replies where entry_id = new.id;
  delete from public.notifications where entry_id = new.id and kind = 'reply';
  return null;
end;
$$;

create trigger on_review_removed
  after update of review on public.library_entries
  for each row
  when (old.review is not null and new.review is null)
  execute function public.clear_replies_on_removed_review();

-- A reply notifies the review author, unless they replied to their own review.
create function public.notify_review_reply()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  author_id uuid;
begin
  select user_id into author_id from public.library_entries where id = new.entry_id;
  if author_id is not null and author_id <> new.user_id then
    insert into public.notifications (recipient_id, actor_id, kind, entry_id)
    values (author_id, new.user_id, 'reply', new.entry_id);
  end if;
  return null;
end;
$$;

create trigger on_review_reply_created
  after insert on public.review_replies
  for each row execute function public.notify_review_reply();
