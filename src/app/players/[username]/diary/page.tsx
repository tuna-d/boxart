import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteDiaryEntry } from "@/app/diary/actions";
import { GameCover } from "@/components/game-cover";
import { HeartRating } from "@/components/heart-rating";
import { getCurrentPlayer } from "@/lib/auth";
import {
  daysInMonth,
  formatMonthName,
  isoDay,
  leadingBlanks,
  monthKey,
  monthOf,
  parseMonth,
  shiftMonth,
} from "@/lib/calendar";
import { getDiaryCount, getDiaryMonth } from "@/lib/diary";
import { releaseYear } from "@/lib/format";
import { getPlayer } from "@/lib/players";
import type { DiaryEntry } from "@/lib/types";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const navClass = "flex h-10 w-10 items-center justify-center border-2 font-pixel text-lg";

function weekdayName(isoDate: string) {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
}

function ReplayBadge() {
  return (
    <span className="border-2 border-p2 px-1.5 font-pixel text-[10px] leading-4 text-p2 uppercase">Replay</span>
  );
}

export async function generateMetadata(props: PageProps<"/players/[username]/diary">): Promise<Metadata> {
  const { username } = await props.params;
  return { title: `Diary · ${username}` };
}

export default async function DiaryPage(props: PageProps<"/players/[username]/diary">) {
  const { username } = await props.params;
  const player = await getPlayer(username);
  if (!player) notFound();

  const searchParams = await props.searchParams;
  // Days follow UTC on the server, the same clock the database checks dates against.
  const today = isoDay(new Date());
  const currentMonth = monthOf(today);
  const month = parseMonth(searchParams.month) ?? currentMonth;
  const key = monthKey(month);
  const monthLabel = formatMonthName(month);

  const viewer = await getCurrentPlayer();
  const isOwner = viewer?.id === player.id;
  const [entries, total] = await Promise.all([getDiaryMonth(player.id, month), getDiaryCount(player.id)]);

  const profileHref = `/players/${encodeURIComponent(player.username)}`;
  const diaryHref = `${profileHref}/diary`;
  const monthHref = (target: typeof month) => `${diaryHref}?month=${monthKey(target)}`;
  const nextMonth = shiftMonth(month, 1);
  const hasNext = monthKey(nextMonth) <= monthKey(currentMonth);

  const byDay = new Map<string, DiaryEntry[]>();
  for (const entry of entries) {
    byDay.set(entry.playedOn, [...(byDay.get(entry.playedOn) ?? []), entry]);
  }
  const blanks = leadingBlanks(month);
  const dayCount = daysInMonth(month);
  const trailing = (7 - ((blanks + dayCount) % 7)) % 7;

  return (
    <main className="px-6 pt-10 pb-16 md:px-10">
      <div className="flex flex-col gap-4">
        <Link href={profileHref} className="flex w-fit items-center gap-3 font-pixel text-sm text-p2 hover:text-ink">
          &lt; {player.username}
        </Link>
        <h1 className="font-pixel text-4xl leading-none font-bold [text-shadow:4px_4px_0_var(--color-shade)] md:text-5xl">
          Diary
        </h1>
        <p className="text-sm text-muted uppercase">
          {total} {total === 1 ? "entry" : "entries"} logged
        </p>
      </div>

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)]">
        <section aria-labelledby="calendar-heading" className="min-w-0">
          <div className="flex items-center justify-between gap-4 border-b-2 border-dashed border-line pb-4">
            <Link
              href={monthHref(shiftMonth(month, -1))}
              aria-label="Previous month"
              className={`${navClass} border-ink hover:border-accent hover:text-accent`}
            >
              &lsaquo;
            </Link>
            <h2 id="calendar-heading" className="font-pixel text-xl text-accent uppercase">
              {monthLabel}
            </h2>
            {hasNext ? (
              <Link
                href={monthHref(nextMonth)}
                aria-label="Next month"
                className={`${navClass} border-ink hover:border-accent hover:text-accent`}
              >
                &rsaquo;
              </Link>
            ) : (
              <span aria-hidden="true" className={`${navClass} border-line text-line`}>
                &rsaquo;
              </span>
            )}
          </div>

          <div aria-hidden="true" className="mt-4 grid grid-cols-7 gap-2 font-pixel text-[10px] text-muted uppercase">
            {WEEKDAYS.map((day) => (
              <span key={day} className="text-center">
                {day}
              </span>
            ))}
          </div>

          <ol className="mt-2 grid grid-cols-7 gap-2">
            {Array.from({ length: blanks }, (_, index) => (
              <li key={`blank-${index}`} aria-hidden="true" />
            ))}
            {Array.from({ length: dayCount }, (_, index) => {
              const day = index + 1;
              const date = `${key}-${String(day).padStart(2, "0")}`;
              const played = byDay.get(date) ?? [];
              const shown = played[0];
              const isToday = date === today;
              const dayLabel = (
                <span
                  className={`absolute top-0 left-0 z-10 px-1 font-pixel text-[10px] leading-4 ${
                    isToday ? "bg-accent text-screen" : "bg-screen/85 text-ink"
                  }`}
                >
                  {day}
                </span>
              );

              return (
                <li key={date} className="relative">
                  {shown ? (
                    <a
                      href={`#day-${date}`}
                      aria-label={`${monthLabel.split(" ")[0]} ${day}: ${played
                        .map((entry) => entry.game.title)
                        .join(", ")}`}
                      className={`group relative block ${isToday ? "outline-2 outline-offset-4 outline-accent" : ""}`}
                    >
                      <GameCover
                        title={shown.game.title}
                        imageUrl={shown.game.coverUrl}
                        size="xs"
                        className="w-full transition-transform group-hover:-translate-y-0.5"
                      />
                      {dayLabel}
                      {shown.replay && (
                        <span
                          title="Replay"
                          className="absolute right-0 bottom-0 z-10 bg-p2 px-1 font-pixel text-[9px] leading-3.5 text-screen"
                        >
                          R
                        </span>
                      )}
                      {played.length > 1 && (
                        <span className="absolute top-0 right-0 z-10 bg-p1 px-1 font-pixel text-[9px] leading-4 text-screen">
                          +{played.length - 1}
                        </span>
                      )}
                    </a>
                  ) : (
                    <div
                      className={`relative aspect-[3/4] border-2 ${
                        isToday ? "border-accent" : "border-dashed border-line opacity-50"
                      }`}
                    >
                      {dayLabel}
                    </div>
                  )}
                </li>
              );
            })}
            {Array.from({ length: trailing }, (_, index) => (
              <li key={`trailing-${index}`} aria-hidden="true" />
            ))}
          </ol>

          <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            <span>
              <span className="mr-1.5 bg-p2 px-1 font-pixel text-[9px] text-screen">R</span>Replay
            </span>
            <span>
              <span className="mr-1.5 bg-p1 px-1 font-pixel text-[9px] text-screen">+1</span>More games that day
            </span>
            {key !== monthKey(currentMonth) && (
              <Link href={diaryHref} className="ml-auto font-semibold text-accent uppercase hover:text-ink">
                This month
              </Link>
            )}
          </p>
        </section>

        <section aria-labelledby="entries-heading" className="min-w-0">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b-2 border-dashed border-line pb-4">
            <h2 id="entries-heading" className="font-pixel text-xl">
              Played in {monthLabel}
            </h2>
            <span className="text-sm text-muted uppercase">
              {entries.length} {entries.length === 1 ? "entry" : "entries"}
            </span>
          </div>

          {entries.length === 0 ? (
            <p className="py-6 text-ink-soft">
              {isOwner
                ? "Nothing logged this month. Log a game as played to start your diary."
                : `${player.username} did not log anything this month.`}
            </p>
          ) : (
            <ul>
              {entries.map((entry, index) => {
                const firstOfDay = index === 0 || entries[index - 1].playedOn !== entry.playedOn;
                const href = `/games/${entry.game.slug}`;
                return (
                  <li
                    key={entry.id}
                    id={firstOfDay ? `day-${entry.playedOn}` : undefined}
                    className="flex scroll-mt-24 gap-4 border-b-2 border-dashed border-line py-4"
                  >
                    <time dateTime={entry.playedOn} className="flex w-11 shrink-0 flex-col items-center pt-1">
                      {firstOfDay && (
                        <>
                          <span className="font-pixel text-2xl leading-none text-accent">
                            {Number(entry.playedOn.slice(8))}
                          </span>
                          <span className="mt-1 text-[11px] text-muted uppercase">{weekdayName(entry.playedOn)}</span>
                        </>
                      )}
                    </time>
                    <Link href={href} tabIndex={-1} aria-hidden="true" className="w-12 shrink-0 pt-1">
                      <GameCover title={entry.game.title} imageUrl={entry.game.coverUrl} size="xs" className="w-full" />
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <Link href={href} className="font-pixel text-[15px] uppercase hover:text-accent">
                          {entry.game.title}
                        </Link>
                        <span className="text-sm text-muted">{releaseYear(entry.game.releaseDate)}</span>
                      </div>
                      {(entry.rating !== null || entry.replay) && (
                        <div className="flex flex-wrap items-center gap-3">
                          {entry.rating !== null && <HeartRating value={entry.rating} size="xs" />}
                          {entry.replay && <ReplayBadge />}
                        </div>
                      )}
                      {entry.note && (
                        <p className="text-sm leading-relaxed whitespace-pre-line text-ink-soft">{entry.note}</p>
                      )}
                    </div>
                    {isOwner && (
                      <form action={deleteDiaryEntry} className="shrink-0">
                        <input type="hidden" name="entryId" value={entry.id} />
                        <input type="hidden" name="slug" value={entry.game.slug} />
                        <button
                          type="submit"
                          aria-label={`Delete the ${entry.game.title} entry from ${entry.playedOn}`}
                          className="flex h-8 items-center justify-center border-2 border-line px-2.5 text-xs font-semibold text-ink-soft uppercase hover:border-p1 hover:text-p1"
                        >
                          Delete
                        </button>
                      </form>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
