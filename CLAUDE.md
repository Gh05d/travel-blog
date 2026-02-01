# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static HTML travel blog for exitfloridakeys.com, hosted on GitHub Pages. Uses vanilla HTML/CSS/JavaScript with Node.js automation scripts.

## Common Commands

All automation runs via GitHub Actions when pushing to `articles/**`. To run scripts locally:

```bash
# Update search index
node scripts/update-search-index.mjs

# Update homepage and latest articles pages
node scripts/update-latest-posts.mjs

# Inject sidebars into article pages
node scripts/update-sidebar.mjs

# Update author profile pages
node scripts/update-author-pages.mjs

# Inject secondary placeholder images
node scripts/inject-secondary-figures.mjs

# Update site navigation
node scripts/update-site-nav.mjs
```

No local package.json is tracked. CI workflows install dependencies inline (PostCSS, Terser, Fuse.js).

## Architecture

### Content Structure
- `articles/` - HTML article files (kebab-case naming)
- `authors/` - Author profile pages
- `assets/styles/` - CSS (minified in CI)
- `assets/scripts/` - Client-side JS modules (minified in CI)
- `assets/search.json` - Auto-generated search index consumed by Fuse.js

### Automation Scripts (`/scripts`)
Build scripts use ES Modules (`.mjs`) with Node.js native APIs. They perform regex-based HTML manipulation to inject content:
- Sidebars with recent/hot articles
- Secondary placeholder images from Picsum.photos
- Navigation headers across all pages
- Author article lists

Shared utilities live in `/scripts/lib/`.

### GitHub Actions Workflows
Push to `articles/**` triggers:
1. `update-search-index.yml` - Runs sidebar, figures, search, author, latest posts, and nav scripts
2. `update-latest-posts.yml` - Updates index.html and article listing pages
3. `generate-sitemap.yml` - Regenerates sitemap.xml/txt with article timestamps
4. `minify.yml` - Compresses CSS (PostCSS) and JS (Terser)

### Article Metadata
Scripts extract metadata from HTML using regex:
- Title: `<meta property="og:title">` (strips "Travel Guide |" prefix)
- Description: `<p itemprop="description">`
- Author: `<meta name="author">`
- Date: `<time datetime="...">`
- Image: First `<figure><img>` src/alt

### Client-Side Features
- Search powered by Fuse.js reading from `assets/search.json`
- Lazy loading on all images
- Responsive images with srcset (WebP, AVIF, JPG formats)

## Conventions

- Article filenames: kebab-case slugs (e.g., `african-safari-experience.html`)
- Author filenames: lowercase with hyphens (e.g., `frank-axton.html`)
- Feature branches: `codex/*` for manual changes
- Automated branches: `automated/sitemap-update`
- All scripts use ES Modules syntax
- HTML manipulation uses regex patterns (no DOM parsers)

## Deployment

Master branch deploys to GitHub Pages. Custom domain configured via CNAME file.
