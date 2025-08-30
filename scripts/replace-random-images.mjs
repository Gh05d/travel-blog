#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd());
const ARTICLES_DIR = path.join(ROOT, 'articles');

function buildSnippet(seed) {
  const base = `https://picsum.photos/seed/${seed}`;
  return `          <picture>
            <!-- Desktop -->
            <source
              type="image/webp"
              media="(min-width:76rem)"
              srcset="${base}/1080/400.webp"
            />
            <source
              media="(min-width:76rem)"
              srcset="${base}/1080/400.jpg"
            />

            <!-- Tablet -->
            <source
              type="image/webp"
              media="(min-width:38rem)"
              srcset="${base}/800/300.webp"
            />
            <source
              media="(min-width:38rem)"
              srcset="${base}/800/300.jpg"
            />

            <!-- Mobile Fallback -->
            <img
              src="${base}/400/200.jpg"
              alt="Random placeholder photo"
              title="Photo via https://picsum.photos"
              width="1080"
              height="400"
              loading="lazy"
              decoding="async"
            />
          </picture>`;
}

// Recursively collect files under a directory
async function* walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(fullPath);
    } else {
      yield fullPath;
    }
  }
}

// Replace <picture> blocks that contain random placeholders
function replaceRandomPictures(html, seed) {
  const re = /<picture[\s\S]*?<\/picture>/g; // non-greedy match across lines
  let count = 0;
  const replaced = html.replace(re, (match) => {
    // Only replace if the block contains random placeholders
    const hasRandom = /source\.unsplash\.com\/random|picsum\.photos\/(?:\d+)/.test(match);
    if (!hasRandom) return match;

    count += 1;
    // Try to preserve the starting indentation
    const indentationMatch = match.match(/^(\s*)<picture/m);
    const indent = indentationMatch ? indentationMatch[1] : '';
    // Indent each line of snippet with the detected indent
    const indented = buildSnippet(seed)
      .split('\n')
      .map((line) => (line.length ? indent + line : line))
      .join('\n');
    return indented;
  });

  return { replaced, count };
}

async function main() {
  let totalFiles = 0;
  let totalBlocks = 0;
  for await (const file of walk(ARTICLES_DIR)) {
    if (!file.endsWith('.html')) continue;
    const original = await fs.readFile(file, 'utf8');
    // Use the article URL path as a deterministic seed, URL-encoded
    const relativePath = '/' + path.relative(ROOT, file).replace(/\\/g, '/');
    const seed = encodeURIComponent(relativePath);
    const { replaced, count } = replaceRandomPictures(original, seed);
    if (count > 0) {
      await fs.writeFile(file, replaced, 'utf8');
      totalFiles += 1;
      totalBlocks += count;
      console.log(`Updated ${file} (replaced ${count} picture block${count>1?'s':''})`);
    }
  }

  console.log(`\nDone. Files updated: ${totalFiles}, picture blocks replaced: ${totalBlocks}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
