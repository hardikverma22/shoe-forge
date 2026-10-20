import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  // CI runners render WebGL in software on two cores: one browser at a time keeps them stable.
  workers: process.env.CI ? 1 : undefined,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    // WebGL needs a real GPU path; SwiftShader keeps it working on CI and in headless runs.
    launchOptions: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] },
  },
  webServer: process.env.BASE_URL
    ? undefined
    : {
        // CI has already built the app in an earlier step; locally, build first.
        command: process.env.CI ? "npm run start -- -p 3000" : "npm run build && npm run start -- -p 3000",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } }],
});
