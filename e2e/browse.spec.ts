import { expect, test } from "@playwright/test";

test.describe("signed-out visitor", () => {
  test("sees the attract screen and can start signing up", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "Keep score of every game you play" })).toBeVisible();
    await page.getByRole("link", { name: "Insert coin" }).click();
    await expect(page).toHaveURL(/\/sign-up$/);
  });

  test("browses games and opens a game page", async ({ page }) => {
    await page.goto("/games");
    await expect(page.getByRole("navigation", { name: "Sort games" })).toBeVisible();

    const firstGame = page.locator('main ul a[href^="/games/"]').first();
    await expect(firstGame).toBeVisible();
    await firstGame.click();

    await expect(page).toHaveURL(/\/games\/[a-z0-9-]+$/);
    await expect(page.getByText("Hi-score")).toBeVisible();
    await expect(page.getByText("Top reviews")).toBeVisible();
    await expect(page.getByRole("link", { name: "Press start to log" })).toHaveAttribute("href", "/sign-in");
  });

  test("keeps loading games while scrolling and can jump back to the top", async ({ page }) => {
    await page.goto("/games");
    const cards = page.locator('main ul > li a[href^="/games/"]');
    await expect(cards.first()).toBeVisible();

    await page.mouse.wheel(0, 20_000);
    await expect.poll(() => cards.count(), { timeout: 30_000 }).toBeGreaterThan(36);

    const backToTop = page.getByRole("button", { name: "Back to top" });
    await expect(backToTop).toBeVisible();
    await backToTop.click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  });

  test("searches for a game", async ({ page }) => {
    await page.goto("/search?q=celeste");
    await expect(page.getByText(/results? for "celeste"/i)).toBeVisible();
    await expect(page.locator('main a[href="/games/celeste"]')).toBeVisible();
  });

  test("picks a game from the header search dropdown", async ({ page }) => {
    await page.goto("/lists");
    const search = page.getByRole("combobox", { name: "Search >" });
    await search.fill("celeste");

    const options = page.getByRole("option");
    await expect(options.first()).toBeVisible({ timeout: 15_000 });
    expect(await options.count()).toBeLessThanOrEqual(5);
    await expect(page.getByRole("link", { name: /See all results for "celeste"/i })).toHaveAttribute(
      "href",
      "/search?q=celeste",
    );

    await search.press("ArrowDown");
    await search.press("Enter");
    await expect(page).toHaveURL(/\/games\/[a-z0-9-]+$/);
  });

  test("filters players while typing", async ({ page }) => {
    await page.goto("/players?sort=newest");
    const firstName = await page.locator('main li a[href^="/players/"]').first().getAttribute("href");
    const username = decodeURIComponent(firstName!.replace("/players/", ""));

    await page.getByRole("searchbox", { name: "Username" }).fill(username);
    await expect(page).toHaveURL(`/players?sort=newest&q=${encodeURIComponent(username)}`);
    await expect(page.locator(`main li a[href="/players/${encodeURIComponent(username)}"]`).first()).toBeVisible();
  });

  test("opens a player profile from the directory", async ({ page }) => {
    await page.goto("/players");
    const firstPlayer = page.locator('main li a[href^="/players/"]').first();
    await expect(firstPlayer).toBeVisible();
    await firstPlayer.click();

    await expect(page.getByText("> Player profile")).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Shelves" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Games" })).toBeVisible();
  });

  test("shows lists", async ({ page }) => {
    await page.goto("/lists");
    await expect(page.getByRole("heading", { level: 1, name: "Lists" })).toBeVisible();
    await expect(page.getByRole("link", { name: "+ New list" })).toHaveAttribute("href", "/sign-in");
  });

  test("gets the level not found screen for a missing list", async ({ page }) => {
    await page.goto("/lists/999999999");
    await expect(page.getByRole("heading", { name: "Level not found" })).toBeVisible();
  });
});

test.describe("mobile visitor", () => {
  test("reaches every section from the header @mobile", async ({ page }) => {
    await page.goto("/");
    const sections = page.getByRole("navigation", { name: "Sections" });
    await expect(sections).toBeVisible();
    await sections.getByRole("link", { name: "Players" }).click();
    await expect(page).toHaveURL(/\/players$/);
  });

  test("fits the screen without sideways scrolling @mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const path of ["/", "/games", "/lists", "/players", "/search?q=zelda", "/sign-in"]) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, path).toBeLessThanOrEqual(0);
    }
  });
});
