import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./practice",
  timeout: 30_000,
  use: { baseURL: "https://starface-agentops.vercel.app" },
});
