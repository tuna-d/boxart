// Date helpers for the diary. No server imports, so client components can use them too.

export const DIARY_NOTE_LIMIT = 500;
/** The earliest day a diary entry can be dated. */
export const DIARY_FIRST_DAY = "1970-01-01";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

export type CalendarMonth = {
  year: number;
  /** 1 to 12. */
  month: number;
};

/** An ISO date (YYYY-MM-DD) for a Date, read in UTC. */
export function isoDay(date: Date) {
  return date.toISOString().slice(0, 10);
}

/** Today as YYYY-MM-DD in the browser's own time zone. */
export function localToday(now = new Date()) {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/** Checks a YYYY-MM-DD string is a real calendar day. */
export function isValidDay(value: string) {
  if (!DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && isoDay(date) === value;
}

/** Reads `?month=YYYY-MM`, or returns null when it is not one. */
export function parseMonth(value: unknown): CalendarMonth | null {
  const match = typeof value === "string" ? MONTH_PATTERN.exec(value) : null;
  return match ? { year: Number(match[1]), month: Number(match[2]) } : null;
}

export function monthOf(isoDate: string): CalendarMonth {
  return { year: Number(isoDate.slice(0, 4)), month: Number(isoDate.slice(5, 7)) };
}

export function monthKey({ year, month }: CalendarMonth) {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`;
}

export function shiftMonth({ year, month }: CalendarMonth, by: number): CalendarMonth {
  const index = year * 12 + (month - 1) + by;
  return { year: Math.floor(index / 12), month: (index % 12) + 1 };
}

export function daysInMonth({ year, month }: CalendarMonth) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Blank cells before the first day in a calendar whose weeks start on Monday. */
export function leadingBlanks({ year, month }: CalendarMonth) {
  return (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
}

export function formatMonthName({ year, month }: CalendarMonth) {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
