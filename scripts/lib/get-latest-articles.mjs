import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const articlesDir = join(process.cwd(), "articles");

export async function getLatestArticles(limit = Infinity) {
  const files = (await readdir(articlesDir)).filter((f) => f.endsWith(".html"));
  const entries = [];

  for (const file of files) {
    const html = await readFile(join(articlesDir, file), "utf8");

    let title =
      html.match(
        /<meta[^>]*property=['\"]og:title['\"][^>]*content=['\"]([^'\"]+)['\"][^>]*>/i
      )?.[1] || "";
    title = title.replace(/^Travel Guide \|\s*/, "");

    const descMatch = html.match(
      /<p[^>]*itemprop=['\"]description['\"][^>]*>([\s\S]*?)<\/p>/i
    );
    const description = descMatch
      ? descMatch[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
      : "";

    const publishDate =
      html.match(/<time[^>]*datetime=['\"]([^'\"]+)['\"]/i)?.[1] || "";

    const figureMatch = html.match(/<figure[\s\S]*?<img[^>]*>/i);
    let imageUrl = "";
    let imageAlt = "";
    if (figureMatch) {
      const imgTag = figureMatch[0].match(/<img[^>]*>/i)?.[0] || "";
      imageUrl = imgTag.match(/src=['\"]([^'\"]+)['\"]/i)?.[1] || "";
      imageAlt = imgTag.match(/alt=['\"]([^'\"]*)['\"]/i)?.[1] || "";
    }

    const author =
      html.match(/<meta[^>]*name=['\"]author['\"][^>]*content=['\"]([^'\"]+)['\"]/i)?.[1] || "";
    const authorSlug = author
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    entries.push({
      title,
      url: `/articles/${file}`,
      description,
      publishDate,
      imageUrl,
      imageAlt,
      author,
      authorSlug,
    });
  }

  entries.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));
  return entries.slice(0, limit);
}
