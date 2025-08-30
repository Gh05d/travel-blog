import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import crypto from 'node:crypto';

const articlesDir = join(process.cwd(), 'articles');
const files = (await readdir(articlesDir)).filter(f => f.endsWith('.html'));

for (const file of files) {
  const filePath = join(articlesDir, file);
  let html = await readFile(filePath, 'utf8');
  const replacements = {};
  html = html.replace(/(https:\/\/picsum\.photos\/seed\/)([^\/]+)/g, (match, prefix, slug) => {
    if (!replacements[slug]) {
      const words = slug.split('-').slice(0, 4).join('-');
      const seed = crypto.randomBytes(3).toString('hex');
      replacements[slug] = `${words}-${seed}`;
    }
    return `${prefix}${replacements[slug]}`;
  });
  await writeFile(filePath, html);
}
