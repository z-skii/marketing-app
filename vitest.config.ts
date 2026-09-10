import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      // Match tsconfig's "@/*" so tests can exercise src/lib modules directly.
      "@": path.resolve(__dirname, "src"),
      // Next.js handles this import in the bundler; under vitest it is a no-op.
      "server-only": path.resolve(__dirname, "tests/helpers/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // The money tests share one Postgres database, so they must not interleave.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
