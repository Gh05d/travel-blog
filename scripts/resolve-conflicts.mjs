#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

async function* walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      // Skip .git
      if (e.name === '.git') continue;
      yield* walk(full);
    } else {
      yield full;
    }
  }
}

async function main() {
  let fixed = 0;
  const conflictRe = /<<<<<<<[\s\S]*?=======([\s\S]*?)>>>>>>>[ \t].*\n?/g;
  const blockRe = /<<<<<<<[^\n]*\n([\s\S]*?)\n=======\n([\s\S]*?)\n>>>>>>>[^\n]*\n?/g;
  for await (const file of walk(ROOT)) {
    // Only process text-like files
    if (!/(html|css|js|mjs|json|md|txt)$/i.test(file)) continue;
    const src = await fs.readFile(file, 'utf8');
    if (!src.includes('<<<<<<<')) continue;
    // Replace conflict blocks preferring the incoming (right) side
    let updated = src;
    let prev;
    do {
      prev = updated;
      updated = updated.replace(blockRe, (_m, _left, right) => right);
    } while (updated !== prev);

    if (updated !== src) {
      await fs.writeFile(file, updated, 'utf8');
      console.log(`Resolved conflicts in ${file}`);
      fixed += 1;
    }
  }
  console.log(`Done. Files fixed: ${fixed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

