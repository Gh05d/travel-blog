import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import layout from "./latest-layout.json" with { type: "json" };

const articlesDir = join(process.cwd(), "articles");
const indexFile = join(process.cwd(), "index.html");
const placeholderImg = "/assets/images/hero-image-fallback.jpg";

// Read article files
const files = (await readdir(articlesDir)).filter((f) => f.endsWith(".html"));
const entries = [];

for (const file of files) {
  const html = await readFile(join(articlesDir, file), "utf8");

  let title =
    html.match(
      /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i
    )?.[1] || "";
  title = title.replace(/^Travel Guide \|\s*/, "");

  const descMatch = html.match(
    /<p[^>]*itemprop=["']description["'][^>]*>([\s\S]*?)<\/p>/i
  );
  const description = descMatch
    ? descMatch[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
    : "";

  const publishDate =
    html.match(/<time[^>]*datetime=["']([^"']+)["']/i)?.[1] || "";

  const figureMatch = html.match(/<figure[\s\S]*?<img[^>]*>/i);
  let imageUrl = "";
  let imageAlt = "";
  if (figureMatch) {
    const imgTag = figureMatch[0].match(/<img[^>]*>/i)?.[0] || "";
    imageUrl = imgTag.match(/src=["']([^"']+)["']/i)?.[1] || "";
    imageAlt = imgTag.match(/alt=["']([^"']*)["']/i)?.[1] || "";
  }

  entries.push({
    title,
    url: `/articles/${file}`,
    description,
    publishDate,
    imageUrl,
    imageAlt,
  });
}

entries.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));
const latest = entries.slice(0, 12);

const parts = latest.map((article, index) => {
  const { title, url, description, imageUrl, imageAlt } = article;
  const { hasImage, width, height } = layout[index] ?? {};
  let content = "";
  if (hasImage) {
    const src = imageUrl || placeholderImg;
    const alt = imageAlt || title;
    const w = Number.isFinite(width) ? width : 220;
    const h = Number.isFinite(height) ? height : 120;
    content += `          <a href="${url}">\n`;
    content += `            <img src="${src}" alt="${alt}" width="${w}" height="${h}" loading="lazy" decoding="async" />\n`;
    content += "          </a>\n";
  }
  content += `          <h3>\n`;
  content += `            <a href="${url}">${title}</a>\n`;
  content += "          </h3>\n";
  content += "          <p>\n";
  content += `            ${description}\n`;
  content += "          </p>";
  return `        <article class=\"post\">\n${content}\n        </article>`;
});

const newMarkup = `<div id=\"latest-posts\">\n${parts.join("\n")}\n        </div>`;

const indexHtml = await readFile(indexFile, "utf8");
const updatedHtml = indexHtml.replace(
  /<div id="latest-posts">[\s\S]*?<\/div>/,
  newMarkup
);

await writeFile(indexFile, updatedHtml);

await import("./update-random-articles.mjs");
