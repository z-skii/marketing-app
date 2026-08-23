// Applies one SQL migration file to the production database, using the
// DATABASE_URL from a previously pulled .env.vercel. Run from the repo root:
//   npx vercel env pull .env.vercel --environment=production --yes
//   node scripts/apply-prod-migration.mjs supabase/migrations/0007_member_numbers.sql
import { readFileSync } from "node:fs";
import pg from "pg";

const file = process.argv[2];
if (!file) {
  console.log("Usage: node scripts/apply-prod-migration.mjs <migration.sql>");
  process.exit(1);
}

const env = readFileSync(".env.vercel", "utf8");
const match = env.match(/^DATABASE_URL="?([^"\n]+)"?$/m);
if (!match) {
  console.log("DATABASE_URL not found in .env.vercel");
  process.exit(1);
}
const url = match[1].trim();
const local = url.includes("127.0.0.1") || url.includes("localhost");

const pool = new pg.Pool({
  connectionString: url,
  max: 1,
  ssl: local ? undefined : { rejectUnauthorized: false },
});

const sqlText = readFileSync(file, "utf8");
try {
  await pool.query(sqlText);
  console.log(`APPLIED ${file}`);
} catch (e) {
  console.log(`FAILED: ${e.message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
