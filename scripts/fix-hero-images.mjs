/**
 * One-off script to fix broken hero image responsive URLs in all articles.
 *
 * Problems fixed:
 * 1. Broken srcset/preload URLs: `...&w=1080?w=200` → `...&w=200`
 *    (replaces the w= param value instead of appending a second query string)
 * 2. Missing `fetchpriority="high"` on hero <img> elements
 */

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const ARTICLES_DIR = join(import.meta.dirname, "..", "articles");

/**
 * Given a full Unsplash URL (which contains &w=1080 or similar),
 * return the URL with the w= param replaced to the given width.
 */
function replaceWidth(url, width) {
  return url.replace(/([?&])w=\d+/, `$1w=${width}`);
}

/**
 * Fix a single broken responsive URL pattern:
 * `<base_url>&w=1080?w=<N>` → `<base_url>&w=<N>`
 *
 * Matches any Unsplash URL ending in `w=<digits>?w=<digits>` and replaces
 * the w= value with the second (intended) width, removing the broken `?w=`.
 */
function fixBrokenWidthUrls(html) {
  // Pattern: ...w=<old>?w=<new> — the ?w=<new> was incorrectly appended
  // Replace with ...w=<new> (use the intended width)
  return html.replace(
    /(https:\/\/images\.unsplash\.com\/[^\s"']*[?&])w=\d+\?w=(\d+)/g,
    (_, prefix, intendedWidth) => `${prefix}w=${intendedWidth}`
  );
}

/**
 * Add fetchpriority="high" to the hero image (first <img> inside a <figure><picture>).
 * Only adds if not already present. Targets the hero img by matching the one
 * that does NOT have loading="lazy" (hero images are eager-loaded).
 */
function addFetchPriority(html) {
  // Match the first <img that has decoding="async" but NOT loading="lazy" and NOT fetchpriority
  // This targets the hero image specifically (secondary images have loading="lazy")
  let heroFixed = false;
  return html.replace(
    /(<figure>\s*<picture>[\s\S]*?<img\b)((?:(?!loading="lazy")[\s\S])*?)(decoding="async")/,
    (match, before, middle, decoding) => {
      if (heroFixed || match.includes('fetchpriority')) return match;
      heroFixed = true;
      return `${before}${middle}fetchpriority="high"\n      ${decoding}`;
    }
  );
}

async function main() {
  const entries = await readdir(ARTICLES_DIR);
  const htmlFiles = entries.filter((f) => f.endsWith(".html"));

  let fixedCount = 0;

  for (const file of htmlFiles) {
    const filePath = join(ARTICLES_DIR, file);
    const original = await readFile(filePath, "utf-8");

    let updated = fixBrokenWidthUrls(original);
    updated = addFetchPriority(updated);

    if (updated !== original) {
      await writeFile(filePath, updated, "utf-8");
      fixedCount++;
      console.log(`Fixed: ${file}`);
    } else {
      console.log(`Skipped (no changes): ${file}`);
    }
  }

  console.log(`\nDone. Fixed ${fixedCount}/${htmlFiles.length} files.`);
}

main();
