import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const articlesDir = join(process.cwd(), "articles");
const outputFile = join(process.cwd(), "assets", "search.json");

const files = (await readdir(articlesDir))
  .filter((f) => f.endsWith(".html"))
  .sort();
const index = [];

for (const file of files) {
  const html = await readFile(join(articlesDir, file), "utf8");

  let title =
    html.match(
      /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"]+)["'][^>]*>/i
    )?.[1] || "";
  title = title.replace(/^Travel Guide \|\s*/, "");
  const descMatch = html.match(
    /<p[^>]*itemprop=["']description["'][^>]*>([\s\S]*?)<\/p>/i
  );
  const description = descMatch
    ? descMatch[1]
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim()
    : "";
  const publishDate =
    html.match(/<time[^>]*datetime=["']([^"]+)["']/i)?.[1] || "";

  const figureMatch = html.match(/<figure[\s\S]*?<img[^>]*>/i);
  let imageUrl = "";
  let imageAlt = "";
  if (figureMatch) {
    const imgTag = figureMatch[0].match(/<img[^>]*>/i)?.[0] || "";
    imageUrl = imgTag.match(/src=["']([^"]+)["']/i)?.[1] || "";
    imageAlt = imgTag.match(/alt=["']([^"]*)["']/i)?.[1] || "";
  }

  index.push({
    title,
    url: `/articles/${file}`,
    imageAlt,
    description,
    publishDate,
    imageUrl,
  });
}

await writeFile(outputFile, JSON.stringify(index, null, 2));
