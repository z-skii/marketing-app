#!/usr/bin/env node
// Runs `next dev` pointed at the local Supabase-compatible server (scripts/local-supabase/server.mjs).
// Usage: npm run dev:local [-- --port 3000]      (start `npm run local:supabase` in another terminal first)
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const supabasePort = process.env.LOCAL_SUPABASE_PORT || "54321";
const env = {
  ...process.env,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL_LOCAL || `http://127.0.0.1:${supabasePort}`,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "local-anon-key",
  SUPABASE_SERVICE_ROLE_KEY: process.env.LOCAL_SUPABASE_SERVICE_KEY || "local-service-role-key",
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
};

// Warn early when the local server is not reachable — the app would otherwise fail on every request.
try {
  const res = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/health`);
  if (!res.ok) throw new Error(`status ${res.status}`);
  console.log(`[dev:local] local supabase at ${env.NEXT_PUBLIC_SUPABASE_URL} is up`);
} catch (e) {
  console.warn(`[dev:local] local supabase at ${env.NEXT_PUBLIC_SUPABASE_URL} is not reachable (${e.message}). Start it with: npm run local:supabase`);
}

const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
const child = spawn(process.execPath, [nextBin, "dev", ...process.argv.slice(2)], { cwd: root, env, stdio: "inherit" });
child.on("exit", (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => child.kill(sig));
