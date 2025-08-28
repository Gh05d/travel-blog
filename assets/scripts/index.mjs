window.addEventListener("DOMContentLoaded", () => {
  const loading = document.getElementById("loading");
  const showMoreButton = document.getElementById("show-more-button");
  const featured = document.getElementById("latest-featured");
  const grid = document.getElementById("latest-grid");

  if (loading && showMoreButton && featured && grid) {
    let articles = [];
    let loadedCount =
      featured.querySelectorAll(".card").length +
      grid.querySelectorAll(".card").length;
    let isLoading = false;

    async function loadMore(count) {
      if (isLoading) return;
      isLoading = true;
      loading.style.display = "block";
      showMoreButton.disabled = true;

      if (articles.length === 0) {
        const response = await fetch("assets/search.json");
        articles = await response.json();
        articles.sort(
          (a, b) =>
            new Date(b.publishDate).getTime() -
            new Date(a.publishDate).getTime()
        );
      }

      const next = articles.slice(loadedCount, loadedCount + count);
      next.forEach((article) => {
        const published = new Date(article.publishDate).toLocaleDateString(
          "en-US",
          { year: "numeric", month: "long", day: "numeric" }
        );
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
    <a
     aria-label="${article.imageAlt}"
        href="${article.url}"
    >
        <picture>
            <img
                src="${article.imageUrl}"
                srcset="
                ${article.imageUrl} 200w,
                ${article.imageUrl}&dpr=2 400w
    "
                sizes="(min-width:76rem) 18rem, 100vw"
                alt="${article.imageAlt}"
        loading="lazy"
                decoding="async"
                width="200"
                height="75"
            />
        </picture>
    </a>

    <h3><a href="${article.url}">${article.title}</a></h3>

     <div id="published">
        Published:
        <em><time itemprop="datePublished" datetime="${article.publishDate}">
            ${published}</time
        ></em>
    </div>

  <p>${article.description}</p>
`;
        grid.appendChild(card);
      });

      loadedCount += next.length;
      loading.style.display = "none";
      showMoreButton.disabled = false;
      isLoading = false;

      if (loadedCount >= articles.length) {
        showMoreButton.style.display = "none";
      }
    }

    // Load enough articles upfront to fill the initial layout
    loadMore(10);

    showMoreButton.addEventListener("click", () => loadMore(10));
  }
});
