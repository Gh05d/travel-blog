const loading = document.getElementById("loading"),
  showMoreButton = document.getElementById("show-more-button"),
  latestFeatured = document.getElementById("latest-featured"),
  latestGrid = document.getElementById("latest-grid");

let allPosts = [],
  loadedCount =
    latestFeatured.querySelectorAll(".card").length +
    latestGrid.querySelectorAll(".card").length,
  isFetching = !1;

async function loadMore() {
  if (isFetching) return;
  isFetching = !0;
  loading.style.display = "block";
  showMoreButton.disabled = !0;
  if (0 === allPosts.length) {
    const e = await fetch("assets/search.json");
    allPosts = await e.json();
    allPosts.sort(
      (e, t) =>
        new Date(t.publishDate).getTime() - new Date(e.publishDate).getTime()
    );
  }
  const e = allPosts.slice(loadedCount, loadedCount + 10);
  e.forEach((e) => {
    const t = new Date(e.publishDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      n = document.createElement("div");
    n.className = "card";
    n.innerHTML = `
    <a
        aria-label="${e.imageAlt}"
        href="${e.url}"
    >
        <picture>
            <img
                src="${e.imageUrl}"
                srcset="
                ${e.imageUrl} 200w,
                ${e.imageUrl}&dpr=2 400w
                "
                sizes="(min-width:76rem) 18rem, 100vw"
                alt="${e.imageAlt}"
                loading="lazy"
                decoding="async"
                width="200"
                height="75"
            />
        </picture>
    </a>

    <h3><a href="${e.url}">${e.title}</a></h3>

     <div id="published">
        Published:
        <em><time itemprop="datePublished" datetime="${e.publishDate}">
            ${t}</time
        ></em>
    </div>

  <p>${e.description}</p>
`;
    latestGrid.appendChild(n);
  }),
    (loadedCount += e.length),
    (loading.style.display = "none"),
    (showMoreButton.disabled = !1),
    (isFetching = !1),
    loadedCount >= allPosts.length && (showMoreButton.style.display = "none");
}
showMoreButton.addEventListener("click", loadMore);

