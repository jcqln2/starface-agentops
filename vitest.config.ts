import { defineConfig } from "vitest/config";
export default defineConfig({ test: { include: ["tests/**/*.test.ts"], env: { MOCK_LATENCY: "0" } } });
