import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { getLatestArticles } from "./lib/get-latest-articles.mjs";

const root = process.cwd();
const configFile = join(root, "scripts", "featured.json");
const indexFile = join(root, "index.html");

// Load config (create default if missing)
let config;
try {
  config = JSON.parse(await readFile(configFile, "utf8"));
} catch (err) {
  if (err.code === "ENOENT") {
    console.log("featured.json not found, using newest articles as default");
    config = { topStory: null, trending: [] };
  } else {
    console.error("Error parsing featured.json:", err.message);
    process.exit(1);
  }
}

// Load all articles
const allArticles = await getLatestArticles();
if (allArticles.length === 0) {
  console.error("Error: No articles found");
  process.exit(1);
}

// Build a map of filename -> article for quick lookup
const articleMap = new Map();
for (const article of allArticles) {
  const filename = article.url.replace("/articles/", "");
  articleMap.set(filename, article);
}

// Validate and resolve Top Story
let topStory;
if (config.topStory) {
  if (!articleMap.has(config.topStory)) {
    console.error(`Error: Featured article not found: ${config.topStory}`);
    process.exit(1);
  }
  topStory = articleMap.get(config.topStory);
} else {
  topStory = allArticles[0]; // newest
}

// Validate and resolve Trending (up to 3, excluding Top Story)
const trending = [];
const pinnedTrending = config.trending || [];

for (const filename of pinnedTrending) {
  if (!articleMap.has(filename)) {
    console.error(`Error: Featured article not found: ${filename}`);
    process.exit(1);
  }
  const article = articleMap.get(filename);
  if (article.url !== topStory.url) {
    trending.push(article);
  }
}

// Fill remaining slots with newest articles (up to 3 total)
for (const article of allArticles) {
  if (trending.length >= 3) break;
  if (article.url === topStory.url) continue;
  if (trending.some((t) => t.url === article.url)) continue;
  trending.push(article);
}

// Generate Top Story HTML
function buildTopStoryHtml(article) {
  const date = new Date(article.publishDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `      <section id="top-story">
        <h2>Top Story</h2>

        <div class="card">
          <a
            aria-label="${article.title}"
            href="${article.url}"
          >
            <picture>
              <!-- Desktop: full-width -->
              <source
                media="(min-width:76rem)"
                srcset="/assets/images/hero-image.avif 1080w"
                sizes="(min-width:76rem) 76rem, 100vw"
              />

              <!-- Tablet -->
              <source
                media="(min-width:38rem)"
                srcset="/assets/images/hero-image-medium.avif 800w"
                sizes="(min-width:38rem) 38rem, 100vw"
              />

              <!-- Mobile fallback -->
              <source
                media="(max-width:37.99rem)"
                srcset="/assets/images/hero-image-small.avif 400w"
                sizes="100vw"
              />

              <!-- Fallback for browsers that don't support AVIF -->
              <img
                src="/assets/images/hero-image-fallback.jpg"
                srcset="/assets/images/hero-image-fallback.jpg 400w"
                sizes="100vw"
                alt="${article.imageAlt || article.title}"
                decoding="async"
                width="1080"
                height="400"
                fetchpriority="high"
              />
            </picture>
          </a>

          <h3>
            <a href="${article.url}"
              >${article.title}
            </a>
          </h3>

          <div id="published">
            <div class="author">By <a href="/authors/${article.authorSlug}.html"><img src="/assets/team/${article.authorSlug}.webp" alt="${article.author}" class="author-thumb" /> ${article.author}</a></div>
            <div class="published">Published:
              <em><time itemprop="datePublished" datetime="${article.publishDate}">${date}</time></em>
            </div>
          </div>

          <p>
            ${article.description}
          </p>
        </div>
      </section>`;
}

// Generate Trending card HTML
function buildTrendingCardHtml(article) {
  const date = new Date(article.publishDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Resize image for trending cards
  const smallImg = article.imageUrl
    .replace(/w=\d+/, "w=200")
    .replace(/h=\d+/, "h=75");
  const largeImg = article.imageUrl
    .replace(/w=\d+/, "w=400")
    .replace(/h=\d+/, "h=150");

  return `          <div class="card">
            <a
              aria-label="${article.title}"
              href="${article.url}"
            >
              <picture>
                <img
                  src="${smallImg}"
                  srcset="
                    ${smallImg} 200w,
                    ${largeImg} 400w
                  "
                  sizes="(min-width:76rem) 18rem, 100vw"
                  alt="${article.imageAlt || article.title}"
                  decoding="async"
                  loading="lazy"
                  width="400"
                  height="150"
                />
              </picture>
            </a>

            <h3>
              <a href="${article.url}"
                >${article.title}
              </a>
            </h3>

            <div id="published">
              <div class="author">By <a href="/authors/${article.authorSlug}.html"><img src="/assets/team/${article.authorSlug}.webp" alt="${article.author}" class="author-thumb" /> ${article.author}</a></div>
              <div class="published">Published:
                <em><time itemprop="datePublished" datetime="${article.publishDate}">${date}</time></em>
              </div>
            </div>

            <p>
              ${article.description}
            </p>
          </div>`;
}

// Generate full Trending section HTML
function buildTrendingSectionHtml(articles) {
  const cards = articles.map(buildTrendingCardHtml).join("\n\n");

  return `      <section>
        <hr />
        <h2 class="divider">Trending</h2>
        <hr />

        <div class="posts">
${cards}
        </div>
      </section>`;
}

// Read index.html and replace sections
let html = await readFile(indexFile, "utf8");

// Replace Top Story section
html = html.replace(
  /<section id="top-story">[\s\S]*?<\/section>/,
  buildTopStoryHtml(topStory)
);

// Replace Trending section (matched by the h2 divider)
html = html.replace(
  /<section>\s*<hr \/>\s*<h2 class="divider">Trending<\/h2>[\s\S]*?<\/section>/,
  buildTrendingSectionHtml(trending)
);

await writeFile(indexFile, html);

console.log(`Updated homepage: Top Story = "${topStory.title}"`);
console.log(`Trending: ${trending.map((a) => a.title).join(", ")}`);
