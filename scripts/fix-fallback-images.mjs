/**
 * fix-fallback-images.mjs
 *
 * Replaces the generic fallback hero image in articles with a relevant
 * Unsplash photo based on the article title / destination.
 *
 * Usage:
 *   node scripts/fix-fallback-images.mjs            # dry-run (preview)
 *   node scripts/fix-fallback-images.mjs --apply     # apply changes
 */

import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const ARTICLES_DIR = join(import.meta.dirname, "..", "articles");
const dryRun = !process.argv.includes("--apply");

const FALLBACK_ID = "photo-1488646953014-85cb44e25828";
const API_KEY = "H56-_etiQge5hB7GcbMm9lFAzP-V9S0p3uJ7HuXb5S0";

// Rate-limit: small delay between API calls to stay within Unsplash free tier
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Search Unsplash with cascading queries (most specific → least specific).
 * Returns the first result set that has matches, or null.
 */
async function searchUnsplash(queries) {
  for (const query of queries) {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&per_page=3`;
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${API_KEY}` },
    });
    if (!res.ok) {
      console.warn(`  API error for "${query}": ${res.status}`);
      continue;
    }
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      // Pick highest-liked image
      const best = data.results.sort(
        (a, b) => (b.likes || 0) - (a.likes || 0),
      )[0];
      console.log(`  Found image via query: "${query}" (${best.likes} likes)`);
      return best;
    }
  }
  return null;
}

/**
 * Extract a destination keyword from the article title.
 * Strips common prefixes like "Exploring", "Discovering", etc.
 */
function extractDestination(title) {
  // Try to pull destination from the title
  const destinations = [
    "Japan",
    "Nice",
    "Paris",
    "Rome",
    "Bali",
    "Amsterdam",
    "Sydney",
    "South Africa",
    "Nepal",
  ];
  for (const dest of destinations) {
    if (title.toLowerCase().includes(dest.toLowerCase())) return dest;
  }
  // Fallback: use first significant words
  return title.replace(/^(Exploring|Discovering|Navigating|Experiencing|Savoring|Uncovering|Luxury|Budget)\s+/i, "").split(/[:\-–]/)[0].trim();
}

/**
 * Extract topic keywords from a title, removing destination and filler words.
 */
function extractTopicKeywords(title, destination) {
  const stopWords = new Set([
    "a", "an", "the", "and", "or", "of", "in", "for", "to", "through",
    "beyond", "from", "with", "how", "what", "why", "when", "most",
    "exploring", "discovering", "navigating", "experiencing", "savoring",
    "uncovering", "luxury", "budget", "guide", "tips", "tourists",
    "travel", "journey", "trail", "tourist", "spots", "unique",
    "rich", "finest", "best", "top", "essential", "practical",
    "japan", "japans", "nice", "nices", "paris", "rome", "bali",
    "amsterdam", "amsterdams", "sydney", "sydneys", "south", "africas",
    "africa", "nepals", "nepal",
  ]);
  return title
    .replace(/['':]/g, " ")
    .split(/\s+/)
    .map((w) => w.toLowerCase().replace(/[^a-z]/g, ""))
    .filter((w) => w.length > 2 && !stopWords.has(w));
}

/**
 * Build cascading search queries from an article title.
 */
function buildQueries(title) {
  const dest = extractDestination(title);
  const keywords = extractTopicKeywords(title, dest);

  const queries = [];

  // Query 1: destination + first 2-3 topic keywords (most specific)
  if (keywords.length >= 2) {
    queries.push(`${dest} ${keywords.slice(0, 3).join(" ")}`);
  }

  // Query 2: destination + first keyword
  if (keywords.length >= 1) {
    queries.push(`${dest} ${keywords[0]}`);
  }

  // Query 3: destination + "travel"
  queries.push(`${dest} travel`);

  // Query 4: just destination
  queries.push(dest);

  return queries;
}

/** Replace the fallback image URL (all width variants) with a new Unsplash URL */
function replaceImageUrls(html, oldId, newUrl, newAlt, newPageUrl, newWidth, newHeight) {
  // The fallback URL pattern (with varying w= values)
  const oldPattern = new RegExp(
    `https://images\\.unsplash\\.com/${oldId}[^"'\\s]*`,
    "g",
  );

  // Replace all occurrences of the old URL with the new base URL
  // but preserve the w= parameter for responsive variants
  let result = html.replace(oldPattern, (match) => {
    const wMatch = match.match(/[?&]w=(\d+)/);
    const width = wMatch ? wMatch[1] : "1080";
    return newUrl.replace(/([?&])w=\d+/, `$1w=${width}`);
  });

  // Replace the fallback alt text (only in the hero figure, not picsum images)
  result = result.replace(
    /alt="Travel destination landscape"/g,
    `alt="${newAlt}"`,
  );

  // Replace the fallback page URL in title attribute
  result = result.replace(
    /title="https:\/\/unsplash\.com\/photos\/photo-1488646953014-85cb44e25828"/g,
    `title="${newPageUrl}"`,
  );

  // Update width/height only on the hero image (identified by fetchpriority="high"),
  // NOT on the middle picsum image which also has width="1080" height="400"
  result = result.replace(
    /(fetchpriority="high"\s+decoding="async"\s+)width="1080"\s+height="400"/,
    `$1width="${newWidth}" height="${newHeight}"`,
  );

  return result;
}

async function main() {
  console.log(dryRun ? "DRY RUN (use --apply to write)\n" : "APPLYING changes\n");

  const files = (await readdir(ARTICLES_DIR)).filter((f) => f.endsWith(".html"));
  let fixed = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of files) {
    const filePath = join(ARTICLES_DIR, file);
    const html = await readFile(filePath, "utf-8");

    if (!html.includes(FALLBACK_ID)) {
      continue; // Not using fallback image
    }

    // Extract title from og:title
    const titleMatch = html.match(
      /<meta\s+property="og:title"\s+content="([^"]+)"/,
    );
    if (!titleMatch) {
      console.log(`SKIP ${file} — no og:title found`);
      skipped++;
      continue;
    }
    const title = titleMatch[1];
    console.log(`\n${file}`);
    console.log(`  Title: ${title}`);

    const queries = buildQueries(title);
    console.log(`  Queries: ${queries.join(" | ")}`);

    const image = await searchUnsplash(queries);

    if (!image) {
      console.log("  FAILED — no Unsplash results for any query");
      failed++;
      await delay(1000);
      continue;
    }

    const newUrl = image.urls.regular;
    const rawAlt = (image.alt_description || "").replace(/\\/g, "").trim();
    // Skip useless Unsplash alt descriptions (too short, generic, or just "text")
    const isUseful = rawAlt.length > 10 && !/^text$/i.test(rawAlt) && !/^photography of .* text$/i.test(rawAlt);
    const newAlt = isUseful ? rawAlt : `${extractDestination(title)} travel scene`;
    const newPageUrl = image.links?.html || "";
    // Use standard display dimensions, not Unsplash native (e.g. 6000x4000)
    const newWidth = 1080;
    const newHeight = 720;

    console.log(`  New image: ${newAlt}`);
    console.log(`  URL: ${newUrl.substring(0, 80)}...`);

    if (!dryRun) {
      const updated = replaceImageUrls(html, FALLBACK_ID, newUrl, newAlt, newPageUrl, newWidth, newHeight);
      await writeFile(filePath, updated, "utf-8");
      console.log("  WRITTEN");
    } else {
      console.log("  Would replace (dry-run)");
    }

    fixed++;
    // Rate limit: 1 second between articles to stay within 50 req/hour
    await delay(1200);
  }

  console.log(`\nDone: ${fixed} fixed, ${skipped} skipped, ${failed} failed`);
}

main().catch(console.error);
