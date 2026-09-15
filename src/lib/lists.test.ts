import { describe, expect, it, vi } from "vitest";
import { parseListId } from "./lists";

// The list helpers share a module with the Supabase queries, which need a live project.
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

describe("parseListId", () => {
  it("reads a positive list id from the URL", () => {
    expect(parseListId("1")).toBe(1);
    expect(parseListId("4821")).toBe(4821);
  });

  it("rejects anything that is not a plain positive id", () => {
    expect(parseListId("0")).toBeNull();
    expect(parseListId("012")).toBeNull();
    expect(parseListId("-3")).toBeNull();
    expect(parseListId("1.5")).toBeNull();
    expect(parseListId("12abc")).toBeNull();
    expect(parseListId("12345678901234567")).toBeNull();
    expect(parseListId(12)).toBeNull();
    expect(parseListId(undefined)).toBeNull();
  });
});
