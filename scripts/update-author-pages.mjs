import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const articlesDir = join(root, 'articles');
const authorsDir = join(root, 'authors');

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Gather articles by author
const articleFiles = (await readdir(articlesDir)).filter(f => f.endsWith('.html')).sort();
const authorMap = new Map();

for (const file of articleFiles) {
  const html = await readFile(join(articlesDir, file), 'utf8');
  const author = html.match(/<meta[^>]*name=["']author["'][^>]*content=["']([^"']+)["']/i)?.[1];
  if (!author) continue;
  const rawTitle = html.match(/<title>([^<]+)<\/title>/i)?.[1].replace(/\s+/g, ' ').trim() || file;
  const title = rawTitle.replace(/^Travel Guide \|\s*/i, '');
  if (!authorMap.has(author)) authorMap.set(author, []);
  authorMap.get(author).push({ file, title });
}

for (const [author, articles] of authorMap.entries()) {
  const slug = slugify(author);
  const authorFile = join(authorsDir, `${slug}.html`);
  let html;
  try {
    html = await readFile(authorFile, 'utf8');
  } catch {
    continue; // author page doesn't exist
  }

  articles.sort((a, b) => a.title.localeCompare(b.title));
  const listItems = articles
    .map(a => `        <li><a href="/articles/${a.file}" rel="author">${a.title}</a></li>`)
    .join('\n');

  const listHtml = `      <h2>Articles by ${author}</h2>\n      <ul>\n${listItems}\n      </ul>`;

  html = html.replace(/\n\s*<h2>Articles(?: by [^<]+)?<\/h2>\s*<ul>[\s\S]*?<\/ul>/, `\n${listHtml}`);
  html = html.replace(
    '<p><a href="/about-us.html">Back to About Us</a></p>',
    '<p><a rel="nofollow" href="/about-us.html">Back to About Us</a></p>'
  );

  await writeFile(authorFile, html);
}
