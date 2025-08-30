#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd());
const ARTICLES_DIR = path.join(ROOT, 'articles');

const snippet = `          <picture>
            <!-- Desktop -->
            <source
              type="image/webp"
              media="(min-width:76rem)"
              srcset="https://picsum.photos/1080/400.webp?random=1"
            />
            <source
              media="(min-width:76rem)"
              srcset="https://picsum.photos/1080/400.jpg?random=1"
            />

            <!-- Tablet -->
            <source
              type="image/webp"
              media="(min-width:38rem)"
              srcset="https://picsum.photos/800/300.webp?random=2"
            />
            <source
              media="(min-width:38rem)"
              srcset="https://picsum.photos/800/300.jpg?random=2"
            />

            <!-- Mobile Fallback -->
            <img
              src="https://picsum.photos/400/200.jpg?random=3"
              alt="Random placeholder photo"
              width="1080"
              height="400"
              loading="lazy"
              decoding="async"
            />
          </picture>`;

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
function replaceRandomPictures(html) {
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
    const indented = snippet
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
    const { replaced, count } = replaceRandomPictures(original);
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

