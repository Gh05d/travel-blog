import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import layout from "./latest-layout.json" with { type: "json" };
import { getLatestArticles } from "./lib/get-latest-articles.mjs";

const indexFile = join(process.cwd(), "index.html");
const latestArticlesFile = join(process.cwd(), "latest-articles.html");
const placeholderImg = "/assets/images/hero-image-fallback.jpg";

const latest = await getLatestArticles(12);

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

function buildMarkup(posts) {
  return posts
    .map((post) => {
      const date = new Date(post.publishDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const alt = post.imageAlt || post.title;
      const image = post.imageUrl
        .replace(/w=\d+/g, "w=1300")
        .replace(/h=\d+/g, "h=500");
      return (
        `    <div class="card">\n` +
        `      <a aria-label="${alt}" href="${post.url}">\n` +
        `        <picture>\n` +
        `          <img src="${image}" srcset="${image}&dpr=2 2x,\n                ${image} 1x" sizes="(min-width:38rem) 38rem, 100vw" alt="${alt}" loading="lazy" decoding="async" width="1300" height="500" />\n` +
        `        </picture>\n` +
        `      </a>\n\n` +
        `      <h3><a href="${post.url}">${post.title}</a></h3>\n\n` +
        `      <div id="published">\n` +
        `        Published:\n` +
        `        <em><time itemprop="datePublished" datetime="${post.publishDate}">\n` +
        `            ${date}</time></em>\n` +
        `      </div>\n\n` +
        `      <p>${post.description}</p>\n` +
        `    </div>`
      );
    })
    .join("\n");
}

const markup = buildMarkup(latest);
const latestHtml = await readFile(latestArticlesFile, "utf8");
const updatedLatestHtml = latestHtml.replace(
  /<section id="results">[\s\S]*?<\/section>/,
  `<section id="results">\n${markup}\n      </section>`
);
await writeFile(latestArticlesFile, updatedLatestHtml);

await import("./update-random-articles.mjs");
