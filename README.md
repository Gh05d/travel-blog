# Travel Blog

This repository contains static content for the travel blog.

## Search index

The `assets/search.json` file is regenerated automatically. Pushing changes to any file in `articles/` triggers a GitHub Actions workflow that runs `node scripts/update-search-index.mjs` to rebuild the index with article metadata.

