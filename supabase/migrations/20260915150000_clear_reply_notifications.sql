-- Deleting a reply also removes the notice it sent, so no notification points at a reply
-- that is gone. Each reply sends one notice, so one deleted reply removes the newest
-- notice from the same player on the same review.

create function public.clear_reply_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.notifications
  where id = (
    select id from public.notifications
    where kind = 'reply' and entry_id = old.entry_id and actor_id = old.user_id
    order by created_at desc
    limit 1
  );
  return null;
end;
$$;

create trigger on_review_reply_deleted
  after delete on public.review_replies
  for each row execute function public.clear_reply_notification();
