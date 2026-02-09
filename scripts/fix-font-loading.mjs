/**
 * fix-font-loading.mjs
 *
 * Replaces render-blocking Google Fonts <link rel="stylesheet"> with
 * a non-blocking preload + media=print + onload pattern.
 *
 * Usage:
 *   node scripts/fix-font-loading.mjs            # dry-run
 *   node scripts/fix-font-loading.mjs --apply     # apply
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const ARTICLES_DIR = join(import.meta.dirname, "..", "articles");
const dryRun = !process.argv.includes("--apply");

const FONT_URL =
  "https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@400;600;700&display=swap";

// The blocking pattern (multiline)
const BLOCKING_RE = new RegExp(
  `<link\\s*\\n\\s*href="${FONT_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"\\s*\\n\\s*rel="stylesheet"\\s*\\n?\\s*/>`,
);

const NON_BLOCKING = `<link
    rel="preload"
    as="style"
    href="${FONT_URL}"
  />
  <link
    href="${FONT_URL}"
    rel="stylesheet"
    media="print"
    onload="this.media='all'"
  />
  <noscript>
    <link
      href="${FONT_URL}"
      rel="stylesheet"
    />
  </noscript>`;

const files = (await readdir(ARTICLES_DIR)).filter((f) => f.endsWith(".html"));
let fixed = 0;

for (const file of files) {
  const filePath = join(ARTICLES_DIR, file);
  const html = await readFile(filePath, "utf-8");

  if (!BLOCKING_RE.test(html)) continue;

  const updated = html.replace(BLOCKING_RE, NON_BLOCKING);

  if (updated !== html) {
    if (!dryRun) await writeFile(filePath, updated, "utf-8");
    console.log(`${dryRun ? "[dry]" : "[fix]"} ${file}`);
    fixed++;
  }
}

console.log(`\nDone: ${fixed} files ${dryRun ? "would be" : ""} fixed.`);
