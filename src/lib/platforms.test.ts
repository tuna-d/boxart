import { describe, expect, it } from "vitest";
import { cleanPlatforms, defaultGamePlatform, isPlatformId, platformLabel } from "./platforms";

describe("cleanPlatforms", () => {
  it("drops unknown values and repeats and keeps the list order", () => {
    expect(cleanPlatforms(["switch", "pc", "gamecube", "pc", 3, null])).toEqual(["pc", "switch"]);
  });

  it("returns an empty list when nothing is picked", () => {
    expect(cleanPlatforms([])).toEqual([]);
  });
});

describe("isPlatformId", () => {
  it("only accepts known ids", () => {
    expect(isPlatformId("ps5")).toBe(true);
    expect(isPlatformId("PS5")).toBe(false);
    expect(isPlatformId(undefined)).toBe(false);
  });
});

describe("platformLabel", () => {
  it("returns the short name shown on badges", () => {
    expect(platformLabel("xbox-series")).toBe("Xbox Series");
  });
});

describe("defaultGamePlatform", () => {
  it("picks the first game platform the player plays on", () => {
    expect(defaultGamePlatform(["PC", "PS5", "Switch"], ["switch", "ps5"])).toBe("PS5");
  });

  it("maps grouped platforms to game platform names", () => {
    expect(defaultGamePlatform(["Switch", "iOS"], ["mobile"])).toBe("iOS");
    expect(defaultGamePlatform(["PS5", "PC"], ["steam-deck"])).toBe("PC");
  });

  it("returns null when nothing matches", () => {
    expect(defaultGamePlatform(["PS5"], ["pc"])).toBeNull();
    expect(defaultGamePlatform(["PS5"], [])).toBeNull();
  });
});
