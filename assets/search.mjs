const loading = document.getElementById("loading");
const searchInput = document.getElementById("search");

function debounce(fn, wait = 300) {
  let timeout;

  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), wait);
  };
}

function renderPosts(posts) {
  const container = document.getElementById("results");
  container.innerHTML = "";

  posts.forEach((post) => {
    const human = new Date(post.publishDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `
    <a
        aria-label="${post.imageAlt}"
        href="${post.url}">
        <picture>
            <img
                src="${post.imageUrl}"
                srcset="
                ${post.imageUrl}&dpr=2 2x,
                ${post.imageUrl} 1x
                "
                sizes="(min-width:38rem) 38rem, 100vw"
                alt="${post.imageAlt}"
                loading="lazy"
                decoding="async"
                width="1080"
                height="385"
            />
        </picture>
    </a>

    <h3><a href="${post.url}">${post.title}</a></h3>

     <div id="published">
        Published:
        <em
        ><time itemprop="datePublished" datetime="${post.publishDate}">
            ${human}</time
        ></em
        >
    </div>

  <p>${post.description}</p>
`;
    container.appendChild(div);
  });
  loading.style.display = "none";
}

function setupSearch(posts) {
  const fuse = new Fuse(posts, { keys: ["title", "description"] });
  const debouncedHandler = debounce((e) => {
    loading.style.display = "initial";

    const query = e.target.value.trim();
    const results = query ? fuse.search(query).map((r) => r.item) : posts;
    renderPosts(results);
  });

  searchInput.addEventListener("input", debouncedHandler);
}

(async function init() {
  const res = await fetch("assets/search.json");
  const posts = await res.json();
  renderPosts(posts);
  setupSearch(posts);

  const params = new URLSearchParams(window.location.search);
  const query = params.get("query") || "";
  searchInput.value = query;

  if (query) {
    // "fake" an input event so setupSearch’s listener does the work
    searchInput.dispatchEvent(new Event("input"));
  }
  search.disabled = false;
})();
