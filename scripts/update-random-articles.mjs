import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const dataFile = join(root, "assets", "search.json");
const pages = [
  join(root, "latest-articles.html"),
  join(root, "most-read-articles.html"),
];

const navBlock = `        <ul class="site-nav">
          <li>
            <a href="/latest-articles.html"
              >Latest Articles</a
            >
          </li>
          <li>
            <a href="/most-read-articles.html"
              >Most Read Articles</a
            >
          </li>
          <li>
            <a href="/articles/top-10-hidden-gems-europe.html"
              >Top Destinations</a
            >
          </li>
          <li>
            <a href="/articles/navigating-night-markets-food-lovers-guide.html"
              >Editor’s Pick</a
            >
          </li>
        </ul>`;

const headerBlock = `    <header>
      <nav aria-label="Main site navigation">
        <a rel="home" href="/" id="title" aria-label="Travel Guide home"><picture class="logo"><source srcset="/assets/exitfloridakeys-logo.avif" type="image/avif" /><img src="/assets/exitfloridakeys-logo.png" alt="Travel Guide logo" class="logo" /></picture></a>
${navBlock}
      </nav>
      <hr />
    </header>`;

const searchData = JSON.parse(await readFile(dataFile, "utf8"));

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function buildMarkup(posts) {
  return posts
    .map((post) => {
      const date = new Date(post.publishDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const image = post.imageUrl
        .replace(/w=\d+/g, "w=1300")
        .replace(/h=\d+/g, "h=500");
      return `    <div class="card">\n` +
        `      <a aria-label="${post.imageAlt}" href="${post.url}">\n` +
        `        <picture>\n` +
        `          <img src="${image}" srcset="${image}&dpr=2 2x,\n                ${image} 1x" sizes="(min-width:38rem) 38rem, 100vw" alt="${post.imageAlt}" loading="lazy" decoding="async" width="1300" height="500" />\n` +
        `        </picture>\n` +
        `      </a>\n\n` +
        `      <h3><a href="${post.url}">${post.title}</a></h3>\n\n` +
        `      <div id="published">\n` +
        `        Published:\n` +
        `        <em><time itemprop="datePublished" datetime="${post.publishDate}">\n` +
        `            ${date}</time></em>\n` +
        `      </div>\n\n` +
        `      <p>${post.description}</p>\n` +
        `    </div>`;
    })
    .join("\n");
}

for (const page of pages) {
  const shuffled = shuffle([...searchData]);
  const count = Math.floor(Math.random() * 6) + 5;
  const markup = buildMarkup(shuffled.slice(0, count));
  const html = await readFile(page, "utf8");
  const updated = html
    .replace(/<header>[\s\S]*?<hr \/>\s*<\/header>/, headerBlock)
    .replace(
      /<section id="results">[\s\S]*?<\/section>/,
      `<section id="results">\n${markup}\n      </section>`
    );
  await writeFile(page, updated);
}
