import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, basename } from "node:path";

const root = process.cwd();
const articlesDir = join(root, "articles");

const files = (await readdir(articlesDir))
  .filter((f) => f.endsWith(".html"))
  .sort();

for (const file of files) {
  const filePath = join(articlesDir, file);
  let html = await readFile(filePath, "utf8");
  const slug = basename(file, ".html");

  // Clean any existing <figure> inside the sidebar
  const sidebarStart = html.indexOf('<aside id="sidebar">');
  if (sidebarStart !== -1) {
    const sidebarEnd = html.indexOf("</aside>", sidebarStart);
    if (sidebarEnd !== -1) {
      const sidebar = html.slice(sidebarStart, sidebarEnd);
      const cleanedSidebar = sidebar.replace(/\n?<figure>[\s\S]*?<\/figure>\n?/, "\n");
      html = html.slice(0, sidebarStart) + cleanedSidebar + html.slice(sidebarEnd);
    }
  }

  const articleStart = html.indexOf("<article");
  if (articleStart === -1) continue;
  const articleEndIndex = html.indexOf("</article>", articleStart);
  const asideIndex = html.indexOf('<aside id="sidebar">');
  const bound = asideIndex !== -1 ? asideIndex : (articleEndIndex !== -1 ? articleEndIndex : html.length);
  const articleContent = html.slice(articleStart, bound);

  // Skip if the placeholder image for this slug already exists
  if (articleContent.includes("picsum.photos/seed/" + slug)) continue;

  const sectionMatches = [...articleContent.matchAll(/<section/gi)];
  let insertPos = articleEndIndex !== -1 ? articleEndIndex : bound;

  // Prefer inserting after the 3rd closing section, else after the 2nd, else before </article>
  if (sectionMatches.length >= 3) {
    let idx = -1;
    let count = 0;
    const regex = /<\/section>/gi;
    let match;
    while ((match = regex.exec(articleContent)) && count < 3) {
      idx = match.index;
      count++;
    }
    if (idx !== -1) insertPos = articleStart + idx + "</section>".length;
  } else if (sectionMatches.length >= 2) {
    let idx = -1;
    let count = 0;
    const regex = /<\/section>/gi;
    let match;
    while ((match = regex.exec(articleContent)) && count < 2) {
      idx = match.index;
      count++;
    }
    if (idx !== -1) insertPos = articleStart + idx + "</section>".length;
  }

  const figureMarkup = `\n        <figure>\n          <picture>\n            <!-- Desktop -->\n            <source type="image/webp" media="(min-width:76rem)" srcset="https://picsum.photos/seed/${slug}/1080/400.webp" />\n            <source media="(min-width:76rem)" srcset="https://picsum.photos/seed/${slug}/1080/400.jpg" />\n            <!-- Tablet -->\n            <source type="image/webp" media="(min-width:38rem)" srcset="https://picsum.photos/seed/${slug}/800/300.webp" />\n            <source media="(min-width:38rem)" srcset="https://picsum.photos/seed/${slug}/800/300.jpg" />\n            <!-- Mobile Fallback -->\n            <img src="https://picsum.photos/seed/${slug}/400/200.jpg" alt="Random placeholder photo" title="Photo via https://picsum.photos" width="1080" height="400" loading="lazy" decoding="async" />\n          </picture>\n        </figure>\n`;

  const updated = html.slice(0, insertPos) + figureMarkup + html.slice(insertPos);
  if (updated !== html) {
    await writeFile(filePath, updated);
  }
}

