#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd());
const ARTICLES_DIR = path.join(ROOT, 'articles');

async function* walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else {
      yield full;
    }
  }
}

function getIndentAt(str, index) {
  const nl = str.lastIndexOf('\n', index);
  let i = nl + 1;
  let indent = '';
  while (i < index && (str[i] === ' ' || str[i] === '\t')) {
    indent += str[i++];
  }
  return indent;
}

function fixArticleSections(html) {
  const artStart = html.indexOf('<article');
  if (artStart === -1) return { html, changed: false };
  const artOpenEnd = html.indexOf('>', artStart) + 1;
  const artEnd = html.indexOf('</article>', artOpenEnd);
  if (artEnd === -1) return { html, changed: false };

  const head = html.slice(0, artOpenEnd);
  let body = html.slice(artOpenEnd, artEnd);
  const tail = html.slice(artEnd);

  let changed = false;

  // Remove stray closing sections before any opening
  let beforeLen;
  do {
    beforeLen = body.length;
    body = body.replace(/^[\s\n\r]*<\/section>\s*/m, (m) => {
      changed = true;
      return '';
    });
  } while (body.length !== beforeLen);

  // Insert missing </section> before a new <section> when previous is still open (avoid nesting)
  const tagRe = /<\/?section\b[^>]*>/g;
  let depth = 0;
  let lastIndex = 0;
  let result = '';
  let lastOpenIndent = '';
  let match;
  while ((match = tagRe.exec(body)) !== null) {
    const token = match[0];
    const idx = match.index;
    result += body.slice(lastIndex, idx);
    if (/^<section\b/i.test(token)) {
      // If a section is already open, close it before starting a new one
      if (depth > 0) {
        const indent = getIndentAt(body, idx);
        result += `\n${indent}</section>`;
        changed = true;
        depth = 0; // We closed the previous top-level section
      }
      result += token;
      depth += 1;
      lastOpenIndent = getIndentAt(body, idx);
    } else {
      // closing token
      result += token;
      depth = Math.max(0, depth - 1);
      lastOpenIndent = '';
    }
    lastIndex = tagRe.lastIndex;
  }
  result += body.slice(lastIndex);

  // If a section remains open, close it before </article>
  if (depth > 0) {
    const indent = lastOpenIndent || '        ';
    result += `\n${indent}</section>`;
    changed = true;
  }

  return { html: head + result + tail, changed };
}

async function main() {
  let files = 0;
  for await (const file of walk(ARTICLES_DIR)) {
    if (!file.endsWith('.html')) continue;
    const original = await fs.readFile(file, 'utf8');
    const { html, changed } = fixArticleSections(original);
    if (changed) {
      await fs.writeFile(file, html, 'utf8');
      console.log(`Fixed markup in ${file}`);
      files++;
    }
  }
  console.log(`Done. Files fixed: ${files}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

