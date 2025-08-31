import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const articlesDir = join(root, "articles");

const sidebarLink = '<link rel="stylesheet" href="../assets/styles/sidebar.css" />';
const sidebarMarkup = `      <aside id="sidebar">
        <section>
          <h2>Search</h2>
          <form action="/search-results" method="get">
            <input
              type="search"
              name="query"
              placeholder="Search articles..."
              aria-label="Search articles"
            />
          </form>
        </section>
        <section>
          <h2>Recent Articles</h2>
          <ul>
            <li>
              <a
                href="/articles/african-safari-experience-a-journey-into-the-wild.html"
                >The African Safari Experience: A Journey into the Wild</a
              >
            </li>
            <li>
              <a
                href="/articles/architectural-marvels-modern-wonders-world.html"
                >Architectural Marvels: A Closer Look at Modern Wonders of the
                World</a
              >
            </li>
            <li>
              <a href="/articles/behind-scenes-worlds-largest-festivals.html"
                >Behind the Scenes: How the World's Largest Festivals are
                Organized</a
              >
            </li>
            <li>
              <a href="/articles/best-safari-destinations.html"
                >Best Safari Destinations</a
              >
            </li>
            <li>
              <a href="/articles/best-travel-apps.html">Best Travel Apps</a>
            </li>
          </ul>
        </section>
        <section>
          <h2>Hot Articles</h2>
          <ul>
            <li>
              <a href="/articles/eco-friendly-traveling-world-sustainably.html"
                >Eco-Friendly Traveling: Exploring the World Sustainably</a
              >
            </li>
            <li>
              <a href="/articles/top-surfing-destinations-world.html"
                >Top Surfing Destinations in the World</a
              >
            </li>
            <li>
              <a href="/articles/travel-budget-tips.html"
                >Essential Travel Budget Tips</a
              >
            </li>
            <li>
              <a href="/articles/exploring-unesco-sites.html"
                >Exploring UNESCO Sites</a
              >
            </li>
            <li>
              <a href="/articles/solo-travel-safety-guide.html"
                >Solo Travel Safety Guide</a
              >
            </li>
          </ul>
        </section>
        <section id="random-image">
          <img
            src="https://picsum.photos/200"
            alt="Random travel photo from Picsum.photos"
          />
        </section>
        <section>
          <h2>Travel Quote</h2>
          <blockquote>
            Traveling – it leaves you speechless, then turns you into a
            storyteller.
          </blockquote>
        </section>
      </aside>`;

const articleFiles = (await readdir(articlesDir)).filter((f) =>
  f.endsWith(".html")
);

for (const file of articleFiles) {
  const filePath = join(articlesDir, file);
  const html = await readFile(filePath, "utf8");
  let updated = html;

  if (!html.includes("../assets/styles/sidebar.css")) {
    updated = updated.replace(
      /<link rel="stylesheet" href="\.\.\/assets\/styles\/style\.css" \/>/,
      `$&\n    ${sidebarLink}`
    );
  }

  if (!html.includes('<aside id="sidebar">')) {
    updated = updated.replace(/<\/main>/, `${sidebarMarkup}\n    </main>`);
  }

  if (updated !== html) {
    await writeFile(filePath, updated);
  }
}
