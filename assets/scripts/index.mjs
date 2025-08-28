window.addEventListener("DOMContentLoaded", () => {
  const loadingElement = document.getElementById("loading");
  const showMoreButton = document.getElementById("show-more-button");
  const featuredContainer = document.getElementById("latest-featured");
  const gridContainer = document.getElementById("latest-grid");

  if (!loadingElement || !showMoreButton || !featuredContainer || !gridContainer) {
    return;
  }

  let allArticles = [];
  let displayedCount =
    featuredContainer.querySelectorAll(".card").length +
    gridContainer.querySelectorAll(".card").length;
  let isLoading = false;

  async function loadArticles(count, showLoading = true) {
    if (isLoading) {
      return;
    }

    isLoading = true;
    if (showLoading) {
      loadingElement.style.display = "block";
    }
    showMoreButton.disabled = true;

    if (allArticles.length === 0) {
      const response = await fetch("assets/search.json");
      allArticles = await response.json();
      allArticles.sort(
        (a, b) => new Date(b.publishDate) - new Date(a.publishDate)
      );
    }

    const newArticles = allArticles.slice(displayedCount, displayedCount + count);

    newArticles.forEach((article) => {
      const formattedDate = new Date(article.publishDate).toLocaleDateString(
        "en-US",
        { year: "numeric", month: "long", day: "numeric" }
      );
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
 <a aria-label="${article.imageAlt}" href="${article.url}">
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
     ${formattedDate}
   </time></em>
 </div>
 <p>${article.description}</p>
      `;
      gridContainer.appendChild(card);
    });

    displayedCount += newArticles.length;
    loadingElement.style.display = "none";
    showMoreButton.disabled = false;
    isLoading = false;

    if (displayedCount >= allArticles.length) {
      showMoreButton.style.display = "none";
    }
  }

  loadArticles(10, false);
  showMoreButton.addEventListener("click", () => loadArticles(10));
});
