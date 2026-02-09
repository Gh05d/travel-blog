/**
 * Migration script: Inject table of contents into all articles.
 *
 * Parses chapter headings from <section id="chapter-N"><h2>...</h2> and
 * generates a <nav> ToC block. Inserts it after the #info div, before the
 * description paragraph.
 *
 * Usage:
 *   node scripts/inject-table-of-contents.mjs            # dry-run
 *   node scripts/inject-table-of-contents.mjs --apply     # apply
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

for (const file of files) {
  const filePath = join(ARTICLES_DIR, file);
  const html = await readFile(filePath, "utf-8");

  // Skip if already has ToC
  if (html.includes('id="table-of-contents"')) {
    console.log(`  [skip] ${file} – already has ToC`);
    skipped++;
    continue;
  }

  // Extract chapter headings
  const headings = [
    ...html.matchAll(
      /<section\s+id="(chapter-\d+)">\s*<h2>([^<]+)<\/h2>/gi,
    ),
  ];
  if (headings.length < 2) {
    console.log(`  [skip] ${file} – fewer than 2 chapters`);
    skipped++;
    continue;
  }

  const items = headings
    .map(
      ([, id, text]) => `      <li><a href="#${id}">${text}</a></li>`,
    )
    .join("\n");

  const toc = `\n<nav id="table-of-contents" aria-label="Table of contents">\n  <h2>In This Article</h2>\n  <ol>\n${items}\n  </ol>\n</nav>\n`;

  // Insert after </div> of #info block, before <p itemprop="description">
  const updated = html.replace(
    /(<\/div>\s*\n\s*)(<p itemprop="description">)/,
    `$1${toc}  $2`,
  );

  if (updated === html) {
    console.log(`  [skip] ${file} – insertion point not found`);
    skipped++;
    continue;
  }

  if (dryRun) {
    console.log(`  [fix]  ${file} – ${headings.length} chapters`);
  } else {
    await writeFile(filePath, updated, "utf-8");
    console.log(`  [fixed] ${file}`);
  }
  fixed++;
}

console.log(`\nDone. ${fixed} fixed, ${skipped} skipped.`);
