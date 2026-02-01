import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const articlesDir = join(process.cwd(), "articles");
const siteUrl = "https://exitfloridakeys.com";
const siteName = "Travel Guide";
const twitterHandle = "Memopolis228816";

async function patchArticle(filePath) {
  let html = await readFile(filePath, "utf8");
  const filename = filePath.split("/").pop();

  // Extract metadata from existing HTML
  const titleMatch = html.match(/<meta property="og:title"\s+content="([^"]+)"/);
  const title = titleMatch ? titleMatch[1] : "";

  const authorMatch = html.match(/<meta name="author" content="([^"]+)"/);
  const author = authorMatch ? authorMatch[1] : "";
  const authorSlug = author.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");

  const dateMatch = html.match(/<time[^>]*datetime="([^"]+)"/);
  const publishedDate = dateMatch ? dateMatch[1] : new Date().toISOString().split("T")[0];
  const isoDateTime = publishedDate.includes("T") ? publishedDate : `${publishedDate}T00:00:00Z`;

  const descMatch = html.match(/<meta name="description" content="([^"]+)"/);
  const description = descMatch ? descMatch[1] : "";

  const imageMatch = html.match(/<meta property="og:image"\s+content="([^"]+)"/);
  const heroImageUrl = imageMatch ? imageMatch[1] : "";

  const articleUrl = `${siteUrl}/articles/${filename}`;
  const authorUrl = `${siteUrl}/authors/${authorSlug}.html`;

  // Extract destination from title for contextual alt text
  const destination = title.split(":")[0].trim();

  // 1. Fix Twitter handle
  html = html.replace(
    /<meta name="twitter:site"\s+content="@[^"]+"\s*\/>/,
    `<meta name="twitter:site"        content="@${twitterHandle}" />`
  );

  // 2. Add OG article times if not present
  if (!html.includes('article:published_time')) {
    html = html.replace(
      /<meta property="og:site_name"\s+content="[^"]+"\s*\/>/,
      `<meta property="og:site_name"   content="${siteName}" />\n  <meta property="article:published_time" content="${isoDateTime}" />\n  <meta property="article:modified_time" content="${isoDateTime}" />\n  <meta property="article:author" content="${authorUrl}" />`
    );
  }

  // 3. Update Schema.org JSON-LD with publisher, dateModified, author.url
  const schemaRegex = /<script type="application\/ld\+json">\s*\{[\s\S]*?"@type":\s*"Article"[\s\S]*?\}\s*<\/script>/;
  const schemaMatch = html.match(schemaRegex);

  if (schemaMatch) {
    const newArticleSchema = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": title,
      "description": description,
      "author": {
        "@type": "Person",
        "name": author,
        "url": authorUrl
      },
      "publisher": {
        "@type": "Organization",
        "name": siteName,
        "logo": {
          "@type": "ImageObject",
          "url": `${siteUrl}/assets/logo.png`
        }
      },
      "datePublished": publishedDate,
      "dateModified": publishedDate,
      "image": heroImageUrl,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": articleUrl
      }
    };

    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": siteUrl
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Articles",
          "item": `${siteUrl}/latest-articles.html`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": title,
          "item": articleUrl
        }
      ]
    };

    const newSchemaBlock = `<script type="application/ld+json">
${JSON.stringify(newArticleSchema, null, 2)}
  </script>

  <!-- Schema.org JSON-LD: BreadcrumbList -->
  <script type="application/ld+json">
${JSON.stringify(breadcrumbSchema, null, 2)}
  </script>`;

    html = html.replace(schemaRegex, newSchemaBlock);
  }

  // 4. Fix generic alt text on middle image
  html = html.replace(
    /(<figure id="middle-image">[\s\S]*?<img[^>]*alt=")Article image(")/,
    `$1Travel scene related to ${destination}$2`
  );

  await writeFile(filePath, html);
  return filename;
}

async function main() {
  const files = (await readdir(articlesDir)).filter((f) => f.endsWith(".html"));

  console.log(`Found ${files.length} articles to patch...\n`);

  for (const file of files) {
    const filePath = join(articlesDir, file);
    try {
      const patched = await patchArticle(filePath);
      console.log(`✓ Patched: ${patched}`);
    } catch (err) {
      console.error(`✗ Error patching ${file}: ${err.message}`);
    }
  }

  console.log("\nDone! All articles patched with SEO improvements.");
}

main();
