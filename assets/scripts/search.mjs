const loading = document.getElementById("loading"),
  searchInput = document.getElementById("search");

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
  posts.forEach((e) => {
    const date = new Date(e.publishDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const card = document.createElement("div");
    card.className = "card";
    const img = e.imageUrl
      .replace(/w=\d+/g, "w=1300")
      .replace(/h=\d+/g, "h=500");
    card.innerHTML = `
    <a
        aria-label="${e.imageAlt}"
        href="${e.url}">
        <picture>
            <img
         src="${img}"
                srcset="
                ${img}&dpr=2 2x,
                ${img} 1x
                "
           sizes="(min-width:38rem) 38rem, 100vw"
                alt="${e.imageAlt}"
                loading="lazy"
        decoding="async"
                width="1300"
                height="500"
            />
        </picture>
    </a>

    <h3><a href="${e.url}">${e.title}</a></h3>

     <div id="published">
        By <a href="/authors/${e.authorSlug}.html">${e.author}</a> | Published:
        <em><time itemprop="datePublished" datetime="${e.publishDate}">
            ${date}</time>
        </em>
    </div>

  <p>${e.description}</p>
    `;
    results.appendChild(card);
  });
  loading.style.display = "none";
}

function setupSearch(data) {
  const fuse = new Fuse(data, {
    keys: ["title", "description", "publishDate"],
  });
  const handler = debounce((evt) => {
    loading.style.display = "initial";
    const term = evt.target.value.trim();
    renderPosts(term ? fuse.search(term).map((r) => r.item) : data);
  });
  searchInput.addEventListener("input", handler);
}

!async function () {
  const resp = await fetch("assets/search.json"),
    data = await resp.json();
  renderPosts(data);
  setupSearch(data);
  const query = new URLSearchParams(window.location.search).get("query") || "";
  searchInput.value = query;
  if (query) searchInput.dispatchEvent(new Event("input"));
  searchInput.disabled = false;
}();

