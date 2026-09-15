import { describe, expect, it } from "vitest";
import { rememberCookieOptions, remembers, withRememberChoice } from "./remember";

const authCookie = { path: "/", sameSite: "lax" as const, httpOnly: false, maxAge: 34_560_000 };

describe("remembers", () => {
  it("keeps players signed in unless they opted out", () => {
    expect(remembers(undefined)).toBe(true);
    expect(remembers("1")).toBe(true);
    expect(remembers("0")).toBe(false);
  });
});

describe("withRememberChoice", () => {
  it("leaves auth cookies alone for players who stay signed in", () => {
    expect(withRememberChoice("token", authCookie, true)).toBe(authCookie);
  });

  it("turns auth cookies into browser session cookies for players who opted out", () => {
    const options = withRememberChoice("token", { ...authCookie, expires: new Date() }, false);
    expect(options).not.toHaveProperty("maxAge");
    expect(options).not.toHaveProperty("expires");
    expect(options.path).toBe("/");
  });

  it("still lets cookies be cleared", () => {
    expect(withRememberChoice("", { ...authCookie, maxAge: 0 }, false).maxAge).toBe(0);
    expect(withRememberChoice("token", { ...authCookie, maxAge: 0 }, false).maxAge).toBe(0);
  });
});

describe("rememberCookieOptions", () => {
  it("only gives the choice a lifetime when the player stays signed in", () => {
    expect(rememberCookieOptions(true).maxAge).toBeGreaterThan(0);
    expect(rememberCookieOptions(false)).not.toHaveProperty("maxAge");
    expect(rememberCookieOptions(false).httpOnly).toBe(true);
  });
});
