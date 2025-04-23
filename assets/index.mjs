(async function fetchPosts() {
  const res = await fetch("assets/search.json");
  const posts = await res.json();
  renderPosts(posts);
  setupSearch(posts);
})();

function renderPosts(posts) {
  const container = document.getElementById("posts");
  container.innerHTML = "";
  posts.forEach((post) => {
    const div = document.createElement("div");
    div.className = "post";
    div.innerHTML = `
     <a class="post-title" href="${post.url}">${post.title}</a>
     <div class="post-excerpt">${post.excerpt}</div>
   `;
    container.appendChild(div);
  });
}

function setupSearch(posts) {
  const fuse = new Fuse(posts, { keys: ["title", "excerpt"] });
  document.getElementById("search").addEventListener("input", (e) => {
    document.getElementById("loading").style.display = "initial";

    const results = fuse.search(e.target.value);
    const matched = e.target.value ? results.map((r) => r.item) : posts;
    document.getElementById("loading").style.display = "none";
    renderPosts(matched);
  });
}

(async function fetchPosts() {
  const res = await fetch("assets/search.json");
  const posts = await res.json();
  renderPosts(posts);
  setupSearch(posts);
  document.getElementById("loading").style.display = "none";
})();
