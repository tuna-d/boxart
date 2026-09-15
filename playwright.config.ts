import { defineConfig, devices } from "@playwright/test";

// Point E2E_BASE_URL at a deployed site to test it, otherwise a local server is started.
const externalBaseURL = process.env.E2E_BASE_URL;
const baseURL = externalBaseURL ?? "http://localhost:3000";
const isCI = Boolean(process.env.CI);
// Locally the tests drive the installed Chrome, so no browser download is needed.
const channel = isCI ? undefined : "chrome";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [["github"], ["html", { open: "never" }]] : "list",
  timeout: 60_000,
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel }, grepInvert: /@mobile/ },
    { name: "mobile", use: { ...devices["Pixel 7"], channel }, grep: /@mobile/ },
  ],
  webServer: externalBaseURL
    ? undefined
    : {
        command: isCI ? "npm run start" : "npm run dev",
        url: baseURL,
        reuseExistingServer: !isCI,
        timeout: 180_000,
      },
});
