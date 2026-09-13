import { defineConfig, devices } from "@playwright/test";

const PORT = 3300;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 1024, height: 768 },
    acceptDownloads: true,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "tablette",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1024, height: 768 } },
    },
  ],
  // Build de production : le parcours vérifie aussi la route PDF telle qu'elle tournera sur Vercel.
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/devis`,
    timeout: 300_000,
    reuseExistingServer: false,
    env: { NEXT_PUBLIC_DEMO: "true" },
  },
});
