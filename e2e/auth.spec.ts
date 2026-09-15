import { expect, test } from "@playwright/test";

test.describe("sign in", () => {
  test("keeps players signed in by default and lets them opt out", async ({ page }) => {
    await page.goto("/sign-in");
    const keepSignedIn = page.getByRole("checkbox", { name: "Keep me signed in" });
    await expect(keepSignedIn).toBeChecked();

    // Both the Google form and the email form carry the same choice.
    const choices = page.locator('input[type="hidden"][name="remember"]');
    await expect(choices).toHaveCount(2);
    await expect(choices.first()).toHaveValue("1");

    await page.getByText("Keep me signed in").click();
    await expect(keepSignedIn).not.toBeChecked();
    await expect(choices.first()).toHaveValue("0");
    await expect(choices.last()).toHaveValue("0");
  });

  test("offers Google and email sign in", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });

  test("checks the username format before sign up", async ({ page }) => {
    await page.goto("/sign-up");
    const username = page.getByLabel("Username");
    await username.fill("no spaces allowed");
    expect(await username.evaluate((input: HTMLInputElement) => input.validity.valid)).toBe(false);
    await username.fill("mira_ok");
    expect(await username.evaluate((input: HTMLInputElement) => input.validity.valid)).toBe(true);
  });
});

test.describe("pages for signed-in players", () => {
  for (const path of ["/settings", "/lists/new", "/notifications", "/activity"]) {
    test(`${path} sends visitors to sign in`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/sign-in$/);
    });
  }
});
