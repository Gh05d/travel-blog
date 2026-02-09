/**
 * Migration script: Fix Schema.org JSON-LD date format in all articles.
 *
 * Problem:  datePublished / dateModified use "YYYY-MM-DD" (date-only).
 * Fix:      Replace with the full ISO 8601 datetime already present in the
 *           Open Graph <meta property="article:published_time"> tag.
 *
 * Usage:
 *   node scripts/fix-schema-dates.mjs            # dry-run (preview)
 *   node scripts/fix-schema-dates.mjs --apply     # apply changes
 */

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const ARTICLES_DIR = join(import.meta.dirname, "..", "articles");
const dryRun = !process.argv.includes("--apply");

if (dryRun) {
  console.log("=== DRY RUN (pass --apply to write changes) ===\n");
}

const files = (await readdir(ARTICLES_DIR)).filter((f) => f.endsWith(".html"));

let fixed = 0;
let skipped = 0;
const errors = [];

for (const file of files) {
  const filePath = join(ARTICLES_DIR, file);
  const html = await readFile(filePath, "utf-8");

  // Extract full datetime from Open Graph published_time
  const ogPublished = html.match(
    /article:published_time"\s+content="([^"]+)"/,
  );
  const ogModified = html.match(
    /article:modified_time"\s+content="([^"]+)"/,
  );

  if (!ogPublished) {
    errors.push(`${file}: missing article:published_time – skipped`);
    skipped++;
    continue;
  }

  const publishedDatetime = ogPublished[1]; // e.g. "2025-10-11T20:01:48.364Z"
  const modifiedDatetime = ogModified ? ogModified[1] : publishedDatetime;

  // Replace date-only values in Schema.org JSON-LD block
  let updated = html.replace(
    /("datePublished":\s*")(\d{4}-\d{2}-\d{2})(")/g,
    `$1${publishedDatetime}$3`,
  );
  updated = updated.replace(
    /("dateModified":\s*")(\d{4}-\d{2}-\d{2})(")/g,
    `$1${modifiedDatetime}$3`,
  );

  if (updated === html) {
    console.log(`  [skip] ${file} – already has full datetime or no match`);
    skipped++;
    continue;
  }

  if (dryRun) {
    console.log(`  [fix]  ${file}`);
    console.log(`         datePublished → ${publishedDatetime}`);
    console.log(`         dateModified  → ${modifiedDatetime}`);
  } else {
    await writeFile(filePath, updated, "utf-8");
    console.log(`  [fixed] ${file}`);
  }
  fixed++;
}

console.log(`\nDone. ${fixed} fixed, ${skipped} skipped.`);
if (errors.length) {
  console.log("\nErrors:");
  errors.forEach((e) => console.log(`  - ${e}`));
}
