window.addEventListener("DOMContentLoaded", () => {
  const loading = document.getElementById("loading");
  const showMoreButton = document.getElementById("show-more-button");
  const latestFeatured = document.getElementById("latest-featured");
  const latestGrid = document.getElementById("latest-grid");

  if (loading && showMoreButton && latestFeatured && latestGrid) {
    let allPosts = [];
    let loadedCount =
      latestFeatured.querySelectorAll(".card").length +
      latestGrid.querySelectorAll(".card").length;
    let isFetching = !1;

    async function loadMore() {
      if (isFetching) return;
      if (
        ((isFetching = !0),
        (loading.style.display = "block"),
        (showMoreButton.disabled = !0),
        0 === allPosts.length)
      ) {
        const e = await fetch("assets/search.json");
        (allPosts = await e.json()),
          allPosts.sort(
            (e, t) =>
              new Date(t.publishDate).getTime() -
              new Date(e.publishDate).getTime()
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
        (n.className = "card"),
          (n.innerHTML = `\n    <a\n     aria-label="${e.imageAlt}"\n        href="${e.url}"\n    >\n        <picture>\n            <img\n                src="${e.imageUrl}"\n                srcset="\n                ${e.imageUrl} 200w,\n                ${e.imageUrl}&dpr=2 400w\n    "\n                sizes="(min-width:76rem) 18rem, 100vw"\n                alt="${e.imageAlt}"\n                loading="lazy"\n                decoding="async"\n                width="200"\n                height="75"\n            />\n        </picture>\n    </a>\n\n    <h3><a href="${e.url}">${e.title}</a></h3>\n\n     <div id="published">\n        Published:\n        <em><time itemprop="datePublished" datetime="${e.publishDate}">\n            ${t}</time\n        ></em>\n    </div>\n\n  <p>${e.description}</p>\n`),
          latestGrid.appendChild(n);
      }),
        (loadedCount += e.length),
        (loading.style.display = "none"),
        (showMoreButton.disabled = !1),
        (isFetching = !1),
        loadedCount >= allPosts.length &&
          (showMoreButton.style.display = "none");
    }
    showMoreButton.addEventListener("click", loadMore);
  }
});
