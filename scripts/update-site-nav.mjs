import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const articlesDir = join(process.cwd(), "articles");

// canonical site navigation block reused across articles
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

const files = (await readdir(articlesDir)).filter((f) => f.endsWith(".html"));

for (const file of files) {
  const filePath = join(articlesDir, file);
  const html = await readFile(filePath, "utf8");
  const updated = html.replace(/^[ \t]*<ul class="site-nav">[\s\S]*?<\/ul>/m, navBlock);
  await writeFile(filePath, updated);
}
