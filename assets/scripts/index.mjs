window.addEventListener("DOMContentLoaded", () => {
  const loading = document.getElementById("loading");
  const showMoreButton = document.getElementById("show-more-button");
  const latestGrid = document.getElementById("latest-grid");

  // Ensure required elements exist
  if (!(loading && showMoreButton && latestGrid)) return;

  let searchIndex = [];
  // Count posts already rendered on the page (latest posts grid)
  let loadedCount =
    document.getElementById("latest-posts")?.children?.length || 0;
  let isLoading = false;

  async function loadPosts(count, showSpinner = true) {
    if (isLoading) return;
    isLoading = true;

    if (showSpinner) loading.style.display = "block";
    showMoreButton.disabled = true;

    if (searchIndex.length === 0) {
      const res = await fetch("assets/search.json");
      searchIndex = await res.json();
      searchIndex.sort(
        (a, b) => new Date(b.publishDate) - new Date(a.publishDate)
      );
    }

    const slice = searchIndex.slice(loadedCount, loadedCount + count);

    slice.forEach((post) => {
      const published = new Date(post.publishDate).toLocaleDateString(
        "en-US",
        { year: "numeric", month: "long", day: "numeric" }
      );

      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
 <a aria-label="${post.imageAlt}" href="${post.url}">
   <picture>
     <img
       src="${post.imageUrl}"
       srcset="
         ${post.imageUrl} 200w,
         ${post.imageUrl}&dpr=2 400w
       "
       sizes="(min-width:76rem) 18rem, 100vw"
       alt="${post.imageAlt}"
       loading="lazy"
       decoding="async"
       width="200"
       height="75"
     />
   </picture>
 </a>
 <h3><a href="${post.url}">${post.title}</a></h3>
 <div id="published">
   Published:
   <em><time itemprop="datePublished" datetime="${post.publishDate}">
     ${published}
   </time></em>
 </div>
 <p>${post.description}</p>
      `;

      latestGrid.appendChild(card);
    });

    loadedCount += slice.length;

    loading.style.display = "none";
    showMoreButton.disabled = false;
    isLoading = false;

    if (loadedCount >= searchIndex.length) {
      showMoreButton.style.display = "none";
    }
  }

  // Load initial posts without showing spinner
  loadPosts(10, false);

  showMoreButton.addEventListener("click", () => loadPosts(10));
});

