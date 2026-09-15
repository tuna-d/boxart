import { describe, expect, it } from "vitest";
import { toneFor } from "./tone";

describe("toneFor", () => {
  it("gives the same text the same tone every time", () => {
    expect(toneFor("Outer Wilds")).toBe(toneFor("Outer Wilds"));
  });

  it("always returns a dark hex colour", () => {
    for (const text of ["", "a", "mira_ok", "The Legend of Zelda: Breath of the Wild", "ñandú 🎮"]) {
      expect(toneFor(text)).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});
