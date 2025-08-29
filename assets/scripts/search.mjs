const loading = document.getElementById("loading");
const searchInput = document.getElementById("search");

function debounce(fn, delay = 300) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

function renderPosts(posts) {
  const results = document.getElementById("results");
  results.innerHTML = "";
  posts.forEach((post) => {
    const published = new Date(post.publishDate).toLocaleDateString(
      "en-US",
      { year: "numeric", month: "long", day: "numeric" }
    );
    const card = document.createElement("div");
    card.className = "card";
    const imageUrl = post.imageUrl
      .replace(/w=\d+/g, "w=1300")
      .replace(/h=\d+/g, "h=500");
    card.innerHTML = `
    <a
        aria-label="${post.imageAlt}"
        href="${post.url}">
        <picture>
            <img
                src="${imageUrl}"
                srcset="
                ${imageUrl}&dpr=2 2x,
                ${imageUrl} 1x
                "
                sizes="(min-width:38rem) 38rem, 100vw"
                alt="${post.imageAlt}"
                loading="lazy"
                decoding="async"
                width="1300"
                height="500"
            />
        </picture>
    </a>

    <h3><a href="${post.url}">${post.title}</a></h3>

     <div id="published">
        Published:
        <em><time itemprop="datePublished" datetime="${post.publishDate}">
            ${published}</time>
        </em>
    </div>

  <p>${post.description}</p>
    `;
    results.appendChild(card);
  });
  loading.style.display = "none";
}

function setupSearch(posts) {
  const fuse = new Fuse(posts, {
    keys: ["title", "description", "publishDate"],
  });
  const handler = debounce((evt) => {
    loading.style.display = "initial";
    const query = evt.target.value.trim();
    renderPosts(query ? fuse.search(query).map((r) => r.item) : posts);
  });
  searchInput.addEventListener("input", handler);
}

(async function () {
  const response = await fetch("assets/search.json");
  const posts = await response.json();
  renderPosts(posts);
  setupSearch(posts);
  const query = new URLSearchParams(window.location.search).get("query") || "";
  searchInput.value = query;
  if (query) searchInput.dispatchEvent(new Event("input"));
  searchInput.disabled = false;
})();
