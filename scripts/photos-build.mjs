// Builds the responsive photo library in public/photos from a folder of source JPEGs plus an ids.txt (name id per line). Usage: node scripts/photos-build.mjs <scratch root>
import sharp from "sharp"; import { readdirSync, mkdirSync, writeFileSync, readFileSync } from "fs";
const SP = process.argv[2]; const src = `${SP}/rd/photos/full`; const out = "public/photos";
mkdirSync(out, { recursive: true });
const ids = Object.fromEntries(readFileSync(`${SP}/rd/photos/ids.txt`, "utf8").trim().split("\n").map((l) => l.split(" ")));
const lines = ["# Photography credits", "", "Development photography from Unsplash (https://unsplash.com/license), chosen to match each feature. Replace with the business's own photography before scale.", ""];
for (const f of readdirSync(src).filter((f) => f.endsWith(".jpg"))) {
  const name = f.replace(/\.jpg$/, ""); const img = sharp(`${src}/${f}`).rotate(); const meta = await img.metadata();
  for (const w of [640, 1200, 1800]) await img.clone().resize({ width: w, withoutEnlargement: true }).avif({ quality: 56, effort: 4 }).toFile(`${out}/${name}-${w}.avif`);
  await img.clone().resize({ width: 1200, withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toFile(`${out}/${name}-1200.jpg`);
  lines.push(`- ${name}: https://unsplash.com/photos/${ids[name] ?? ""} (${meta.width}x${meta.height})`);
}
writeFileSync(`${out}/CREDITS.md`, lines.join("\n") + "\n"); console.log("done", readdirSync(out).length, "entries");
