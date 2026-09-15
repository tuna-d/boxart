import { describe, expect, it } from "vitest";
import {
  daysInMonth,
  formatMonthName,
  isValidDay,
  leadingBlanks,
  monthKey,
  monthOf,
  parseMonth,
  shiftMonth,
} from "./calendar";

describe("isValidDay", () => {
  it("accepts real calendar days", () => {
    expect(isValidDay("2026-09-15")).toBe(true);
    expect(isValidDay("2024-02-29")).toBe(true);
  });

  it("rejects days that do not exist or are badly formatted", () => {
    expect(isValidDay("2026-02-29")).toBe(false);
    expect(isValidDay("2026-13-01")).toBe(false);
    expect(isValidDay("2026-9-15")).toBe(false);
    expect(isValidDay("yesterday")).toBe(false);
  });
});

describe("parseMonth", () => {
  it("reads YYYY-MM from the URL", () => {
    expect(parseMonth("2026-09")).toEqual({ year: 2026, month: 9 });
  });

  it("returns null for anything else", () => {
    expect(parseMonth("2026-00")).toBeNull();
    expect(parseMonth("2026-13")).toBeNull();
    expect(parseMonth(["2026-09"])).toBeNull();
    expect(parseMonth(undefined)).toBeNull();
  });
});

describe("month arithmetic", () => {
  it("moves across year boundaries", () => {
    expect(shiftMonth({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 });
    expect(shiftMonth({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 });
    expect(shiftMonth({ year: 2026, month: 9 }, -21)).toEqual({ year: 2024, month: 12 });
  });

  it("round-trips a month through its key", () => {
    const month = monthOf("2026-09-15");
    expect(monthKey(month)).toBe("2026-09");
    expect(parseMonth(monthKey(month))).toEqual(month);
  });

  it("knows month lengths, including leap years", () => {
    expect(daysInMonth({ year: 2024, month: 2 })).toBe(29);
    expect(daysInMonth({ year: 2026, month: 2 })).toBe(28);
    expect(daysInMonth({ year: 2026, month: 9 })).toBe(30);
  });

  it("counts blank cells before the first day in a Monday-first week", () => {
    // September 1, 2026 is a Tuesday and February 1, 2026 is a Sunday.
    expect(leadingBlanks({ year: 2026, month: 9 })).toBe(1);
    expect(leadingBlanks({ year: 2026, month: 2 })).toBe(6);
  });

  it("names a month", () => {
    expect(formatMonthName({ year: 2026, month: 9 })).toBe("September 2026");
  });
});
