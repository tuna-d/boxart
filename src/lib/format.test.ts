import { describe, expect, it } from "vitest";
import { formatDate, formatMonthYear, releaseYear, timeAgo } from "./format";

describe("releaseYear", () => {
  it("reads the year from a release date", () => {
    expect(releaseYear("2019-05-28")).toBe("2019");
  });

  it("shows TBA when there is no release date", () => {
    expect(releaseYear(null)).toBe("TBA");
  });
});

describe("formatDate", () => {
  it("formats the calendar day without shifting time zones", () => {
    expect(formatDate("2026-09-15")).toBe("Sep 15, 2026");
    expect(formatDate("2026-09-15T23:59:00Z")).toBe("Sep 15, 2026");
  });

  it("formats month and year", () => {
    expect(formatMonthYear("2026-01-01")).toBe("Jan 2026");
  });
});

describe("timeAgo", () => {
  const now = Date.parse("2026-09-15T12:00:00Z");
  const ago = (ms: number) => new Date(now - ms).toISOString();
  const minute = 60_000;

  it("counts up from just now to days", () => {
    expect(timeAgo(ago(20_000), now)).toBe("just now");
    expect(timeAgo(ago(5 * minute), now)).toBe("5m ago");
    expect(timeAgo(ago(3 * 60 * minute), now)).toBe("3h ago");
    expect(timeAgo(ago(2 * 24 * 60 * minute), now)).toBe("2d ago");
  });

  it("switches to a date after a week", () => {
    expect(timeAgo("2026-09-01T08:00:00Z", now)).toBe("Sep 1, 2026");
  });
});
