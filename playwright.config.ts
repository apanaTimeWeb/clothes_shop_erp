import { defineConfig } from "@playwright/test";
// Local-user/CI runner. Managed Work Mode QA uses its supported browser controls instead.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  reporter: "list",
  use: {
    baseURL: process.env.DEMO_BASE_URL ?? "http://127.0.0.1:3000",
    trace: "retain-on-failure",
  },
  projects: [1280, 1024, 768, 390].map((width) => ({
    name: `chromium-${width}`,
    use: { browserName: "chromium" as const, viewport: { width, height: 900 } },
  })),
});
