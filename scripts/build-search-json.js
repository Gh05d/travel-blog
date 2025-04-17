const fs = require("fs");
const path = require("path");

const ARTICLES_DIR = path.join(__dirname, "..", "articles");
const OUT_FILE = path.join(__dirname, "..", "search.json");

function extractMeta(html, tag) {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = html.match(re);
  return m ? m[1].trim() : "";
}

function extractExcerpt(html) {
  // Try a <meta name="description" content="..."> first
  const metaRe = /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i;
  const mm = html.match(metaRe);
  if (mm) return mm[1].trim();
  // Fallback: first <p>…</p>
  const pRe = /<p>([\s\S]*?)<\/p>/i;
  const pm = html.match(pRe);
  return pm ? pm[1].replace(/<[^>]+>/g, "").trim() : "";
}

// Read all .html files in /articles
const files = fs
  .readdirSync(ARTICLES_DIR, { withFileTypes: true })
  .filter((dirent) => dirent.isFile() && dirent.name.endsWith(".html"))
  .map((dirent) => dirent.name);

const entries = files.map((filename) => {
  const fullPath = path.join(ARTICLES_DIR, filename);
  const html = fs.readFileSync(fullPath, "utf8");

  const title = extractMeta(html, "title") || extractMeta(html, "h1");
  const excerpt = extractExcerpt(html);
  const url = `articles/${filename}`;

  return { title, excerpt, url };
});

// Write out pretty‑printed JSON
fs.writeFileSync(OUT_FILE, JSON.stringify(entries, null, 2), "utf8");

// Log for debug
console.log(`🔍 Built ${entries.length} entries into search.json`);
