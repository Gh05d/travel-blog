function renderPosts(posts) {
  const container = document.getElementById("latest");
  container.innerHTML = "";
  posts.forEach((post) => {
    const div = document.createElement("div");
    //     div.className = "post";
    //     div.innerHTML = `
    //      <a class="post-title" href="${post.url}">${post.title}</a>
    //      <div class="post-excerpt">${post.excerpt}</div>
    //    `;
    div.className = "card";
    div.innerHTML = `
    <h3>
    <a
      href="/articles/${post.url}"
      >${post.title}</a
    </a>
  </h3>

  <p>${post.excerpt}</p>
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

(async function init() {
  const res = await fetch("assets/search.json");
  const posts = await res.json();
  renderPosts(posts);
  setupSearch(posts);
  document.getElementById("loading").style.display = "none";
})();
