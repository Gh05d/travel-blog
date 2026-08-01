import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const articlesDir = join(root, "articles");
const extraFiles = [
  "index.html",
  "search-results.html",
  "latest-articles.html",
  "most-read-articles.html",
].map((f) => join(root, f));

const navBlock = `      <nav aria-label="Main site navigation">
        <a rel="home" href="/travel-blog/" id="title" aria-label="Travel Guide home"><picture class="logo"><source srcset="/travel-blog/assets/logo.avif" type="image/avif" /><img src="/travel-blog/assets/logo.png" alt="Travel Guide logo" class="logo" width="114" height="64" /></picture></a>
        <ul class="site-nav">
          <li>
            <a href="/travel-blog/latest-articles.html">Latest Articles</a>
          </li>
          <li>
            <a href="/travel-blog/most-read-articles.html">Most Read Articles</a>
          </li>
          <li>
            <a href="/travel-blog/articles/exploring-amsterdams-charm-beyond-typical-tourist-spots.html">Top Destinations</a>
          </li>
          <li>
            <a href="/travel-blog/articles/navigating-japans-rising-tourism-avoid-crowds.html">Editor's Pick</a>
          </li>
        </ul>
      </nav>`;

const articleFiles = (await readdir(articlesDir)).filter((f) =>
  f.endsWith(".html")
);
const targets = articleFiles
  .map((f) => join(articlesDir, f))
  .concat(extraFiles);

for (const filePath of targets) {
  const html = await readFile(filePath, "utf8");
  const updated = html.replace(
    /<nav aria-label="Main site navigation">[\s\S]*?<\/nav>/,
    navBlock
  );
  await writeFile(filePath, updated);
}
